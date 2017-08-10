// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess_1 = require("../../common/node/childProcess");
const commandExecutor_1 = require("../../common/commandExecutor");
// See android versions usage at: http://developer.android.com/about/dashboards/index.html
var AndroidAPILevel;
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
})(AndroidAPILevel = exports.AndroidAPILevel || (exports.AndroidAPILevel = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType[DeviceType["AndroidSdkEmulator"] = 0] = "AndroidSdkEmulator";
    DeviceType[DeviceType["Other"] = 1] = "Other";
})(DeviceType = exports.DeviceType || (exports.DeviceType = {}));
const AndroidSDKEmulatorPattern = /^emulator-\d{1,5}$/;
class AdbEnhancements {
    getOnlineDevices() {
        return this.getConnectedDevices().then(devices => {
            return devices.filter(device => device.isOnline);
        });
    }
}
exports.AdbEnhancements = AdbEnhancements;
class Adb extends AdbEnhancements {
    constructor({ childProcess = new childProcess_1.ChildProcess(), commandExecutor = new commandExecutor_1.CommandExecutor() } = {}) {
        super();
        this.childProcess = childProcess;
        this.commandExecutor = commandExecutor;
    }
    /**
     * Gets the list of Android connected devices and emulators.
     */
    getConnectedDevices() {
        let childProcess = new childProcess_1.ChildProcess();
        return childProcess.execToString("adb devices")
            .then(output => {
            return this.parseConnectedDevices(output);
        });
    }
    /**
     * Broadcasts an intent to reload the application in debug mode.
     */
    reloadAppInDebugMode(projectRoot, packageName, debugTarget) {
        let enableDebugCommand = `adb ${debugTarget ? "-s " + debugTarget : ""} shell am broadcast -a "${packageName}.RELOAD_APP_ACTION" --ez jsproxy true`;
        return new commandExecutor_1.CommandExecutor(projectRoot).execute(enableDebugCommand);
    }
    /**
     * Sends an intent which launches the main activity of the application.
     */
    launchApp(projectRoot, packageName, debugTarget) {
        let launchAppCommand = `adb -s ${debugTarget} shell am start -n ${packageName}/.MainActivity`;
        return new commandExecutor_1.CommandExecutor(projectRoot).execute(launchAppCommand);
    }
    apiVersion(deviceId) {
        return this.executeQuery(deviceId, "shell getprop ro.build.version.sdk").then(output => parseInt(output, 10));
    }
    reverseAdd(deviceId, devicePort, computerPort) {
        return this.execute(deviceId, `reverse tcp:${devicePort} tcp:${computerPort}`);
    }
    parseConnectedDevices(input) {
        let result = [];
        let regex = new RegExp("^(\\S+)\\t(\\S+)$", "mg");
        let match = regex.exec(input);
        while (match != null) {
            result.push({ id: match[1], isOnline: match[2] === "device", type: this.extractDeviceType(match[1]) });
            match = regex.exec(input);
        }
        return result;
    }
    extractDeviceType(id) {
        return id.match(AndroidSDKEmulatorPattern)
            ? DeviceType.AndroidSdkEmulator
            : DeviceType.Other;
    }
    executeQuery(deviceId, command) {
        return this.childProcess.execToString(this.generateCommandForDevice(deviceId, command));
    }
    execute(deviceId, command) {
        return this.commandExecutor.execute(this.generateCommandForDevice(deviceId, command));
    }
    generateCommandForDevice(deviceId, adbCommand) {
        return `adb -s "${deviceId}" ${adbCommand}`;
    }
}
exports.Adb = Adb;

//# sourceMappingURL=adb.js.map
