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

    type BoolKeyDict = Map<boolean, TheStruct>;

    type IntKeyDict = Map<number, TheStruct>;

    type StructKeyDict = Ice.HashMap<KeyStruct, string>;

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
  }
}
export { Test } from "./Test.ns";
