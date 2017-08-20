/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const semver = require("semver");
const os = require("os");
const common_1 = require("./../common");
const MINIMUM_SUPPORTED_DOTNET_CLI = '1.0.0-preview2-003121';
class DotnetInfo {
}
exports.DotnetInfo = DotnetInfo;
class DotNetCliError extends Error {
}
exports.DotNetCliError = DotNetCliError;
class CoreClrDebugUtil {
    constructor(extensionDir, logger) {
        this._extensionDir = '';
        this._debugAdapterDir = '';
        this._installCompleteFilePath = '';
        this._extensionDir = extensionDir;
        this._debugAdapterDir = path.join(this._extensionDir, '.debugger');
        this._installCompleteFilePath = path.join(this._debugAdapterDir, 'install.complete');
    }
    extensionDir() {
        if (this._extensionDir === '') {
            throw new Error('Failed to set extension directory');
        }
        return this._extensionDir;
    }
    debugAdapterDir() {
        if (this._debugAdapterDir === '') {
            throw new Error('Failed to set debugadpter directory');
        }
        return this._debugAdapterDir;
    }
    installCompleteFilePath() {
        if (this._installCompleteFilePath === '') {
            throw new Error('Failed to set install complete file path');
        }
        return this._installCompleteFilePath;
    }
    static writeEmptyFile(path) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, '', (err) => {
                if (err) {
                    reject(err.code);
                }
                else {
                    resolve();
                }
            });
        });
    }
    defaultDotNetCliErrorMessage() {
        return 'Failed to find up to date dotnet cli on the path.';
    }
    // This function checks for the presence of dotnet on the path and ensures the Version
    // is new enough for us. 
    // Returns: a promise that returns a DotnetInfo class
    // Throws: An DotNetCliError() from the return promise if either dotnet does not exist or is too old. 
    checkDotNetCli() {
        let dotnetInfo = new DotnetInfo();
        return common_1.execChildProcess('dotnet --info', process.cwd())
            .then((data) => {
            let lines = data.replace(/\r/mg, '').split('\n');
            lines.forEach(line => {
                let match;
                if (match = /^\ Version:\s*([^\s].*)$/.exec(line)) {
                    dotnetInfo.Version = match[1];
                }
                else if (match = /^\ OS Version:\s*([^\s].*)$/.exec(line)) {
                    dotnetInfo.OsVersion = match[1];
                }
                else if (match = /^\ RID:\s*([\w\-\.]+)$/.exec(line)) {
                    dotnetInfo.RuntimeId = match[1];
                }
            });
        }).catch((error) => {
            // something went wrong with spawning 'dotnet --info'
            let dotnetError = new DotNetCliError();
            dotnetError.ErrorMessage = 'The .NET CLI tools cannot be located. .NET Core debugging will not be enabled. Make sure .NET CLI tools are installed and are on the path.';
            dotnetError.ErrorString = "Failed to spawn 'dotnet --info'";
            throw dotnetError;
        }).then(() => {
            // succesfully spawned 'dotnet --info', check the Version
            if (semver.lt(dotnetInfo.Version, MINIMUM_SUPPORTED_DOTNET_CLI)) {
                let dotnetError = new DotNetCliError();
                dotnetError.ErrorMessage = 'The .NET CLI tools on the path are too old. .NET Core debugging will not be enabled. The minimum supported version is ' + MINIMUM_SUPPORTED_DOTNET_CLI + '.';
                dotnetError.ErrorString = "dotnet cli is too old";
                throw dotnetError;
            }
            return dotnetInfo;
        });
    }
    static isMacOSSupported() {
        // .NET Core 2.0 requires macOS 10.12 (Sierra), which is Darwin 16.0+
        // Darwin version chart: https://en.wikipedia.org/wiki/Darwin_(operating_system)
        return semver.gte(os.release(), "16.0.0");
    }
    static existsSync(path) {
        try {
            fs.accessSync(path, fs.constants.F_OK);
            return true;
        }
        catch (err) {
            if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
                return false;
            }
            else {
                throw Error(err.code);
            }
        }
    }
    static getPlatformExeExtension() {
        if (process.platform === 'win32') {
            return '.exe';
        }
        return '';
    }
}
exports.CoreClrDebugUtil = CoreClrDebugUtil;
//# sourceMappingURL=util.js.map