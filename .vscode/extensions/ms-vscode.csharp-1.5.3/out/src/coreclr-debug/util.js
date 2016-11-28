/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var path = require('path');
var fs = require('fs');
var semver = require('semver');
var common_1 = require('./../common');
var MINIMUM_SUPPORTED_DOTNET_CLI = '1.0.0-preview2-003121';
var DotnetInfo = (function () {
    function DotnetInfo() {
    }
    return DotnetInfo;
}());
exports.DotnetInfo = DotnetInfo;
var DotNetCliError = (function (_super) {
    __extends(DotNetCliError, _super);
    function DotNetCliError() {
        _super.apply(this, arguments);
    }
    return DotNetCliError;
}(Error));
exports.DotNetCliError = DotNetCliError;
var CoreClrDebugUtil = (function () {
    function CoreClrDebugUtil(extensionDir, logger) {
        this._extensionDir = '';
        this._debugAdapterDir = '';
        this._installCompleteFilePath = '';
        this._extensionDir = extensionDir;
        this._debugAdapterDir = path.join(this._extensionDir, '.debugger');
        this._installCompleteFilePath = path.join(this._debugAdapterDir, 'install.complete');
    }
    CoreClrDebugUtil.prototype.extensionDir = function () {
        if (this._extensionDir === '') {
            throw new Error('Failed to set extension directory');
        }
        return this._extensionDir;
    };
    CoreClrDebugUtil.prototype.debugAdapterDir = function () {
        if (this._debugAdapterDir === '') {
            throw new Error('Failed to set debugadpter directory');
        }
        return this._debugAdapterDir;
    };
    CoreClrDebugUtil.prototype.installCompleteFilePath = function () {
        if (this._installCompleteFilePath === '') {
            throw new Error('Failed to set install complete file path');
        }
        return this._installCompleteFilePath;
    };
    CoreClrDebugUtil.writeEmptyFile = function (path) {
        return new Promise(function (resolve, reject) {
            fs.writeFile(path, '', function (err) {
                if (err) {
                    reject(err.code);
                }
                else {
                    resolve();
                }
            });
        });
    };
    CoreClrDebugUtil.prototype.defaultDotNetCliErrorMessage = function () {
        return 'Failed to find up to date dotnet cli on the path.';
    };
    // This function checks for the presence of dotnet on the path and ensures the Version
    // is new enough for us. 
    // Returns: a promise that returns a DotnetInfo class
    // Throws: An DotNetCliError() from the return promise if either dotnet does not exist or is too old. 
    CoreClrDebugUtil.prototype.checkDotNetCli = function () {
        var dotnetInfo = new DotnetInfo();
        return common_1.execChildProcess('dotnet --info', process.cwd())
            .then(function (data) {
            var lines = data.replace(/\r/mg, '').split('\n');
            lines.forEach(function (line) {
                var match;
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
        }).catch(function (error) {
            // something went wrong with spawning 'dotnet --info'
            var dotnetError = new DotNetCliError();
            dotnetError.ErrorMessage = 'The .NET CLI tools cannot be located. .NET Core debugging will not be enabled. Make sure .NET CLI tools are installed and are on the path.';
            dotnetError.ErrorString = "Failed to spawn 'dotnet --info'";
            throw dotnetError;
        }).then(function () {
            // succesfully spawned 'dotnet --info', check the Version
            if (semver.lt(dotnetInfo.Version, MINIMUM_SUPPORTED_DOTNET_CLI)) {
                var dotnetError = new DotNetCliError();
                dotnetError.ErrorMessage = 'The .NET CLI tools on the path are too old. .NET Core debugging will not be enabled. The minimum supported version is ' + MINIMUM_SUPPORTED_DOTNET_CLI + '.';
                dotnetError.ErrorString = "dotnet cli is too old";
                throw dotnetError;
            }
            return dotnetInfo;
        });
    };
    CoreClrDebugUtil.existsSync = function (path) {
        try {
            fs.accessSync(path, fs.F_OK);
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
    };
    CoreClrDebugUtil.getPlatformExeExtension = function () {
        if (process.platform === 'win32') {
            return '.exe';
        }
        return '';
    };
    return CoreClrDebugUtil;
}());
exports.CoreClrDebugUtil = CoreClrDebugUtil;
//# sourceMappingURL=util.js.map