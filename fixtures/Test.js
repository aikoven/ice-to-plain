"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Test = undefined;

var _ice = require("ice");

// **********************************************************************
//
// Copyright (c) 2003-2017 ZeroC, Inc. All rights reserved.
//
// This copy of Ice is licensed to you under the terms described in the
// ICE_LICENSE file included in this distribution.
//
// **********************************************************************
//
// Ice version 3.7.0
//
// <auto-generated>
//
// Generated from file `Test.ice'
//
// Warning: do not edit this file.
//
// </auto-generated>
//

const _ModuleRegistry = _ice.Ice._ModuleRegistry;
const Slice = _ice.Ice.Slice;

let Test = _ModuleRegistry.module("Test");

const iceC_Test_SmallClass_ids = ["::Ice::Object", "::Test::SmallClass"];

Test.SmallClass = class extends _ice.Ice.Value {
    constructor(longField = new _ice.Ice.Long(0, 0)) {
        super();
        this.longField = longField;
    }

    _iceWriteMemberImpl(ostr) {
        ostr.writeLong(this.longField);
    }

    _iceReadMemberImpl(istr) {
        this.longField = istr.readLong();
    }
};

Slice.defineValue(Test.SmallClass, iceC_Test_SmallClass_ids[1], false);

Test.SmallClassDisp = class extends _ice.Ice.Object {};

Slice.defineOperations(Test.SmallClassDisp, undefined, iceC_Test_SmallClass_ids, 1);

Test.TheStruct = class {
    constructor(longField = new _ice.Ice.Long(0, 0), classField = null) {
        this.longField = longField;
        this.classField = classField;
    }

    _write(ostr) {
        ostr.writeLong(this.longField);
        ostr.writeValue(this.classField);
    }

    _read(istr) {
        this.longField = istr.readLong();
        istr.readValue(obj => this.classField = obj, Test.SmallClass);
    }

    static get minWireSize() {
        return 9;
    }
};

Slice.defineStruct(Test.TheStruct, false, true);

Slice.defineSequence(Test, "PrimitiveSeqHelper", "Ice.StringHelper", false);

Slice.defineSequence(Test, "SmallClassSeqHelper", "Ice.ObjectHelper", false, "Test.SmallClass");

Slice.defineSequence(Test, "StructSeqHelper", "Test.TheStruct", false);

Test.TheEnum = Slice.defineEnum([['First', 0], ['Second', 1]]);

Test.KeyStruct = class {
    constructor(intField = 0, stringField = "", enumField = Test.TheEnum.First) {
        this.intField = intField;
        this.stringField = stringField;
        this.enumField = enumField;
    }

    _write(ostr) {
        ostr.writeInt(this.intField);
        ostr.writeString(this.stringField);
        Test.TheEnum._write(ostr, this.enumField);
    }

    _read(istr) {
        this.intField = istr.readInt();
        this.stringField = istr.readString();
        this.enumField = Test.TheEnum._read(istr);
    }

    static get minWireSize() {
        return 6;
    }
};

Slice.defineStruct(Test.KeyStruct, true, true);

Slice.defineDictionary(Test, "StringKeyDict", "StringKeyDictHelper", "Ice.StringHelper", "Test.TheStruct", false, undefined, undefined);

Slice.defineDictionary(Test, "BoolKeyDict", "BoolKeyDictHelper", "Ice.BoolHelper", "Test.TheStruct", false, undefined, undefined);

Slice.defineDictionary(Test, "IntKeyDict", "IntKeyDictHelper", "Ice.IntHelper", "Test.TheStruct", false, undefined, undefined);

Slice.defineDictionary(Test, "StructKeyDict", "StructKeyDictHelper", "Test.KeyStruct", "Ice.StringHelper", false, _ice.Ice.HashMap.compareEquals, undefined);

Test.TheError = class extends _ice.Ice.UserException {
    constructor(stringField = "", _cause = "") {
        super(_cause);
        this.stringField = stringField;
    }

    static get _parent() {
        return _ice.Ice.UserException;
    }

    static get _id() {
        return "::Test::TheError";
    }

    _mostDerivedType() {
        return Test.TheError;
    }

    _writeMemberImpl(ostr) {
        ostr.writeString(this.stringField);
    }

    _readMemberImpl(istr) {
        this.stringField = istr.readString();
    }
};

const iceC_Test_RichClass_ids = ["::Ice::Object", "::Test::RichClass", "::Test::SmallClass"];

Test.RichClass = class extends Test.SmallClass {
    constructor(longField, structField = new Test.TheStruct(), enumField = Test.TheEnum.First, primitiveSeqField = null, smallClassSeqField = null, structSeqField = null, primitiveKeyDictField = null) {
        super(longField);
        this.structField = structField;
        this.enumField = enumField;
        this.primitiveSeqField = primitiveSeqField;
        this.smallClassSeqField = smallClassSeqField;
        this.structSeqField = structSeqField;
        this.primitiveKeyDictField = primitiveKeyDictField;
    }

    _iceWriteMemberImpl(ostr) {
        Test.TheStruct.write(ostr, this.structField);
        Test.TheEnum._write(ostr, this.enumField);
        Test.PrimitiveSeqHelper.write(ostr, this.primitiveSeqField);
        Test.SmallClassSeqHelper.write(ostr, this.smallClassSeqField);
        Test.StructSeqHelper.write(ostr, this.structSeqField);
        Test.StringKeyDictHelper.write(ostr, this.primitiveKeyDictField);
    }

    _iceReadMemberImpl(istr) {
        this.structField = Test.TheStruct.read(istr, this.structField);
        this.enumField = Test.TheEnum._read(istr);
        this.primitiveSeqField = Test.PrimitiveSeqHelper.read(istr);
        this.smallClassSeqField = Test.SmallClassSeqHelper.read(istr);
        this.structSeqField = Test.StructSeqHelper.read(istr);
        this.primitiveKeyDictField = Test.StringKeyDictHelper.read(istr);
    }
};

Slice.defineValue(Test.RichClass, iceC_Test_RichClass_ids[1], false);

Test.RichClassDisp = class extends Test.SmallClassDisp {};

Slice.defineOperations(Test.RichClassDisp, undefined, iceC_Test_RichClass_ids, 1);
exports.Test = Test;