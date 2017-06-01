// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const path = require("path");
const log_1 = require("../../common/log/log");
const childProcess_1 = require("../../common/node/childProcess");
const commandExecutor_1 = require("../../common/commandExecutor");
const generalMobilePlatform_1 = require("../../common/generalMobilePlatform");
const compiler_1 = require("./compiler");
const deviceDeployer_1 = require("./deviceDeployer");
const deviceRunner_1 = require("./deviceRunner");
const plistBuddy_1 = require("../../common/ios/plistBuddy");
const iOSDebugModeManager_1 = require("../../common/ios/iOSDebugModeManager");
const outputVerifier_1 = require("../../common/outputVerifier");
class IOSPlatform extends generalMobilePlatform_1.GeneralMobilePlatform {
    // We set remoteExtension = null so that if there is an instance of iOSPlatform that wants to have it's custom remoteExtension it can. This is specifically useful for tests.
    constructor(runOptions, { remoteExtension = null } = {}) {
        super(runOptions, { remoteExtension: remoteExtension });
        this.plistBuddy = new plistBuddy_1.PlistBuddy();
        this.simulatorTarget = this.runOptions.target || IOSPlatform.simulatorString;
        this.isSimulator = this.simulatorTarget.toLowerCase() !== IOSPlatform.deviceString;
        this.iosProjectPath = path.join(this.projectPath, this.runOptions.iosRelativeProjectPath);
    }
    runApp() {
        // Compile, deploy, and launch the app on either a simulator or a device
        if (this.isSimulator) {
            // React native supports running on the iOS simulator from the command line
            let runArguments = [];
            if (this.simulatorTarget.toLowerCase() !== IOSPlatform.simulatorString) {
                runArguments.push("--simulator", this.simulatorTarget);
            }
            runArguments.push("--project-path", this.runOptions.iosRelativeProjectPath);
            const runIosSpawn = new commandExecutor_1.CommandExecutor(this.projectPath).spawnReactCommand("run-ios", runArguments);
            return new outputVerifier_1.OutputVerifier(() => this.generateSuccessPatterns(), () => Q(IOSPlatform.RUN_IOS_FAILURE_PATTERNS)).process(runIosSpawn);
        }
        return new compiler_1.Compiler(this.iosProjectPath).compile().then(() => {
            return new deviceDeployer_1.DeviceDeployer(this.iosProjectPath).deploy();
        }).then(() => {
            return new deviceRunner_1.DeviceRunner(this.iosProjectPath).run();
        });
    }
    enableJSDebuggingMode() {
        // Configure the app for debugging
        if (this.simulatorTarget.toLowerCase() === IOSPlatform.deviceString) {
            // Note that currently we cannot automatically switch the device into debug mode.
            log_1.Log.logMessage("Application is running on a device, please shake device and select 'Debug in Chrome' to enable debugging.");
            return Q.resolve(void 0);
        }
        const iosDebugModeManager = new iOSDebugModeManager_1.IOSDebugModeManager(this.iosProjectPath);
        // Wait until the configuration file exists, and check to see if debugging is enabled
        return Q.all([
            iosDebugModeManager.getSimulatorJSDebuggingModeSetting(),
            this.getBundleId(),
        ]).spread((debugModeSetting, bundleId) => {
            if (debugModeSetting !== iOSDebugModeManager_1.IOSDebugModeManager.WEBSOCKET_EXECUTOR_NAME) {
                // Debugging must still be enabled
                // We enable debugging by writing to a plist file that backs a NSUserDefaults object,
                // but that file is written to by the app on occasion. To avoid races, we shut the app
                // down before writing to the file.
                const childProcess = new childProcess_1.ChildProcess();
                return childProcess.execToString("xcrun simctl spawn booted launchctl list").then((output) => {
                    // Try to find an entry that looks like UIKitApplication:com.example.myApp[0x4f37]
                    const regex = new RegExp(`(\\S+${bundleId}\\S+)`);
                    const match = regex.exec(output);
                    // If we don't find a match, the app must not be running and so we do not need to close it
                    if (match) {
                        return childProcess.exec(`xcrun simctl spawn booted launchctl stop ${match[1]}`);
                    }
                }).then(() => {
                    // Write to the settings file while the app is not running to avoid races
                    return iosDebugModeManager.setSimulatorJSDebuggingModeSetting(/*enable=*/ true);
                }).then(() => {
                    // Relaunch the app
                    return this.runApp();
                });
            }
        });
    }
    prewarmBundleCache() {
        return this.remoteExtension.prewarmBundleCache(this.platformName);
    }
    generateSuccessPatterns() {
        return this.getBundleId().then(bundleId => IOSPlatform.RUN_IOS_SUCCESS_PATTERNS.concat([`Launching ${bundleId}\n${bundleId}: `]));
    }
    getBundleId() {
        return this.plistBuddy.getBundleId(this.iosProjectPath);
    }
}
IOSPlatform.DEFAULT_IOS_PROJECT_RELATIVE_PATH = "ios";
IOSPlatform.deviceString = "device";
IOSPlatform.simulatorString = "simulator";
// We should add the common iOS build/run erros we find to this list
IOSPlatform.RUN_IOS_FAILURE_PATTERNS = [{
        pattern: "No devices are booted",
        message: "Unable to launch iOS simulator. Try specifying a different target.",
    }, {
        pattern: "FBSOpenApplicationErrorDomain",
        message: "Unable to launch iOS simulator. Try specifying a different target.",
    }];
IOSPlatform.RUN_IOS_SUCCESS_PATTERNS = ["BUILD SUCCEEDED"];
exports.IOSPlatform = IOSPlatform;

//# sourceMappingURL=iOSPlatform.js.map
