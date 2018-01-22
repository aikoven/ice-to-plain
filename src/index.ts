import {Ice} from 'ice';

// maps constructor functions to type paths (Module.Type) for structs and enums
const typeMap = new Map<Function, string>();

function isStructConstructor(constructor: Function) {
  return constructor.prototype.equals === Ice.Identity.prototype.equals;
}

function isEnumConstructor(constructor: Function) {
  return (
    constructor.prototype.equals === Ice.EnumBase.prototype.equals &&
    constructor !== Ice.EnumBase
  );
}

function cacheConstructors(iceModule?: any, prefix?: string) {
  if (iceModule == null) {
    // hack to get an object containing all top-level Slice modules
    iceModule = (Ice as any)._ModuleRegistry.type({split: () => []});
  }

  for (const name of Object.keys(iceModule)) {
    const value = iceModule[name];

    if (value.constructor === Object) {
      // value is a module
      cacheConstructors(value, prefix == null ? name : `${prefix}.${name}`);
    } else if (typeof value === 'function') {
      if (isStructConstructor(value) || isEnumConstructor(value)) {
        typeMap.set(value, prefix == null ? name : `${prefix}.${name}`);
      }
    }
  }
}

cacheConstructors();

function getType(enumOrStruct: any): string {
  let type = typeMap.get(enumOrStruct.constructor);

  if (type == null) {
    cacheConstructors();
    type = typeMap.get(enumOrStruct.constructor);
  }

  if (type == null) {
    throw new Error(`Could not find type for ${JSON.stringify(enumOrStruct)}`);
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

export const ICE_TYPE_KEY = '@ice-type';

export const LONG_TYPE = 'Ice.Long';

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
    return new Ice.Long(plainLong.value);
  } else {
    return new Ice.Long(plainLong.high, plainLong.low);
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

export const MAP_TYPE = 'Map';

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

export const HASH_MAP_TYPE = 'Ice.HashMap';

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
): Ice.HashMap<Ice.HashMapKey, any> {
  const {entries} = plainHashMap;

  const ret = new Ice.HashMap<Ice.HashMapKey, any>();

  for (const {key, value} of entries) {
    ret.set(
      recursive ? iceFromPlain(key) : key,
      recursive ? iceFromPlain(value) : value,
    );
  }

  return ret;
}

function structToPlain(struct: Ice.Struct, recursive = true): any {
  const ret: any = {
    [ICE_TYPE_KEY]: getType(struct),
  };

  for (const key of Object.keys(struct) as Array<keyof Ice.Struct>) {
    ret[key] = recursive ? iceToPlain(struct[key]) : struct[key];
  }

  return ret;
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
  value: Ice.Value | Ice.Exception,
  recursive = true,
): any {
  const ret: any = {
    [ICE_TYPE_KEY]: value
      .ice_id()
      .replace(/::/g, '.')
      .slice(1),
  };

  for (const key of Object.keys(value) as Array<keyof Ice.Value>) {
    if (key.startsWith('_')) {
      continue;
    }

    ret[key] = recursive ? iceToPlain(value[key]) : value[key];
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

export function iceToPlain(iceValue: any, recursive = true): any {
  if (iceValue === null || typeof iceValue !== 'object') {
    return iceValue;
  }

  if (iceValue instanceof Ice.Long) {
    return longToPlain(iceValue);
  }

  if (iceValue instanceof Ice.EnumBase) {
    return enumToPlain(iceValue);
  }

  if (Array.isArray(iceValue)) {
    return recursive
      ? iceValue.map(value => iceToPlain(value, true))
      : iceValue;
  }

  if (iceValue instanceof Map) {
    return mapToPlain(iceValue, recursive);
  }

  if (iceValue instanceof Ice.HashMap) {
    return hashMapToPlain(iceValue, recursive);
  }

  if (isStructConstructor(iceValue.constructor)) {
    return structToPlain(iceValue, recursive);
  }

  if (iceValue instanceof Ice.Value || iceValue instanceof Ice.Exception) {
    return objectToPlain(iceValue, recursive);
  }

  return recursive
    ? mapValues(iceValue, value => iceToPlain(value, true))
    : iceValue;
}

export function iceFromPlain(plainValue: any, recursive = true): any {
  if (plainValue === null || typeof plainValue !== 'object') {
    return plainValue;
  }

  if (Array.isArray(plainValue)) {
    return recursive
      ? plainValue.map(value => iceFromPlain(value, true))
      : plainValue;
  }

  const iceType: string | undefined = plainValue[ICE_TYPE_KEY];

  if (iceType == null) {
    return recursive
      ? mapValues(plainValue, value => iceFromPlain(value, true))
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

  const constructor = getConstructor(iceType);

  if (isEnumConstructor(constructor)) {
    return enumFromPlain(constructor, plainValue);
  }

  return objectFromPlain(constructor, plainValue, recursive);
}
