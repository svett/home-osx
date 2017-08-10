// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const internalError_1 = require("./internalError");
const internalErrorCode_1 = require("./internalErrorCode");
class ErrorHelper {
    static getInternalError(errorCode, ...optionalArgs) {
        let message = ErrorHelper.getErrorMessage(errorCode, ...optionalArgs);
        return new internalError_1.InternalError(errorCode, message);
    }
    static getNestedError(innerError, errorCode, ...optionalArgs) {
        let message = ErrorHelper.getErrorMessage(errorCode, ...optionalArgs);
        return new internalError_1.NestedError(errorCode, message, innerError);
    }
    static wrapError(error, innerError) {
        return internalError_1.NestedError.getWrappedError(error, innerError);
    }
    static getWarning(message, ...optionalArgs) {
        return new internalError_1.InternalError(-1, message, internalError_1.InternalErrorLevel.Warning);
    }
    static getNestedWarning(innerError, message, ...optionalArgs) {
        return new internalError_1.NestedError(-1, message, innerError, null /* extras */, internalError_1.InternalErrorLevel.Warning);
    }
    static getErrorMessage(errorCode, ...optionalArgs) {
        let errorStrings = require(ErrorHelper.errorStringsJsonLoc);
        return ErrorHelper.formatErrorMessage(errorStrings[internalErrorCode_1.InternalErrorCode[errorCode]], ...optionalArgs);
    }
    static formatErrorMessage(errorMessage, ...optionalArgs) {
        if (!errorMessage) {
            return errorMessage;
        }
        let result = errorMessage;
        let args = ErrorHelper.getOptionalArgsArrayFromFunctionCall(arguments, 1);
        if (args) {
            for (let i = 0; i < args.length; i++) {
                result = result.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
            }
        }
        return result;
    }
    static getOptionalArgsArrayFromFunctionCall(functionArguments, startIndex) {
        if (functionArguments.length <= startIndex) {
            return null;
        }
        if (Array.isArray(functionArguments[startIndex])) {
            return functionArguments[startIndex];
        }
        return Array.prototype.slice.apply(functionArguments, [startIndex]);
    }
}
ErrorHelper.errorStringsJsonLoc = path.resolve(__dirname, "..", "..", "..", "errorStrings", "errorStrings.json");
exports.ErrorHelper = ErrorHelper;

//# sourceMappingURL=errorHelper.js.map
