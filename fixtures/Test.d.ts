import { Ice } from "ice";

declare module "./Test.ns" {
  namespace Test {
    class SmallClass extends Ice.Value {
      constructor(longField?: Ice.Long);

      longField: Ice.Long;
    }

    class TheStruct implements Ice.Struct {
      constructor(longField?: Ice.Long, classField?: SmallClass | null);

      longField: Ice.Long;
      classField: SmallClass | null;

      clone(): this;
      equals(other: this): boolean;
      hashCode(): number;
    }

    type PrimitiveSeq = Array<string>;

    type SmallClassSeq = Array<SmallClass | null>;

    type StructSeq = Array<TheStruct>;

    type TheEnumName = "First" | "Second";

    class TheEnum<Name extends TheEnumName = TheEnumName> extends Ice.EnumBase<
      Name
    > {
      static First: TheEnum<"First">;
      static Second: TheEnum<"Second">;
    }

    class KeyStruct implements Ice.Struct {
      constructor(intField?: number, stringField?: string, enumField?: TheEnum);

      intField: number;
      stringField: string;
      enumField: TheEnum;

      clone(): this;
      equals(other: this): boolean;
      hashCode(): number;
    }

    type StringKeyDict = Map<string, TheStruct>;
    const StringKeyDict: {
      new (entries?: ReadonlyArray<[string, TheStruct]>): Map<
        string,
        TheStruct
      >;
    };

    type BoolKeyDict = Map<boolean, TheStruct>;
    const BoolKeyDict: {
      new (entries?: ReadonlyArray<[boolean, TheStruct]>): Map<
        boolean,
        TheStruct
      >;
    };

    type IntKeyDict = Map<number, TheStruct>;
    const IntKeyDict: {
      new (entries?: ReadonlyArray<[number, TheStruct]>): Map<
        number,
        TheStruct
      >;
    };

    type StructKeyDict = Ice.HashMap<KeyStruct, string>;
    const StructKeyDict: {
      new (): Ice.HashMap<KeyStruct, string>;
    };

    class TheError extends Ice.UserException {
      constructor(stringField?: string);

      stringField: string;
    }

    class RichClass extends SmallClass {
      constructor(
        longField?: Ice.Long,
        structField?: TheStruct,
        enumField?: TheEnum,
        primitiveSeqField?: PrimitiveSeq,
        smallClassSeqField?: SmallClassSeq,
        structSeqField?: StructSeq,
        primitiveKeyDictField?: StringKeyDict
      );

      structField: TheStruct;
      enumField: TheEnum;
      primitiveSeqField: PrimitiveSeq;
      smallClassSeqField: SmallClassSeq;
      structSeqField: StructSeq;
      primitiveKeyDictField: StringKeyDict;
    }

    namespace Keywords {
      class _Await implements Ice.Struct {
        constructor(_import?: number);

        _import: number;

        clone(): this;
        equals(other: this): boolean;
        hashCode(): number;
      }

      class _Break extends Ice.Value {}

      type EName = "_TRY";

      class E<Name extends EName = EName> extends Ice.EnumBase<Name> {
        static _TRY: E<"_TRY">;
      }

      type _Catch = Map<string, number>;
      const _Catch: {
        new (entries?: ReadonlyArray<[string, number]>): Map<string, number>;
      };
    }
  }
}
export { Test } from "./Test.ns";
