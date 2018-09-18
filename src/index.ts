import {Ice} from 'ice';

import Long = Ice.Long;
import EnumBase = Ice.EnumBase;
import HashMap = Ice.HashMap;
import Value = Ice.Value;
import Exception = Ice.Exception;
import ObjectPrx = Ice.ObjectPrx;
import Identity = Ice.Identity;

// maps constructor functions to type paths (Module.Type)
// for structs, enums, values, exceptions and proxies
const typeMap = new Map<Function, string>();

function isStructConstructor(constructor: Function) {
  return (
    constructor != null &&
    constructor.prototype.equals === Identity.prototype.equals
  );
}

function isEnumConstructor(constructor: Function) {
  return (
    constructor != null &&
    constructor.prototype.equals === EnumBase.prototype.equals &&
    constructor !== EnumBase
  );
}

function cacheConstructors(iceModule?: any, prefix?: string) {
  if (iceModule == null) {
    // hack to get an object containing all top-level Slice modules
    iceModule = (Ice as any)._ModuleRegistry.type({split: () => []});
  }

  for (const name of Object.keys(iceModule)) {
    const value = iceModule[name];

    const typePath = prefix == null ? name : `${prefix}.${name}`;

    if (value.constructor === Object) {
      // value is a module
      cacheConstructors(value, typePath);
    } else if (typeof value === 'function') {
      if (
        isStructConstructor(value) ||
        isEnumConstructor(value) ||
        value.prototype instanceof Value ||
        value.prototype instanceof Exception ||
        value.prototype instanceof ObjectPrx
      ) {
        typeMap.set(value, typePath);
      }
    }
  }
}

cacheConstructors();

function getType(
  value:
    | Ice.Value
    | Ice.Exception
    | Ice.Struct
    | Ice.EnumBase<string>
    | Ice.ObjectPrx,
): string {
  let type = typeMap.get(value.constructor);

  if (type == null) {
    cacheConstructors();
    type = typeMap.get(value.constructor);
  }

  if (type == null) {
    throw new Error(`Could not find type for ${JSON.stringify(value)}`);
  }

  return type;
}

function getConstructor(type: string): any {
  const constructor = (Ice as any)._ModuleRegistry.type(type);

  if (constructor == null) {
    throw new Error(`Could not find constructor for type ${type}`);
  }

  return constructor;
}

const ICE_TYPE_KEY = '@ice-type';
export {ICE_TYPE_KEY};

const LONG_TYPE = 'Ice.Long';
export {LONG_TYPE};

function longToPlain(long: Ice.Long) {
  // serialize to number if possible
  const value = long.toNumber();

  if (
    value !== Number.POSITIVE_INFINITY &&
    value !== Number.NEGATIVE_INFINITY
  ) {
    return {
      [ICE_TYPE_KEY]: LONG_TYPE,
      value,
    };
  } else {
    return {
      [ICE_TYPE_KEY]: LONG_TYPE,
      high: long.high,
      low: long.low,
    };
  }
}

function longFromPlain(plainLong: any): Ice.Long {
  if (plainLong.value != null) {
    return new Long(plainLong.value);
  } else {
    return new Long(plainLong.high, plainLong.low);
  }
}

function enumToPlain(enumValue: Ice.EnumBase<string>): any {
  return {
    [ICE_TYPE_KEY]: getType(enumValue),
    value: enumValue.name,
  };
}

function enumFromPlain(
  constructor: {[name: string]: Ice.EnumBase<string>},
  plainEnum: any,
): Ice.EnumBase<string> {
  return constructor[plainEnum.value];
}

function proxyToPlain(proxy: Ice.ObjectPrx): any {
  return {
    [ICE_TYPE_KEY]: getType(proxy),
    value: proxy.toString(),
  };
}

const MAP_TYPE = 'Map';
export {MAP_TYPE};

function mapToPlain(
  map: Map<string | number | boolean, any>,
  recursive = true,
): any {
  const entries: {[key: string]: any} = {};

  const ret = {
    [ICE_TYPE_KEY]: MAP_TYPE,
    entries,
  };

  for (const [key, value] of map.entries()) {
    entries[JSON.stringify(key)] = recursive ? iceToPlain(value) : value;
  }

  return ret;
}

function mapFromPlain(
  plainMap: any,
  recursive = true,
): Map<string | number | boolean, any> {
  const {entries} = plainMap;

  const ret = new Map<string | number | boolean, any>();

  for (const key of Object.keys(entries)) {
    ret.set(
      JSON.parse(key),
      recursive ? iceFromPlain(entries[key]) : entries[key],
    );
  }

  return ret;
}

const HASH_MAP_TYPE = 'Ice.HashMap';
export {HASH_MAP_TYPE};

function hashMapToPlain(
  hashMap: Ice.HashMap<Ice.HashMapKey, any>,
  recursive = true,
): any {
  const entries: Array<{key: any; value: any}> = [];

  const ret = {
    [ICE_TYPE_KEY]: HASH_MAP_TYPE,
    entries,
  };

  for (const [key, value] of hashMap.entries()) {
    entries.push({
      key: recursive ? iceToPlain(key) : key,
      value: recursive ? iceToPlain(value) : value,
    });
  }

  return ret;
}

function hashMapFromPlain(
  plainHashMap: any,
  recursive = true,
): Ice.HashMap<{equals(other: any): boolean; hashCode(): number}, any> {
  const {entries} = plainHashMap;

  const ret = new HashMap<
    {equals(other: any): boolean; hashCode(): number},
    any
  >(HashMap.compareEquals);

  for (const {key, value} of entries) {
    ret.set(
      recursive ? iceFromPlain(key) : key,
      recursive ? iceFromPlain(value) : value,
    );
  }

  return ret;
}

const SET_TYPE = 'Set';
export {SET_TYPE};

function setToPlain(set: Set<any>, recursive = true): any {
  const values = [...set];

  return {
    [ICE_TYPE_KEY]: SET_TYPE,
    value: recursive ? values.map(iceToPlainRecursive) : values,
  };
}

function setFromPlain(plainSet: any, recursive = true): Set<any> {
  const items = plainSet.value as any[];

  return new Set(recursive ? items.map(iceFromPlainRecursive) : items);
}

function objectFromPlain<T extends Ice.Struct | Ice.Object | Ice.Exception>(
  constructor: {new (): T},
  plainObject: any,
  recursive = true,
): T {
  const ret = new constructor();

  for (const key of Object.keys(plainObject) as Array<keyof T | '@ice-type'>) {
    if (key === ICE_TYPE_KEY) {
      continue;
    }

    ret[key] = recursive ? iceFromPlain(plainObject[key]) : plainObject[key];
  }

  return ret;
}

function objectToPlain(
  value: Ice.Value | Ice.Exception | Ice.Struct,
  recursive = true,
): any {
  const ret: any = {
    [ICE_TYPE_KEY]: getType(value),
  };

  for (const key of Object.keys(value)) {
    if (key[0] === '_') {
      continue;
    }

    ret[key] = recursive
      ? iceToPlain((value as any)[key])
      : (value as any)[key];
  }

  return ret;
}

function mapValues(
  obj: {[key: string]: any},
  fn: (value: any) => any,
): {[key: string]: any} {
  const ret: {[key: string]: any} = {};

  for (const key of Object.keys(obj)) {
    ret[key] = fn(obj[key]);
  }

  return ret;
}

const iceToPlainRecursive = (value: any) => iceToPlain(value, true);

export function iceToPlain(iceValue: any, recursive = true): any {
  if (iceValue === null || typeof iceValue !== 'object') {
    return iceValue;
  }

  if (iceValue instanceof Long) {
    return longToPlain(iceValue);
  }

  if (iceValue instanceof EnumBase) {
    return enumToPlain(iceValue);
  }

  if (Array.isArray(iceValue)) {
    return recursive ? iceValue.map(iceToPlainRecursive) : iceValue;
  }

  if (iceValue instanceof Map) {
    return mapToPlain(iceValue, recursive);
  }

  if (iceValue instanceof HashMap) {
    return hashMapToPlain(iceValue, recursive);
  }

  if (iceValue instanceof Set) {
    return setToPlain(iceValue, recursive);
  }

  if (
    iceValue instanceof Value ||
    iceValue instanceof Exception ||
    isStructConstructor(iceValue.constructor)
  ) {
    return objectToPlain(iceValue, recursive);
  }

  if (iceValue instanceof ObjectPrx) {
    return proxyToPlain(iceValue);
  }

  return recursive ? mapValues(iceValue, iceToPlainRecursive) : {...iceValue};
}

const iceFromPlainRecursive = (value: any) => iceFromPlain(value, true);

export function iceFromPlain(plainValue: any, recursive = true): any {
  if (plainValue === null || typeof plainValue !== 'object') {
    return plainValue;
  }

  if (Array.isArray(plainValue)) {
    return recursive ? plainValue.map(iceFromPlainRecursive) : plainValue;
  }

  const iceType: string | undefined = plainValue[ICE_TYPE_KEY];

  if (iceType == null) {
    return recursive
      ? mapValues(plainValue, iceFromPlainRecursive)
      : plainValue;
  }

  if (iceType === LONG_TYPE) {
    return longFromPlain(plainValue);
  }

  if (iceType === MAP_TYPE) {
    return mapFromPlain(plainValue, recursive);
  }

  if (iceType === HASH_MAP_TYPE) {
    return hashMapFromPlain(plainValue, recursive);
  }

  if (iceType === SET_TYPE) {
    return setFromPlain(plainValue, recursive);
  }

  if (iceType.endsWith('Prx')) {
    throw new Error('Converting proxies from plain is not supported');
  }

  const constructor = getConstructor(iceType);

  if (isEnumConstructor(constructor)) {
    return enumFromPlain(constructor, plainValue);
  }

  return objectFromPlain(constructor, plainValue, recursive);
}
