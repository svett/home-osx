// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var childProcess_1 = require("../../common/node/childProcess");
var commandExecutor_1 = require("../../common/commandExecutor");
// See android versions usage at: http://developer.android.com/about/dashboards/index.html
(function (AndroidAPILevel) {
    AndroidAPILevel[AndroidAPILevel["Marshmallow"] = 23] = "Marshmallow";
    AndroidAPILevel[AndroidAPILevel["LOLLIPOP_MR1"] = 22] = "LOLLIPOP_MR1";
    AndroidAPILevel[AndroidAPILevel["LOLLIPOP"] = 21] = "LOLLIPOP";
    AndroidAPILevel[AndroidAPILevel["KITKAT"] = 19] = "KITKAT";
    AndroidAPILevel[AndroidAPILevel["JELLY_BEAN_MR2"] = 18] = "JELLY_BEAN_MR2";
    AndroidAPILevel[AndroidAPILevel["JELLY_BEAN_MR1"] = 17] = "JELLY_BEAN_MR1";
    AndroidAPILevel[AndroidAPILevel["JELLY_BEAN"] = 16] = "JELLY_BEAN";
    AndroidAPILevel[AndroidAPILevel["ICE_CREAM_SANDWICH_MR1"] = 15] = "ICE_CREAM_SANDWICH_MR1";
    AndroidAPILevel[AndroidAPILevel["GINGERBREAD_MR1"] = 10] = "GINGERBREAD_MR1";
})(exports.AndroidAPILevel || (exports.AndroidAPILevel = {}));
var AndroidAPILevel = exports.AndroidAPILevel;
(function (DeviceType) {
    DeviceType[DeviceType["AndroidSdkEmulator"] = 0] = "AndroidSdkEmulator";
    DeviceType[DeviceType["Other"] = 1] = "Other";
})(exports.DeviceType || (exports.DeviceType = {}));
var DeviceType = exports.DeviceType;
var AndroidSDKEmulatorPattern = /^emulator-\d{1,5}$/;
var AdbEnhancements = (function () {
    function AdbEnhancements() {
    }
    AdbEnhancements.prototype.getOnlineDevices = function () {
        return this.getConnectedDevices().then(function (devices) {
            return devices.filter(function (device) {
                return device.isOnline;
            });
        });
    };
    return AdbEnhancements;
}());
exports.AdbEnhancements = AdbEnhancements;
var Adb = (function (_super) {
    __extends(Adb, _super);
    function Adb(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.childProcess, childProcess = _c === void 0 ? new childProcess_1.ChildProcess() : _c, _d = _b.commandExecutor, commandExecutor = _d === void 0 ? new commandExecutor_1.CommandExecutor() : _d;
        _super.call(this);
        this.childProcess = childProcess;
        this.commandExecutor = commandExecutor;
    }
    /**
     * Gets the list of Android connected devices and emulators.
     */
    Adb.prototype.getConnectedDevices = function () {
        var _this = this;
        var childProcess = new childProcess_1.ChildProcess();
        return childProcess.execToString("adb devices")
            .then(function (output) {
            return _this.parseConnectedDevices(output);
        });
    };
    /**
     * Broadcasts an intent to reload the application in debug mode.
     */
    Adb.prototype.reloadAppInDebugMode = function (projectRoot, packageName, debugTarget) {
        var enableDebugCommand = "adb " + (debugTarget ? "-s " + debugTarget : "") + " shell am broadcast -a \"" + packageName + ".RELOAD_APP_ACTION\" --ez jsproxy true";
        return new commandExecutor_1.CommandExecutor(projectRoot).execute(enableDebugCommand);
    };
    /**
     * Sends an intent which launches the main activity of the application.
     */
    Adb.prototype.launchApp = function (projectRoot, packageName, debugTarget) {
        var launchAppCommand = "adb -s " + debugTarget + " shell am start -n " + packageName + "/.MainActivity";
        return new commandExecutor_1.CommandExecutor(projectRoot).execute(launchAppCommand);
    };
    Adb.prototype.apiVersion = function (deviceId) {
        return this.executeQuery(deviceId, "shell getprop ro.build.version.sdk").then(function (output) {
            return parseInt(output, 10);
        });
    };
    Adb.prototype.reverseAdd = function (deviceId, devicePort, computerPort) {
        return this.execute(deviceId, "reverse tcp:" + devicePort + " tcp:" + computerPort);
    };
    Adb.prototype.parseConnectedDevices = function (input) {
        var result = [];
        var regex = new RegExp("^(\\S+)\\t(\\S+)$", "mg");
        var match = regex.exec(input);
        while (match != null) {
            result.push({ id: match[1], isOnline: match[2] === "device", type: this.extractDeviceType(match[1]) });
            match = regex.exec(input);
        }
        return result;
    };
    Adb.prototype.extractDeviceType = function (id) {
        return id.match(AndroidSDKEmulatorPattern)
            ? DeviceType.AndroidSdkEmulator
            : DeviceType.Other;
    };
    Adb.prototype.executeQuery = function (deviceId, command) {
        return this.childProcess.execToString(this.generateCommandForDevice(deviceId, command));
    };
    Adb.prototype.execute = function (deviceId, command) {
        return this.commandExecutor.execute(this.generateCommandForDevice(deviceId, command));
    };
    Adb.prototype.generateCommandForDevice = function (deviceId, adbCommand) {
        return "adb -s \"" + deviceId + "\" " + adbCommand;
    };
    return Adb;
}(AdbEnhancements));
exports.Adb = Adb;

//# sourceMappingURL=adb.js.map
