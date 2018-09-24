import {Ice} from 'ice';
import {isEqual} from 'lodash';

import {iceToPlain, iceToJson, iceFromPlain} from './index';
import {Test} from '../fixtures/Test';

function expectEqual(v1: any, v2: any) {
  // use jest equality to check fields and have nice error reporting
  expect(v1).toEqual(v2);
  // use lodash equality to check prototypes
  expect(isEqual(v1, v2)).toBe(true);
}

test('Long', () => {
  // long that can be converted to number
  const smallLong = new Ice.Long(2 ** 40);

  const smallLongPlain = iceToPlain(smallLong);
  expect(smallLongPlain).toMatchSnapshot();
  expect(iceToJson(smallLong)).toEqual(JSON.stringify(smallLongPlain));
  expectEqual(iceFromPlain(smallLongPlain), smallLong);

  // long that can't be converted to number
  const largeLong = new Ice.Long(20000000, 0);

  const largeLongPlain = iceToPlain(largeLong);
  expect(largeLongPlain).toMatchSnapshot();
  expect(iceToJson(largeLong)).toEqual(JSON.stringify(largeLongPlain));
  expectEqual(iceFromPlain(largeLongPlain), largeLong);
});

test('Enum', () => {
  const enumValue = Test.TheEnum.First;

  const enumValuePlain = iceToPlain(enumValue);
  expect(enumValuePlain).toMatchSnapshot();
  expect(iceToJson(enumValue)).toEqual(JSON.stringify(enumValuePlain));
  expectEqual(iceFromPlain(enumValuePlain), enumValue);
});

test('Map with string keys', () => {
  const map: Test.StringKeyDict = new Map();
  map.set(
    'lol',
    new Test.TheStruct(new Ice.Long(42), new Test.SmallClass(new Ice.Long(24))),
  );
  map.set(
    'kek',
    new Test.TheStruct(
      new Ice.Long(123),
      new Test.SmallClass(new Ice.Long(321)),
    ),
  );

  const mapPlain = iceToPlain(map);
  expect(mapPlain).toMatchSnapshot();
  expect(iceToJson(map)).toEqual(JSON.stringify(mapPlain));
  expectEqual(iceFromPlain(mapPlain), map);
});

test('Map with bool keys', () => {
  const map: Test.BoolKeyDict = new Map();
  map.set(
    true,
    new Test.TheStruct(new Ice.Long(42), new Test.SmallClass(new Ice.Long(24))),
  );
  map.set(
    false,
    new Test.TheStruct(
      new Ice.Long(123),
      new Test.SmallClass(new Ice.Long(321)),
    ),
  );

  const mapPlain = iceToPlain(map);
  expect(mapPlain).toMatchSnapshot();
  expect(iceToJson(map)).toEqual(JSON.stringify(mapPlain));
  expectEqual(iceFromPlain(mapPlain), map);
});

test('Map with int keys', () => {
  const map: Test.IntKeyDict = new Map();
  map.set(
    1,
    new Test.TheStruct(new Ice.Long(42), new Test.SmallClass(new Ice.Long(24))),
  );
  map.set(
    -1,
    new Test.TheStruct(
      new Ice.Long(123),
      new Test.SmallClass(new Ice.Long(321)),
    ),
  );

  const mapPlain = iceToPlain(map);
  expect(mapPlain).toMatchSnapshot();
  expect(iceToJson(map)).toEqual(JSON.stringify(mapPlain));
  expectEqual(iceFromPlain(mapPlain), map);
});

test('HashMap', () => {
  const hashMap: Test.StructKeyDict = new Ice.HashMap();

  hashMap.set(new Test.KeyStruct(42, 'foo', Test.TheEnum.First), 'lol');
  hashMap.set(new Test.KeyStruct(24, 'bar', Test.TheEnum.Second), 'kek');

  const hashMapPlain = iceToPlain(hashMap);
  expect(hashMapPlain).toMatchSnapshot();
  expect(iceToJson(hashMap)).toEqual(JSON.stringify(hashMapPlain));
  expect(hashMap.equals(iceFromPlain(hashMapPlain), isEqual)).toBe(true);
});

test('Set', () => {
  const set = new Set([1, 2, 3]);

  const setPlain = iceToPlain(set);
  expect(setPlain).toMatchSnapshot();
  expect(iceToJson(set)).toEqual(JSON.stringify(setPlain));
  expectEqual(iceFromPlain(setPlain), set);
});

test('Struct', () => {
  const struct = new Test.TheStruct(
    new Ice.Long(42),
    new Test.SmallClass(new Ice.Long(24)),
  );

  const structPlain = iceToPlain(struct);
  expect(structPlain).toMatchSnapshot();
  expect(iceToJson(struct)).toEqual(JSON.stringify(structPlain));
  expectEqual(iceFromPlain(structPlain), struct);
});

test('Exception', () => {
  const exception = new Test.TheError('kek');

  const exceptionPlain = iceToPlain(exception);
  expect(exceptionPlain).toMatchSnapshot();
  expect(iceToJson(exception)).toEqual(JSON.stringify(exceptionPlain));
  expectEqual(iceFromPlain(exceptionPlain), exception);
});

test('Value', () => {
  const value = new Test.SmallClass(new Ice.Long(42));

  const valuePlain = iceToPlain(value);
  expect(valuePlain).toMatchSnapshot();
  expect(iceToJson(value)).toEqual(JSON.stringify(valuePlain));
  expectEqual(iceFromPlain(valuePlain), value);
});

test('Proxy', () => {
  const communicator = Ice.initialize();
  const proxy = Ice.LocatorPrx.uncheckedCast(
    communicator.stringToProxy('Category/Name:tcp -h blabla -p 1234')!,
  );

  const proxyPlain = iceToPlain(proxy);
  expect(proxyPlain).toMatchSnapshot();
  expect(iceToJson(proxy)).toEqual(JSON.stringify(proxyPlain));
  expect(() => iceFromPlain(proxyPlain)).toThrowError();
});

test('recursive', () => {
  const obj = {
    string: '123',
    bool: true,
    int: 42,
    null: null,
    undefined: undefined,
    array: [Test.TheEnum.First, new Test.SmallClass(new Ice.Long(42))],
    nested: {
      error: new Test.TheError('kek'),
      struct: new Test.TheStruct(
        new Ice.Long(42),
        new Test.SmallClass(new Ice.Long(24)),
      ),
    },
    rich: new Test.RichClass(
      new Ice.Long(20000000, 0),
      new Test.TheStruct(
        new Ice.Long(42),
        new Test.SmallClass(new Ice.Long(24)),
      ),
      Test.TheEnum.Second,
      ['lol', 'kek'],
      [
        new Test.SmallClass(new Ice.Long(42)),
        new Test.SmallClass(new Ice.Long(24)),
      ],
      [
        new Test.TheStruct(
          new Ice.Long(42),
          new Test.SmallClass(new Ice.Long(24)),
        ),
      ],
      new Map([['foo', new Test.TheStruct()]]),
    ),
  };

  const objPlain = iceToPlain(obj);
  expect(objPlain).toMatchSnapshot();
  expect(iceToJson(obj)).toEqual(JSON.stringify(objPlain));
  expectEqual(iceFromPlain(objPlain), obj);
});

test('plain', () => {
  const obj = {
    undefined: undefined,
    function: () => {},
    number: 1,
    string: 'string',
    boolean: true,
    null: null,
    array: [undefined, 1, 'string', true, null, {lol: 'kek'}],
    nested: {lol: 'kek'},
  };

  expect(iceToJson(obj)).toEqual(JSON.stringify(obj));
});

test('keywords', () => {
  const obj = {
    await: new Test.Keywords._Await(1),
    break: new Test.Keywords._Break(),
    try: Test.Keywords.E._TRY,
    catch: new Test.Keywords._Catch(),
  };

  const objPlain = iceToPlain(obj);
  expect(objPlain).toMatchSnapshot();
  expect(iceToJson(obj)).toEqual(JSON.stringify(objPlain));
  expectEqual(iceFromPlain(objPlain), obj);
});
