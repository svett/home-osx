// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../common/log/log");
const logHelper_1 = require("../../common/log/logHelper");
const promise_1 = require("../../common/node/promise");
const plistBuddy_1 = require("./plistBuddy");
const simulatorPlist_1 = require("./simulatorPlist");
class IOSDebugModeManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.simulatorPlist = new simulatorPlist_1.SimulatorPlist(this.projectRoot);
    }
    setSimulatorJSDebuggingModeSetting(enable) {
        const plistBuddy = new plistBuddy_1.PlistBuddy();
        // Find the plistFile with the configuration setting
        // There is a race here between us checking for the plist file, and the application starting up.
        return this.findPListFile()
            .then((plistFile) => {
            // Set the executorClass to be RCTWebSocketExecutor so on the next startup it will default into debug mode
            // This is approximately equivalent to clicking the "Debug in Chrome" button
            return enable
                ? plistBuddy.setPlistProperty(plistFile, IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME, IOSDebugModeManager.WEBSOCKET_EXECUTOR_NAME)
                : plistBuddy.deletePlistProperty(plistFile, IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME);
        });
    }
    getSimulatorJSDebuggingModeSetting() {
        return this.findPListFile().then((plistFile) => {
            // Attempt to read from the file, but if the property is not defined then return the empty string
            return new plistBuddy_1.PlistBuddy().readPlistProperty(plistFile, IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME)
                .catch(() => "");
        });
    }
    findPListFile() {
        const pu = new promise_1.PromiseUtil();
        const failureString = `Unable to find plist file to configure debugging`;
        return pu.retryAsync(() => this.tryOneAttemptToFindPListFile(), // Operation to retry until successful
        (file) => file !== null, // Condition to check if the operation was successful, and this logic is done
        IOSDebugModeManager.MAX_RETRIES, IOSDebugModeManager.DELAY_UNTIL_RETRY, failureString); // Error to show in case all retries fail
    }
    tryOneAttemptToFindPListFile() {
        return this.simulatorPlist.findPlistFile().catch(reason => {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, `Failed one attempt to find plist file: ${reason}`);
            return null;
        });
    }
}
IOSDebugModeManager.WEBSOCKET_EXECUTOR_NAME = "RCTWebSocketExecutor";
IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME = ":RCTDevMenu:executorClass";
IOSDebugModeManager.MAX_RETRIES = 5;
IOSDebugModeManager.DELAY_UNTIL_RETRY = 2000;
exports.IOSDebugModeManager = IOSDebugModeManager;

//# sourceMappingURL=iOSDebugModeManager.js.map
