// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var internalErrorCode_1 = require("./error/internalErrorCode");
var errorHelper_1 = require("./error/errorHelper");
var ConfigurationReader = (function () {
    function ConfigurationReader() {
    }
    ConfigurationReader.readString = function (value) {
        if (this.isString(value)) {
            return value;
        }
        else {
            throw errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedStringValue, value);
        }
    };
    ConfigurationReader.readBoolean = function (value) {
        if (this.isBoolean(value)) {
            return value;
        }
        else if (value === "true" || value === "false") {
            return value === "true";
        }
        else {
            throw errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedBooleanValue, value);
        }
    };
    ConfigurationReader.readArray = function (value) {
        if (this.isArray(value)) {
            return value;
        }
        else {
            throw errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedArrayValue, value);
        }
    };
    ConfigurationReader.readObject = function (value) {
        if (this.isObject(value)) {
            return value;
        }
        else {
            throw errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedObjectValue, value);
        }
    };
    /* We try to read an integer. It can be either an integer, or a string that can be parsed as an integer */
    ConfigurationReader.readInt = function (value) {
        if (this.isInt(value)) {
            return value;
        }
        else if (this.isString(value)) {
            return parseInt(value, 10);
        }
        else {
            throw errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedIntegerValue, value);
        }
    };
    /* We try to read an integer. If it's a falsable value we return the default value, if not we behave like this.readInt(value)
      If the value is provided but it can't be parsed we'll throw an exception so the user knows that we didn't understand
      the value that was provided */
    ConfigurationReader.readIntWithDefaultSync = function (value, defaultValue) {
        return value ? this.readInt(value) : defaultValue;
    };
    ConfigurationReader.readIntWithDefaultAsync = function (value, defaultValuePromise) {
        var _this = this;
        return defaultValuePromise.then(function (defaultValue) {
            return _this.readIntWithDefaultSync(value, defaultValue);
        });
    };
    ConfigurationReader.isArray = function (value) {
        return Array.isArray(value);
    };
    ConfigurationReader.isObject = function (value) {
        return typeof value === "object" || !ConfigurationReader.isArray(value);
    };
    ConfigurationReader.isString = function (value) {
        return typeof value === "string";
    };
    ConfigurationReader.isBoolean = function (value) {
        return typeof value === "boolean";
    };
    ConfigurationReader.isInt = function (value) {
        return this.isNumber(value) && value % 1 === 0;
    };
    ConfigurationReader.isNumber = function (value) {
        return typeof value === "number";
    };
    return ConfigurationReader;
}());
exports.ConfigurationReader = ConfigurationReader;

//# sourceMappingURL=configurationReader.js.map
