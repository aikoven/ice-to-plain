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

// hack to get an object containing all top-level Slice modules
const rootIceModule = (Ice as any)._ModuleRegistry.type({split: () => []});

function cacheConstructors(iceModule: {[key: string]: any}, prefix?: string) {
  for (const key of Object.keys(iceModule)) {
    const value = iceModule[key];

    if (value.constructor === Object) {
      // value is a module
      const name = key[0] === '_' ? key.substr(1) : key;
      const typePath = prefix == null ? name : `${prefix}.${name}`;
      cacheConstructors(value, typePath);
    } else if (typeof value === 'function') {
      if (
        isStructConstructor(value) ||
        isEnumConstructor(value) ||
        value === Value ||
        value.prototype instanceof Value ||
        value.prototype instanceof Exception ||
        value.prototype instanceof ObjectPrx
      ) {
        const name = key[0] === '_' ? key.substr(1) : key;
        const typePath = prefix == null ? name : `${prefix}.${name}`;
        typeMap.set(value, typePath);
      }
    }
  }
}

cacheConstructors(rootIceModule);

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
    // cache types again to handle case when module containing type was loaded
    // after `ice-to-plain`
    cacheConstructors(rootIceModule);
    type = typeMap.get(value.constructor);
  }

  if (type == null) {
    throw new Error(`Could not find type for ${JSON.stringify(value)}`);
  }

  return type;
}

function getConstructor(type: string): any {
  let result = rootIceModule;

  for (const name of type.split('.')) {
    result = result[name] || result['_' + name];
    if (result == null) {
      break;
    }
  }

  if (typeof result !== 'function') {
    throw new Error(`Could not find constructor for type ${type}`);
  }

  return result;
}

const TYPE_KEY = '@@type';
export {TYPE_KEY};

const LONG_TYPE = 'Ice.Long';
export {LONG_TYPE};

export type PlainLong =
  | {
      [TYPE_KEY]: typeof LONG_TYPE;
      value: number;
    }
  | {
      [TYPE_KEY]: typeof LONG_TYPE;
      high: number;
      low: number;
    };

function longToPlain(long: Ice.Long): PlainLong {
  // serialize to number if possible
  const value = long.toNumber();

  if (
    value !== Number.POSITIVE_INFINITY &&
    value !== Number.NEGATIVE_INFINITY
  ) {
    return {
      [TYPE_KEY]: LONG_TYPE,
      value,
    };
  } else {
    return {
      [TYPE_KEY]: LONG_TYPE,
      high: long.high,
      low: long.low,
    };
  }
}

function longToJson(long: Ice.Long) {
  // serialize to number if possible
  const value = long.toNumber();

  if (
    value !== Number.POSITIVE_INFINITY &&
    value !== Number.NEGATIVE_INFINITY
  ) {
    return `{"@@type":"Ice.Long","value":${value}}`;
  } else {
    return `{"@@type":"Ice.Long","high":${long.high},"low":${long.low}}`;
  }
}

function longFromPlain(plainLong: any): Ice.Long {
  if (plainLong.value != null) {
    return new Long(plainLong.value);
  } else {
    return new Long(plainLong.high, plainLong.low);
  }
}

export type PlainEnum = {
  [TYPE_KEY]: string;
  value: string;
};

function enumToPlain(enumValue: Ice.EnumBase<string>): PlainEnum {
  const {name} = enumValue;
  const value = name[0] === '_' ? name.substr(1) : name;
  return {
    [TYPE_KEY]: getType(enumValue),
    value,
  };
}

function enumToJson(enumValue: Ice.EnumBase<string>) {
  const {name} = enumValue;
  const value = name[0] === '_' ? name.substr(1) : name;
  return `{"@@type":"${getType(enumValue)}","value":"${value}"}`;
}

function enumFromPlain(
  constructor: {[name: string]: Ice.EnumBase<string>},
  plainEnum: any,
): Ice.EnumBase<string> {
  return constructor[plainEnum.value] || constructor['_' + plainEnum.value];
}

export type PlainProxy = {
  [TYPE_KEY]: string;
  value: string;
};

function proxyToPlain(proxy: Ice.ObjectPrx): PlainProxy {
  return {
    [TYPE_KEY]: getType(proxy),
    value: proxy.toString(),
  };
}

function proxyToJson(proxy: Ice.ObjectPrx) {
  const valueJson = stringToJson(proxy.toString());
  return `{"@@type":"${getType(proxy)}","value":${valueJson}}`;
}

const MAP_TYPE = 'Map';
export {MAP_TYPE};

export type PlainMap<V = any> = {
  [TYPE_KEY]: typeof MAP_TYPE;
  entries: {[keyJson: string]: V};
};

function stringifyMapKey(
  key: string | number | boolean | Ice.EnumBase<string>,
  stringifier: Stringifier,
) {
  switch (typeof key) {
    case 'number':
    case 'boolean':
      return '' + key;
    case 'string':
      return stringToJson(key as string);
    default:
      return stringifier(key)!;
  }
}

function mapToPlain(
  map: Map<string | number | boolean | Ice.EnumBase<string>, any>,
  customizer: Customizer,
): PlainMap {
  const entries: {[key: string]: any} = {};

  const ret: PlainMap = {
    [TYPE_KEY]: MAP_TYPE,
    entries,
  };

  const stringifier: Stringifier = value => JSON.stringify(customizer(value));

  for (const [key, value] of map.entries()) {
    entries[stringifyMapKey(key, stringifier)] = customizer(value);
  }

  return ret;
}

function mapToJson(
  map: Map<string | number | boolean | Ice.EnumBase<string>, any>,
  stringifier: Stringifier,
): string {
  let ret = '{"@@type":"Map","entries":{';
  let comma = false;

  for (const [key, value] of map.entries()) {
    const valueJson = stringifier(value);
    if (valueJson === undefined) {
      continue;
    }
    if (comma) {
      ret += ',';
    }
    ret += stringToJson(stringifyMapKey(key, stringifier)) + ':' + valueJson;
    comma = true;
  }

  return ret + '}}';
}

function mapFromPlain(
  plainMap: any,
  customizer: Customizer,
): Map<string | number | boolean, any> {
  const {entries} = plainMap;

  const ret = new Map<string | number | boolean, any>();

  for (const key of Object.keys(entries)) {
    ret.set(customizer(JSON.parse(key)), customizer(entries[key]));
  }

  return ret;
}

const HASH_MAP_TYPE = 'Ice.HashMap';
export {HASH_MAP_TYPE};

export type PlainHashMap<K = any, V = any> = {
  [TYPE_KEY]: typeof HASH_MAP_TYPE;
  entries: Array<{key: K; value: V}>;
};

function hashMapToPlain(
  hashMap: Ice.HashMap<Ice.HashMapKey, any>,
  customizer: Customizer,
): PlainHashMap {
  const entries: Array<{key: any; value: any}> = [];

  const ret: PlainHashMap = {
    [TYPE_KEY]: HASH_MAP_TYPE,
    entries,
  };

  for (const [key, value] of hashMap.entries()) {
    entries.push({
      key: customizer(key),
      value: customizer(value),
    });
  }

  return ret;
}

function hashMapToJson(
  hashMap: Ice.HashMap<Ice.HashMapKey, any>,
  stringifier: Stringifier,
): string {
  let ret = '{"@@type":"Ice.HashMap","entries":[';
  let comma = false;

  for (const [key, value] of hashMap.entries()) {
    const valueJson = stringifier(value);
    if (valueJson === undefined) {
      continue;
    }

    const keyJson = stringifier(key);
    if (keyJson === undefined) {
      continue;
    }

    if (comma) {
      ret += ',';
    }
    ret += `{"key":${keyJson},"value":${valueJson}}`;
    comma = true;
  }

  return ret + ']}';
}

function hashMapFromPlain(
  plainHashMap: any,
  customizer: Customizer,
): Ice.HashMap<{equals(other: any): boolean; hashCode(): number}, any> {
  const {entries} = plainHashMap;

  const ret = new HashMap<
    {equals(other: any): boolean; hashCode(): number},
    any
  >(HashMap.compareEquals);

  for (const {key, value} of entries) {
    ret.set(customizer(key), customizer(value));
  }

  return ret;
}

const SET_TYPE = 'Set';
export {SET_TYPE};

export type PlainSet<V = any> = {
  [TYPE_KEY]: typeof SET_TYPE;
  value: V[];
};

function setToPlain(set: Set<any>, customizer: Customizer): PlainSet {
  const values: any[] = [];

  for (const item of set) {
    values.push(customizer(item));
  }

  return {
    [TYPE_KEY]: SET_TYPE,
    value: values,
  };
}

function setToJson(set: Set<any>, stringifier: Stringifier): string {
  let ret = '{"@@type":"Set","value":[';
  let comma = false;

  for (const value of set) {
    const valueJson = stringifier(value);
    if (valueJson === undefined) {
      continue;
    }
    if (comma) {
      ret += ',';
    }
    ret += valueJson;
    comma = true;
  }

  return ret + ']}';
}

function setFromPlain(plainSet: any, customizer: Customizer): Set<any> {
  const res = new Set();

  for (const item of plainSet.value) {
    res.add(customizer(item));
  }

  return res;
}

const internalFields = new Set([
  '_inToStringAlready', // exceptions
]);

const keywords = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

function objectToPlain(
  value: Ice.Value | Ice.Exception | Ice.Struct,
  customizer: Customizer,
): any {
  const ret: any = {
    [TYPE_KEY]: getType(value),
  };

  for (const key of Object.keys(value)) {
    if (internalFields.has(key)) {
      continue;
    }

    const name = key[0] === '_' ? key.substr(1) : key;

    ret[name] = customizer((value as any)[key]);
  }

  return ret;
}

function objectToJson(
  value: Ice.Value | Ice.Exception | Ice.Struct,
  stringifier: Stringifier,
) {
  let objectStringifier = objectStringifiers.get(value.constructor);

  if (objectStringifier == null) {
    objectStringifier = createObjectStringifier(value);
    objectStringifiers.set(value.constructor, objectStringifier);
  }

  return objectStringifier(value, stringifier);
}

type ObjectStringifier = (
  value: Ice.Value | Ice.Exception | Ice.Struct,
  stringifier: (value: any) => string | undefined,
) => string;

const objectStringifiers = new Map<
  Function, // constructor
  ObjectStringifier
>();

function createObjectStringifier(
  value: Ice.Value | Ice.Exception | Ice.Struct,
): ObjectStringifier {
  let body =
    `'use strict';\n` + `let v; let ret = '{"@@type":"${getType(value)}"';\n`;

  for (const key of Object.keys(value)) {
    if (internalFields.has(key)) {
      continue;
    }

    const name = key[0] === '_' ? key.substr(1) : key;

    body +=
      `v = stringifier(value.${key}); ` +
      `if (v !== undefined) ret += ',"${name}":' + v;\n`;
  }

  body += `return ret + '}'`;

  return Function('value', 'stringifier', body) as any;
}

function objectFromPlain<T extends Ice.Struct | Ice.Object | Ice.Exception>(
  constructor: {new (): T},
  plainObject: any,
  customizer: Customizer,
): T {
  const ret: any = new constructor();

  for (const key of Object.keys(plainObject)) {
    if (key === TYPE_KEY) {
      continue;
    }

    const name = keywords.has(key.toLowerCase()) ? '_' + key : key;

    ret[name] = customizer(plainObject[key]);
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

// copied from pino
//
// magically escape strings for json
// relying on their charCodeAt
// everything below 32 needs JSON.stringify()
// 34 and 92 happens all the time, so we
// have a fast case for them
function stringToJson(str: string) {
  var result = '';
  var last = 0;
  var found = false;
  var point = 255;
  const l = str.length;
  if (l > 100) {
    return JSON.stringify(str);
  }
  for (var i = 0; i < l && point >= 32; i++) {
    point = str.charCodeAt(i);
    if (point === 34 || point === 92) {
      result += str.slice(last, i) + '\\';
      last = i;
      found = true;
    }
  }
  if (!found) {
    result = str;
  } else {
    result += str.slice(last);
  }
  return point < 32 ? JSON.stringify(str) : '"' + result + '"';
}

function arrayToJson(array: Array<any>, stringifier: Stringifier): string {
  let ret = '[';
  let comma = false;
  for (const item of array) {
    const itemJson = stringifier(item);
    if (comma) {
      ret += ',';
    }
    ret += itemJson === undefined ? 'null' : itemJson;
    comma = true;
  }
  return ret + ']';
}

function plainObjectToJson(
  obj: {[key: string]: any},
  stringifier: Stringifier,
): string {
  let ret = '{';
  let comma = false;
  for (const key of Object.keys(obj)) {
    const valueJson = stringifier((obj as any)[key]);
    if (valueJson === undefined) {
      continue;
    }
    if (comma) {
      ret += ',';
    }
    ret += stringToJson(key) + ':' + valueJson;
    comma = true;
  }
  return ret + '}';
}

export type Customizer = (value: any) => any;

export function iceToPlain(
  iceValue: any,
  customizer: Customizer = iceToPlain,
): any {
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
    const res: any[] = [];
    for (const item of iceValue) {
      res.push(customizer(item));
    }
    return res;
  }

  if (iceValue instanceof Map) {
    return mapToPlain(iceValue, customizer);
  }

  if (iceValue instanceof HashMap) {
    return hashMapToPlain(iceValue, customizer);
  }

  if (iceValue instanceof Set) {
    return setToPlain(iceValue, customizer);
  }

  if (
    iceValue instanceof Value ||
    iceValue instanceof Exception ||
    isStructConstructor(iceValue.constructor)
  ) {
    return objectToPlain(iceValue, customizer);
  }

  if (iceValue instanceof ObjectPrx) {
    return proxyToPlain(iceValue);
  }

  return mapValues(iceValue, customizer);
}

export type Stringifier = (value: any) => string | undefined;

export function iceToJson(
  value: any,
  stringifier: Stringifier = iceToJson,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  switch (typeof value) {
    case 'number':
    case 'boolean':
      return '' + value;
    case 'string':
      return stringToJson(value as string);
    case 'object':
      if (value === null) {
        return 'null';
      }

      if (value instanceof Long) {
        return longToJson(value);
      }

      if (value instanceof EnumBase) {
        return enumToJson(value);
      }

      if (
        value instanceof Value ||
        value instanceof Exception ||
        isStructConstructor(value.constructor)
      ) {
        return objectToJson(value as any, stringifier);
      }

      if (value instanceof ObjectPrx) {
        return proxyToJson(value);
      }

      if (value instanceof Map) {
        return mapToJson(value, stringifier);
      }

      if (value instanceof HashMap) {
        return hashMapToJson(value, stringifier);
      }

      if (value instanceof Set) {
        return setToJson(value, stringifier);
      }

      if (Array.isArray(value)) {
        return arrayToJson(value, stringifier);
      }

      return plainObjectToJson(value, stringifier);
  }

  return undefined;
}

export function iceFromPlain(
  plainValue: any,
  customizer: Customizer = iceFromPlain,
): any {
  if (plainValue === null || typeof plainValue !== 'object') {
    return plainValue;
  }

  if (Array.isArray(plainValue)) {
    const res: any[] = [];
    for (const item of plainValue) {
      res.push(customizer(item));
    }
    return res;
  }

  const iceType: string | undefined = plainValue[TYPE_KEY];

  if (iceType == null) {
    return mapValues(plainValue, customizer);
  }

  if (iceType === LONG_TYPE) {
    return longFromPlain(plainValue);
  }

  if (iceType === MAP_TYPE) {
    return mapFromPlain(plainValue, customizer);
  }

  if (iceType === HASH_MAP_TYPE) {
    return hashMapFromPlain(plainValue, customizer);
  }

  if (iceType === SET_TYPE) {
    return setFromPlain(plainValue, customizer);
  }

  if (iceType.endsWith('Prx')) {
    throw new Error('Converting proxies from plain is not supported');
  }

  const constructor = getConstructor(iceType);

  if (isEnumConstructor(constructor)) {
    return enumFromPlain(constructor, plainValue);
  }

  return objectFromPlain(constructor, plainValue, customizer);
}
