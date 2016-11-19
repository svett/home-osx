/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var util_1 = require('./util');
var fs = require('fs');
var path = require('path');
var InstallError = (function (_super) {
    __extends(InstallError, _super);
    function InstallError() {
        _super.call(this, 'Error during installation.');
        this._errorMessage = null;
        this._hasMoreErrors = false;
    }
    Object.defineProperty(InstallError.prototype, "hasMoreErrors", {
        get: function () {
            return this._hasMoreErrors;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InstallError.prototype, "errorMessage", {
        get: function () {
            return this._errorMessage;
        },
        set: function (message) {
            if (this._errorMessage !== null) {
                // Take note that we're overwriting a previous error.
                this._hasMoreErrors = true;
            }
            this._errorMessage = message;
        },
        enumerable: true,
        configurable: true
    });
    InstallError.prototype.setHasMoreErrors = function () {
        this._hasMoreErrors = true;
    };
    return InstallError;
}(Error));
exports.InstallError = InstallError;
var DebugInstaller = (function () {
    function DebugInstaller(util) {
        this._util = null;
        this._util = util;
    }
    DebugInstaller.prototype.finishInstall = function () {
        var _this = this;
        var errorBuilder = new InstallError();
        return Promise.resolve().then(function () {
            errorBuilder.installStage = 'rewriteManifest';
            _this.rewriteManifest();
            errorBuilder.installStage = 'writeCompletionFile';
            return util_1.CoreClrDebugUtil.writeEmptyFile(_this._util.installCompleteFilePath());
        }).catch(function (err) {
            if (errorBuilder.errorMessage === null) {
                // Only give the error message if we don't have any better info,
                // as this is usually something similar to "Error: 1".
                errorBuilder.errorMessage = err;
            }
            throw errorBuilder;
        });
    };
    DebugInstaller.prototype.rewriteManifest = function () {
        var manifestPath = path.join(this._util.extensionDir(), 'package.json');
        var manifestString = fs.readFileSync(manifestPath, 'utf8');
        var manifestObject = JSON.parse(manifestString);
        delete manifestObject.contributes.debuggers[0].runtime;
        delete manifestObject.contributes.debuggers[0].program;
        var programString = './.debugger/OpenDebugAD7';
        manifestObject.contributes.debuggers[0].windows = { program: programString + '.exe' };
        manifestObject.contributes.debuggers[0].osx = { program: programString };
        manifestObject.contributes.debuggers[0].linux = { program: programString };
        manifestString = JSON.stringify(manifestObject, null, 2);
        fs.writeFileSync(manifestPath, manifestString);
    };
    return DebugInstaller;
}());
exports.DebugInstaller = DebugInstaller;
//# sourceMappingURL=install.js.map