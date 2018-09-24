[["js:es6-modules"]]
#pragma once

#include <Ice/BuiltinSequences.ice>

module Test {
  class SmallClass {
    long longField;
  };

  struct TheStruct {
    long longField;
    SmallClass classField;
  };

  sequence<string> PrimitiveSeq;
  sequence<SmallClass> SmallClassSeq;
  sequence<TheStruct> StructSeq;

  enum TheEnum {
    First, Second
  };

  struct KeyStruct {
    int intField;
    string stringField;
    TheEnum enumField;
  };

  dictionary<string, TheStruct> StringKeyDict;
  dictionary<bool, TheStruct> BoolKeyDict;
  dictionary<int, TheStruct> IntKeyDict;
  dictionary<KeyStruct, string> StructKeyDict;

  exception TheError {
    string stringField;
  };

  class RichClass extends SmallClass {
    TheStruct structField;
    TheEnum enumField;

    PrimitiveSeq primitiveSeqField;
    SmallClassSeq smallClassSeqField;
    StructSeq structSeqField;

    StringKeyDict primitiveKeyDictField;

    optional(1) int optionalField;
  };

  module Keywords {
    struct Await {
      int import;
    };

    class Break {
      string yield;
    };

    enum Continue {
      TRY
    };

    dictionary<string, int> Catch;
  };
};
