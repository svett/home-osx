// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var path = require("path");
var internalError_1 = require("./internalError");
var internalErrorCode_1 = require("./internalErrorCode");
var ErrorHelper = (function () {
    function ErrorHelper() {
    }
    ErrorHelper.getInternalError = function (errorCode) {
        var optionalArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalArgs[_i - 1] = arguments[_i];
        }
        var message = ErrorHelper.getErrorMessage.apply(ErrorHelper, [errorCode].concat(optionalArgs));
        return new internalError_1.InternalError(errorCode, message);
    };
    ErrorHelper.getNestedError = function (innerError, errorCode) {
        var optionalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            optionalArgs[_i - 2] = arguments[_i];
        }
        var message = ErrorHelper.getErrorMessage.apply(ErrorHelper, [errorCode].concat(optionalArgs));
        return new internalError_1.NestedError(errorCode, message, innerError);
    };
    ErrorHelper.wrapError = function (error, innerError) {
        return internalError_1.NestedError.getWrappedError(error, innerError);
    };
    ErrorHelper.getWarning = function (message) {
        var optionalArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalArgs[_i - 1] = arguments[_i];
        }
        return new internalError_1.InternalError(-1, message, internalError_1.InternalErrorLevel.Warning);
    };
    ErrorHelper.getNestedWarning = function (innerError, message) {
        var optionalArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            optionalArgs[_i - 2] = arguments[_i];
        }
        return new internalError_1.NestedError(-1, message, innerError, null /* extras */, internalError_1.InternalErrorLevel.Warning);
    };
    ErrorHelper.getErrorMessage = function (errorCode) {
        var optionalArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalArgs[_i - 1] = arguments[_i];
        }
        var errorStrings = require(ErrorHelper.errorStringsJsonLoc);
        return ErrorHelper.formatErrorMessage.apply(ErrorHelper, [errorStrings[internalErrorCode_1.InternalErrorCode[errorCode]]].concat(optionalArgs));
    };
    ErrorHelper.formatErrorMessage = function (errorMessage) {
        var optionalArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalArgs[_i - 1] = arguments[_i];
        }
        if (!errorMessage) {
            return errorMessage;
        }
        var result = errorMessage;
        var args = ErrorHelper.getOptionalArgsArrayFromFunctionCall(arguments, 1);
        if (args) {
            for (var i = 0; i < args.length; i++) {
                result = result.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
            }
        }
        return result;
    };
    ErrorHelper.getOptionalArgsArrayFromFunctionCall = function (functionArguments, startIndex) {
        if (functionArguments.length <= startIndex) {
            return null;
        }
        if (Array.isArray(functionArguments[startIndex])) {
            return functionArguments[startIndex];
        }
        return Array.prototype.slice.apply(functionArguments, [startIndex]);
    };
    ErrorHelper.errorStringsJsonLoc = path.resolve(__dirname, "..", "..", "..", "errorStrings", "errorStrings.json");
    return ErrorHelper;
}());
exports.ErrorHelper = ErrorHelper;

//# sourceMappingURL=errorHelper.js.map
