// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (InternalErrorLevel) {
    InternalErrorLevel[InternalErrorLevel["Error"] = 0] = "Error";
    InternalErrorLevel[InternalErrorLevel["Warning"] = 1] = "Warning";
})(exports.InternalErrorLevel || (exports.InternalErrorLevel = {}));
var InternalErrorLevel = exports.InternalErrorLevel;
var InternalError = (function (_super) {
    __extends(InternalError, _super);
    function InternalError(errorCode, message, errorLevel) {
        if (errorLevel === void 0) { errorLevel = InternalErrorLevel.Error; }
        _super.call(this, message);
        this.errorCode = errorCode;
        this.errorLevel = errorLevel;
        this.message = message;
    }
    Object.defineProperty(InternalError.prototype, "isInternalError", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    return InternalError;
}(Error));
exports.InternalError = InternalError;
var NestedError = (function (_super) {
    __extends(NestedError, _super);
    function NestedError(errorCode, message, innerError, extras, errorLevel) {
        if (innerError === void 0) { innerError = null; }
        if (errorLevel === void 0) { errorLevel = InternalErrorLevel.Error; }
        _super.call(this, errorCode, message, errorLevel);
        this.innerError = innerError;
        this.name = innerError ? innerError.name : null;
        var innerMessage = innerError ? innerError.message : null;
        this.message = innerMessage ? message + ": " + innerMessage : message;
        this._extras = extras;
    }
    Object.defineProperty(NestedError.prototype, "extras", {
        get: function () {
            return this._extras;
        },
        enumerable: true,
        configurable: true
    });
    NestedError.getWrappedError = function (error, innerError) {
        return new NestedError(innerError.errorCode || error.errorCode, error.message, innerError);
    };
    return NestedError;
}(InternalError));
exports.NestedError = NestedError;

//# sourceMappingURL=internalError.js.map
