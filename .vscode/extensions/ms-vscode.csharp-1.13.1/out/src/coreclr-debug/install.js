"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const fs = require("fs");
const path = require("path");
class InstallError extends Error {
    get hasMoreErrors() {
        return this._hasMoreErrors;
    }
    get errorMessage() {
        return this._errorMessage;
    }
    set errorMessage(message) {
        if (this._errorMessage !== null) {
            // Take note that we're overwriting a previous error.
            this._hasMoreErrors = true;
        }
        this._errorMessage = message;
    }
    constructor() {
        super('Error during installation.');
        this._errorMessage = null;
        this._hasMoreErrors = false;
    }
    setHasMoreErrors() {
        this._hasMoreErrors = true;
    }
}
exports.InstallError = InstallError;
class DebugInstaller {
    constructor(util) {
        this._util = null;
        this._util = util;
    }
    finishInstall() {
        let errorBuilder = new InstallError();
        return Promise.resolve().then(() => {
            errorBuilder.installStage = 'rewriteManifest';
            this.rewriteManifest();
            errorBuilder.installStage = 'writeCompletionFile';
            return util_1.CoreClrDebugUtil.writeEmptyFile(this._util.installCompleteFilePath());
        }).catch((err) => {
            if (errorBuilder.errorMessage === null) {
                // Only give the error message if we don't have any better info,
                // as this is usually something similar to "Error: 1".
                errorBuilder.errorMessage = err;
            }
            throw errorBuilder;
        });
    }
    rewriteManifest() {
        const manifestPath = path.join(this._util.extensionDir(), 'package.json');
        let manifestString = fs.readFileSync(manifestPath, 'utf8');
        let manifestObject = JSON.parse(manifestString);
        // .NET Core
        delete manifestObject.contributes.debuggers[0].runtime;
        delete manifestObject.contributes.debuggers[0].program;
        let programString = './.debugger/vsdbg-ui';
        manifestObject.contributes.debuggers[0].windows = { program: programString + '.exe' };
        manifestObject.contributes.debuggers[0].osx = { program: programString };
        manifestObject.contributes.debuggers[0].linux = { program: programString };
        // .NET Framework
        delete manifestObject.contributes.debuggers[1].runtime;
        delete manifestObject.contributes.debuggers[1].program;
        manifestObject.contributes.debuggers[1].windows = { program: programString + '.exe' };
        manifestObject.contributes.debuggers[1].osx = { program: programString };
        manifestObject.contributes.debuggers[1].linux = { program: programString };
        manifestString = JSON.stringify(manifestObject, null, 2);
        fs.writeFileSync(manifestPath, manifestString);
    }
}
exports.DebugInstaller = DebugInstaller;
//# sourceMappingURL=install.js.map