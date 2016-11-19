// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var log_1 = require("../../common/log/log");
var logHelper_1 = require("../../common/log/logHelper");
var promise_1 = require("../../common/node/promise");
var plistBuddy_1 = require("./plistBuddy");
var simulatorPlist_1 = require("./simulatorPlist");
var IOSDebugModeManager = (function () {
    function IOSDebugModeManager(projectRoot) {
        this.projectRoot = projectRoot;
        this.simulatorPlist = new simulatorPlist_1.SimulatorPlist(this.projectRoot);
    }
    IOSDebugModeManager.prototype.setSimulatorJSDebuggingModeSetting = function (enable) {
        var plistBuddy = new plistBuddy_1.PlistBuddy();
        // Find the plistFile with the configuration setting
        // There is a race here between us checking for the plist file, and the application starting up.
        return this.findPListFile()
            .then(function (plistFile) {
            // Set the executorClass to be RCTWebSocketExecutor so on the next startup it will default into debug mode
            // This is approximately equivalent to clicking the "Debug in Chrome" button
            return enable
                ? plistBuddy.setPlistProperty(plistFile, IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME, IOSDebugModeManager.WEBSOCKET_EXECUTOR_NAME)
                : plistBuddy.deletePlistProperty(plistFile, IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME);
        });
    };
    IOSDebugModeManager.prototype.getSimulatorJSDebuggingModeSetting = function () {
        return this.findPListFile().then(function (plistFile) {
            // Attempt to read from the file, but if the property is not defined then return the empty string
            return new plistBuddy_1.PlistBuddy().readPlistProperty(plistFile, IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME)
                .catch(function () { return ""; });
        });
    };
    IOSDebugModeManager.prototype.findPListFile = function () {
        var _this = this;
        var pu = new promise_1.PromiseUtil();
        var failureString = "Unable to find plist file to configure debugging";
        return pu.retryAsync(function () {
            return _this.tryOneAttemptToFindPListFile();
        }, // Operation to retry until successful
        function (file) {
            return file !== null;
        }, // Condition to check if the operation was successful, and this logic is done
        IOSDebugModeManager.MAX_RETRIES, IOSDebugModeManager.DELAY_UNTIL_RETRY, failureString); // Error to show in case all retries fail
    };
    IOSDebugModeManager.prototype.tryOneAttemptToFindPListFile = function () {
        return this.simulatorPlist.findPlistFile().catch(function (reason) {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "Failed one attempt to find plist file: " + reason);
            return null;
        });
    };
    IOSDebugModeManager.WEBSOCKET_EXECUTOR_NAME = "RCTWebSocketExecutor";
    IOSDebugModeManager.EXECUTOR_CLASS_SETTING_NAME = ":RCTDevMenu:executorClass";
    IOSDebugModeManager.MAX_RETRIES = 5;
    IOSDebugModeManager.DELAY_UNTIL_RETRY = 2000;
    return IOSDebugModeManager;
}());
exports.IOSDebugModeManager = IOSDebugModeManager;

//# sourceMappingURL=iOSDebugModeManager.js.map
