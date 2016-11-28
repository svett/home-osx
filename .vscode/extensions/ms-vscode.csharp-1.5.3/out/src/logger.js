/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var Logger = (function () {
    function Logger(writer, prefix) {
        this._indentLevel = 0;
        this._indentSize = 4;
        this._atLineStart = false;
        this._writer = writer;
        this._prefix = prefix;
    }
    Logger.prototype._appendCore = function (message) {
        if (this._atLineStart) {
            if (this._indentLevel > 0) {
                var indent = " ".repeat(this._indentLevel * this._indentSize);
                this._writer(indent);
            }
            if (this._prefix) {
                this._writer("[" + this._prefix + "] ");
            }
            this._atLineStart = false;
        }
        this._writer(message);
    };
    Logger.prototype.increaseIndent = function () {
        this._indentLevel += 1;
    };
    Logger.prototype.decreaseIndent = function () {
        if (this._indentLevel > 0) {
            this._indentLevel -= 1;
        }
    };
    Logger.prototype.append = function (message) {
        message = message || "";
        this._appendCore(message);
    };
    Logger.prototype.appendLine = function (message) {
        message = message || "";
        this._appendCore(message + '\n');
        this._atLineStart = true;
    };
    return Logger;
}());
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map