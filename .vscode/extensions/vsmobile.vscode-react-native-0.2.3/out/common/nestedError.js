// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var NestedError = (function (_super) {
    __extends(NestedError, _super);
    function NestedError(message, innerError, extras) {
        _super.call(this, message);
        this._innerError = innerError;
        this.name = innerError.name;
        var innerMessage = innerError.message;
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
    return NestedError;
}(Error));
exports.NestedError = NestedError;

//# sourceMappingURL=nestedError.js.map
