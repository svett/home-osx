// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Q = require("q");
const XDL = require("../common/exponent/xdlInterface");
const commandExecutor_1 = require("../common/commandExecutor");
const settingsHelper_1 = require("./settingsHelper");
const log_1 = require("../common/log/log");
const packager_1 = require("../common/packager");
const androidPlatform_1 = require("../common/android/androidPlatform");
const packagerStatusIndicator_1 = require("./packagerStatusIndicator");
const reactNativeProjectHelper_1 = require("../common/reactNativeProjectHelper");
const targetPlatformHelper_1 = require("../common/targetPlatformHelper");
const telemetryHelper_1 = require("../common/telemetryHelper");
const iOSDebugModeManager_1 = require("../common/ios/iOSDebugModeManager");
class CommandPaletteHandler {
    constructor(workspaceRoot, reactNativePackager, packagerStatusIndicator, exponentHelper) {
        this.workspaceRoot = workspaceRoot;
        this.reactNativePackager = reactNativePackager;
        this.reactNativePackageStatusIndicator = packagerStatusIndicator;
        this.exponentHelper = exponentHelper;
    }
    /**
     * Starts the React Native packager
     */
    startPackager() {
        return this.executeCommandInContext("startPackager", () => this.reactNativePackager.isRunning()
            .then((running) => {
            if (running) {
                return this.reactNativePackager.stop();
            }
        })).then(() => this.exponentHelper.configureReactNativeEnvironment()).then(() => this.runStartPackagerCommandAndUpdateStatus());
    }
    /**
     * Starts the Exponent packager
     */
    startExponentPackager() {
        return this.executeCommandInContext("startExponentPackager", () => this.reactNativePackager.isRunning()
            .then((running) => {
            if (running) {
                return this.reactNativePackager.stop();
            }
        })).then(() => this.exponentHelper.configureExponentEnvironment()).then(() => this.runStartPackagerCommandAndUpdateStatus(packager_1.PackagerRunAs.EXPONENT));
    }
    /**
     * Kills the React Native packager invoked by the extension's packager
     */
    stopPackager() {
        return this.executeCommandInContext("stopPackager", () => this.reactNativePackager.stop())
            .then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED));
    }
    /**
     * Restarts the React Native packager
     */
    restartPackager() {
        return this.executeCommandInContext("restartPackager", () => this.runRestartPackagerCommandAndUpdateStatus());
    }
    /**
     * Execute command to publish to exponent host.
     */
    publishToExpHost() {
        return this.executeCommandInContext("publishToExpHost", () => {
            this.executePublishToExpHost().then((didPublish) => {
                if (!didPublish) {
                    log_1.Log.logMessage("Publishing was unsuccessful. Please make sure you are logged in Exponent and your project is a valid Exponentjs project");
                }
            });
        });
    }
    /**
     * Executes the 'react-native run-android' command
     */
    runAndroid() {
        targetPlatformHelper_1.TargetPlatformHelper.checkTargetPlatformSupport("android");
        return this.executeCommandInContext("runAndroid", () => this.executeWithPackagerRunning(() => {
            const packagerPort = settingsHelper_1.SettingsHelper.getPackagerPort();
            return new androidPlatform_1.AndroidPlatform({ projectRoot: this.workspaceRoot, packagerPort: packagerPort }).runApp(/*shouldLaunchInAllDevices*/ true);
        }));
    }
    /**
     * Executes the 'react-native run-ios' command
     */
    runIos() {
        targetPlatformHelper_1.TargetPlatformHelper.checkTargetPlatformSupport("ios");
        return this.executeCommandInContext("runIos", () => {
            // Set the Debugging setting to disabled, because in iOS it's persisted across runs of the app
            return new iOSDebugModeManager_1.IOSDebugModeManager(this.workspaceRoot).setSimulatorJSDebuggingModeSetting(/*enable=*/ false)
                .catch(() => { }) // If setting the debugging mode fails, we ignore the error and we run the run ios command anyways
                .then(() => this.executeReactNativeRunCommand("run-ios"));
        });
    }
    runRestartPackagerCommandAndUpdateStatus() {
        return this.reactNativePackager.restart(settingsHelper_1.SettingsHelper.getPackagerPort())
            .then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED));
    }
    /**
     * Helper method to run packager and update appropriate configurations
     */
    runStartPackagerCommandAndUpdateStatus(startAs = packager_1.PackagerRunAs.REACT_NATIVE) {
        if (startAs === packager_1.PackagerRunAs.EXPONENT) {
            return this.loginToExponent()
                .then(() => this.reactNativePackager.startAsExponent(settingsHelper_1.SettingsHelper.getPackagerPort())).then(exponentUrl => {
                this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.EXPONENT_PACKAGER_STARTED);
                log_1.Log.logMessage("Application is running on Exponent.");
                const exponentOutput = `Open your exponent app at ${exponentUrl}`;
                log_1.Log.logMessage(exponentOutput);
                vscode.commands.executeCommand("vscode.previewHtml", vscode.Uri.parse(exponentUrl), 1, "Expo QR code");
            });
        }
        return this.reactNativePackager.startAsReactNative(settingsHelper_1.SettingsHelper.getPackagerPort())
            .then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED));
    }
    /**
     * Executes a react-native command passed after starting the packager
     * {command} The command to be executed
     * {args} The arguments to be passed to the command
     */
    executeReactNativeRunCommand(command, args) {
        return this.executeWithPackagerRunning(() => {
            return new commandExecutor_1.CommandExecutor(this.workspaceRoot).spawnReactCommand(command, args).outcome;
        });
    }
    /**
     * Executes a lambda function after starting the packager
     * {lambda} The lambda function to be executed
     */
    executeWithPackagerRunning(lambda) {
        // Start the packager before executing the React-Native command
        log_1.Log.logMessage("Attempting to start the React Native packager");
        return this.runStartPackagerCommandAndUpdateStatus().then(lambda);
    }
    /**
     * Ensures that we are in a React Native project and then executes the operation
     * Otherwise, displays an error message banner
     * {operation} - a function that performs the expected operation
     */
    executeCommandInContext(rnCommand, operation) {
        let reactNativeProjectHelper = new reactNativeProjectHelper_1.ReactNativeProjectHelper(this.workspaceRoot);
        return telemetryHelper_1.TelemetryHelper.generate("RNCommand", (generator) => {
            generator.add("command", rnCommand, false);
            return reactNativeProjectHelper.isReactNativeProject().then(isRNProject => {
                generator.add("isRNProject", isRNProject, false);
                if (isRNProject) {
                    // Bring the log channel to focus
                    log_1.Log.setFocusOnLogChannel();
                    // Execute the operation
                    return operation();
                }
                else {
                    vscode.window.showErrorMessage("Current workspace is not a React Native project.");
                }
            });
        });
    }
    /**
     * Publish project to exponent server. In order to do this we need to make sure the user is logged in exponent and the packager is running.
     */
    executePublishToExpHost() {
        log_1.Log.logMessage("Publishing app to Exponent server. This might take a moment.");
        return this.loginToExponent()
            .then(user => {
            log_1.Log.logMessage(`Publishing as ${user.username}...`);
            return this.startExponentPackager()
                .then(() => XDL.publish(this.workspaceRoot))
                .then(response => {
                if (response.err || !response.url) {
                    return false;
                }
                const publishedOutput = `App successfully published to ${response.url}`;
                log_1.Log.logMessage(publishedOutput);
                vscode.window.showInformationMessage(publishedOutput);
                return true;
            });
        }).catch(() => {
            log_1.Log.logWarning("An error has occured. Please make sure you are logged in to exponent, your project is setup correctly for publishing and your packager is running as exponent.");
            return false;
        });
    }
    loginToExponent() {
        return this.exponentHelper.loginToExponent((message, password) => { return Q(vscode.window.showInputBox({ placeHolder: message, password: password })); }, (message) => { return Q(vscode.window.showInformationMessage(message)); });
    }
}
exports.CommandPaletteHandler = CommandPaletteHandler;

//# sourceMappingURL=commandPaletteHandler.js.map
