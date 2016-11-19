// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var childProcess_1 = require("./node/childProcess");
var targetPlatformHelper_1 = require("./targetPlatformHelper");
var path = require("path");
/**
 * Defines the identifiers of all the platforms we support.
 */
(function (HostPlatformId) {
    HostPlatformId[HostPlatformId["WINDOWS"] = 0] = "WINDOWS";
    HostPlatformId[HostPlatformId["OSX"] = 1] = "OSX";
    HostPlatformId[HostPlatformId["LINUX"] = 2] = "LINUX";
})(exports.HostPlatformId || (exports.HostPlatformId = {}));
var HostPlatformId = exports.HostPlatformId;
/**
 * IHostPlatform implemenation for the Windows platform.
 */
var WindowsHostPlatform = (function () {
    function WindowsHostPlatform() {
    }
    WindowsHostPlatform.prototype.getUserHomePath = function () {
        return process.env.USERPROFILE;
    };
    WindowsHostPlatform.prototype.setEnvironmentVariable = function (name, value) {
        return new childProcess_1.ChildProcess().exec("setx " + name + " " + value).outcome;
    };
    WindowsHostPlatform.prototype.getSettingsHome = function () {
        return path.join(process.env.APPDATA, "vscode-react-native");
    };
    WindowsHostPlatform.prototype.getNpmCliCommand = function (cliName) {
        return cliName + ".cmd";
    };
    WindowsHostPlatform.prototype.getPipePath = function (pipeName) {
        return "\\\\?\\pipe\\" + pipeName;
    };
    WindowsHostPlatform.prototype.getPlatformId = function () {
        return HostPlatformId.WINDOWS;
    };
    WindowsHostPlatform.prototype.getUserID = function () {
        return process.env.USERNAME;
    };
    WindowsHostPlatform.prototype.isCompatibleWithTarget = function (targetPlatformId) {
        return targetPlatformId === targetPlatformHelper_1.TargetPlatformId.ANDROID || targetPlatformId === targetPlatformHelper_1.TargetPlatformId.EXPONENT;
    };
    return WindowsHostPlatform;
}());
var UnixHostPlatform = (function () {
    function UnixHostPlatform() {
    }
    UnixHostPlatform.prototype.getUserHomePath = function () {
        return process.env.HOME;
    };
    UnixHostPlatform.prototype.getSettingsHome = function () {
        return path.join(process.env.HOME, ".vscode-react-native");
    };
    UnixHostPlatform.prototype.getNpmCliCommand = function (packageName) {
        return packageName;
    };
    UnixHostPlatform.prototype.getPipePath = function (pipeName) {
        return "/tmp/" + pipeName + ".sock";
    };
    return UnixHostPlatform;
}());
/**
 * IHostPlatform implemenation for the OSX platform.
 */
var OSXHostPlatform = (function (_super) {
    __extends(OSXHostPlatform, _super);
    function OSXHostPlatform() {
        _super.apply(this, arguments);
    }
    OSXHostPlatform.prototype.setEnvironmentVariable = function (name, value) {
        return new childProcess_1.ChildProcess().exec("launchctl setenv " + name + " " + value).outcome;
    };
    OSXHostPlatform.prototype.getPlatformId = function () {
        return HostPlatformId.OSX;
    };
    OSXHostPlatform.prototype.getUserID = function () {
        return process.env.LOGNAME;
    };
    OSXHostPlatform.prototype.isCompatibleWithTarget = function (targetPlatformId) {
        return targetPlatformId === targetPlatformHelper_1.TargetPlatformId.ANDROID || targetPlatformId === targetPlatformHelper_1.TargetPlatformId.IOS || targetPlatformId === targetPlatformHelper_1.TargetPlatformId.EXPONENT;
    };
    return OSXHostPlatform;
}(UnixHostPlatform));
/**
 * IHostPlatform implemenation for the Linux platform.
 */
var LinuxHostPlatform = (function (_super) {
    __extends(LinuxHostPlatform, _super);
    function LinuxHostPlatform() {
        _super.apply(this, arguments);
    }
    LinuxHostPlatform.prototype.setEnvironmentVariable = function (name, value) {
        return new childProcess_1.ChildProcess().exec("export " + name + "=" + value).outcome;
    };
    LinuxHostPlatform.prototype.getPlatformId = function () {
        return HostPlatformId.LINUX;
    };
    LinuxHostPlatform.prototype.getUserID = function () {
        return process.env.USER;
    };
    LinuxHostPlatform.prototype.isCompatibleWithTarget = function (targetPlatformId) {
        return targetPlatformId === targetPlatformHelper_1.TargetPlatformId.ANDROID || targetPlatformId === targetPlatformHelper_1.TargetPlatformId.EXPONENT;
    };
    return LinuxHostPlatform;
}(UnixHostPlatform));
/**
 * Allows platform specific operations based on the user's OS.
 */
var HostPlatform = (function () {
    function HostPlatform() {
    }
    Object.defineProperty(HostPlatform, "platform", {
        /**
         * Resolves the dev machine, desktop platform.
         */
        get: function () {
            if (!HostPlatform.platformInstance) {
                switch (process.platform) {
                    case "win32":
                        HostPlatform.platformInstance = new WindowsHostPlatform();
                        break;
                    case "darwin":
                        HostPlatform.platformInstance = new OSXHostPlatform();
                        break;
                    case "linux":
                        HostPlatform.platformInstance = new LinuxHostPlatform();
                        break;
                    default:
                        HostPlatform.platformInstance = new LinuxHostPlatform();
                        break;
                }
            }
            return HostPlatform.platformInstance;
        },
        enumerable: true,
        configurable: true
    });
    HostPlatform.getUserHomePath = function () {
        return HostPlatform.platform.getUserHomePath();
    };
    HostPlatform.getSettingsHome = function () {
        return HostPlatform.platform.getSettingsHome();
    };
    HostPlatform.getNpmCliCommand = function (packageName) {
        return HostPlatform.platform.getNpmCliCommand(packageName);
    };
    HostPlatform.getPipePath = function (pipeName) {
        return HostPlatform.platform.getPipePath(pipeName);
    };
    HostPlatform.getPlatformId = function () {
        return HostPlatform.platform.getPlatformId();
    };
    HostPlatform.setEnvironmentVariable = function (name, value) {
        return HostPlatform.platform.setEnvironmentVariable(name, value);
    };
    /* Returns a value that is unique for each user of this computer */
    HostPlatform.getUserID = function () {
        return HostPlatform.platform.getUserID();
    };
    HostPlatform.isCompatibleWithTarget = function (targetPlatformId) {
        return HostPlatform.platform.isCompatibleWithTarget(targetPlatformId);
    };
    return HostPlatform;
}());
exports.HostPlatform = HostPlatform;

//# sourceMappingURL=hostPlatform.js.map
