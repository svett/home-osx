// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Q = require("q");
var path = require("path");
var log_1 = require("../../common/log/log");
var childProcess_1 = require("../../common/node/childProcess");
var commandExecutor_1 = require("../../common/commandExecutor");
var generalMobilePlatform_1 = require("../../common/generalMobilePlatform");
var compiler_1 = require("./compiler");
var deviceDeployer_1 = require("./deviceDeployer");
var deviceRunner_1 = require("./deviceRunner");
var plistBuddy_1 = require("../../common/ios/plistBuddy");
var iOSDebugModeManager_1 = require("../../common/ios/iOSDebugModeManager");
var outputVerifier_1 = require("../../common/outputVerifier");
var IOSPlatform = (function (_super) {
    __extends(IOSPlatform, _super);
    // We set remoteExtension = null so that if there is an instance of iOSPlatform that wants to have it's custom remoteExtension it can. This is specifically useful for tests.
    function IOSPlatform(runOptions, _a) {
        var _b = (_a === void 0 ? {} : _a).remoteExtension, remoteExtension = _b === void 0 ? null : _b;
        _super.call(this, runOptions, { remoteExtension: remoteExtension });
        this.plistBuddy = new plistBuddy_1.PlistBuddy();
        this.simulatorTarget = this.runOptions.target || IOSPlatform.simulatorString;
        this.isSimulator = this.simulatorTarget.toLowerCase() !== IOSPlatform.deviceString;
        this.iosProjectPath = path.join(this.projectPath, this.runOptions.iosRelativeProjectPath);
    }
    IOSPlatform.prototype.runApp = function () {
        var _this = this;
        // Compile, deploy, and launch the app on either a simulator or a device
        if (this.isSimulator) {
            // React native supports running on the iOS simulator from the command line
            var runArguments = [];
            if (this.simulatorTarget.toLowerCase() !== IOSPlatform.simulatorString) {
                runArguments.push("--simulator", this.simulatorTarget);
            }
            runArguments.push("--project-path", this.runOptions.iosRelativeProjectPath);
            var runIosSpawn = new commandExecutor_1.CommandExecutor(this.projectPath).spawnReactCommand("run-ios", runArguments);
            return new outputVerifier_1.OutputVerifier(function () {
                return _this.generateSuccessPatterns();
            }, function () {
                return Q(IOSPlatform.RUN_IOS_FAILURE_PATTERNS);
            }).process(runIosSpawn);
        }
        return new compiler_1.Compiler(this.iosProjectPath).compile().then(function () {
            return new deviceDeployer_1.DeviceDeployer(_this.iosProjectPath).deploy();
        }).then(function () {
            return new deviceRunner_1.DeviceRunner(_this.iosProjectPath).run();
        });
    };
    IOSPlatform.prototype.enableJSDebuggingMode = function () {
        var _this = this;
        // Configure the app for debugging
        if (this.simulatorTarget.toLowerCase() === IOSPlatform.deviceString) {
            // Note that currently we cannot automatically switch the device into debug mode.
            log_1.Log.logMessage("Application is running on a device, please shake device and select 'Debug in Chrome' to enable debugging.");
            return Q.resolve(void 0);
        }
        var iosDebugModeManager = new iOSDebugModeManager_1.IOSDebugModeManager(this.iosProjectPath);
        // Wait until the configuration file exists, and check to see if debugging is enabled
        return Q.all([
            iosDebugModeManager.getSimulatorJSDebuggingModeSetting(),
            this.getBundleId(),
        ]).spread(function (debugModeSetting, bundleId) {
            if (debugModeSetting !== iOSDebugModeManager_1.IOSDebugModeManager.WEBSOCKET_EXECUTOR_NAME) {
                // Debugging must still be enabled
                // We enable debugging by writing to a plist file that backs a NSUserDefaults object,
                // but that file is written to by the app on occasion. To avoid races, we shut the app
                // down before writing to the file.
                var childProcess_2 = new childProcess_1.ChildProcess();
                return childProcess_2.execToString("xcrun simctl spawn booted launchctl list").then(function (output) {
                    // Try to find an entry that looks like UIKitApplication:com.example.myApp[0x4f37]
                    var regex = new RegExp("(\\S+" + bundleId + "\\S+)");
                    var match = regex.exec(output);
                    // If we don't find a match, the app must not be running and so we do not need to close it
                    if (match) {
                        return childProcess_2.exec("xcrun simctl spawn booted launchctl stop " + match[1]);
                    }
                }).then(function () {
                    // Write to the settings file while the app is not running to avoid races
                    return iosDebugModeManager.setSimulatorJSDebuggingModeSetting(/*enable=*/ true);
                }).then(function () {
                    // Relaunch the app
                    return _this.runApp();
                });
            }
        });
    };
    IOSPlatform.prototype.prewarmBundleCache = function () {
        return this.remoteExtension.prewarmBundleCache(this.platformName);
    };
    IOSPlatform.prototype.generateSuccessPatterns = function () {
        return this.getBundleId().then(function (bundleId) {
            return IOSPlatform.RUN_IOS_SUCCESS_PATTERNS.concat([("Launching " + bundleId + "\n" + bundleId + ": ")]);
        });
    };
    IOSPlatform.prototype.getBundleId = function () {
        return this.plistBuddy.getBundleId(this.iosProjectPath);
    };
    IOSPlatform.DEFAULT_IOS_PROJECT_RELATIVE_PATH = "ios";
    IOSPlatform.deviceString = "device";
    IOSPlatform.simulatorString = "simulator";
    // We should add the common iOS build/run erros we find to this list
    IOSPlatform.RUN_IOS_FAILURE_PATTERNS = {
        "No devices are booted": "Unable to launch iOS simulator. Try specifying a different target.",
        "FBSOpenApplicationErrorDomain": "Unable to launch iOS simulator. Try specifying a different target.",
    };
    IOSPlatform.RUN_IOS_SUCCESS_PATTERNS = ["BUILD SUCCEEDED"];
    return IOSPlatform;
}(generalMobilePlatform_1.GeneralMobilePlatform));
exports.IOSPlatform = IOSPlatform;

//# sourceMappingURL=iOSPlatform.js.map
