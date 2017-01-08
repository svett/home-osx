// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var vscode = require("vscode");
var Q = require("q");
var XDL = require("../common/exponent/xdlInterface");
var commandExecutor_1 = require("../common/commandExecutor");
var settingsHelper_1 = require("./settingsHelper");
var log_1 = require("../common/log/log");
var packager_1 = require("../common/packager");
var androidPlatform_1 = require("../common/android/androidPlatform");
var packagerStatusIndicator_1 = require("./packagerStatusIndicator");
var reactNativeProjectHelper_1 = require("../common/reactNativeProjectHelper");
var targetPlatformHelper_1 = require("../common/targetPlatformHelper");
var telemetryHelper_1 = require("../common/telemetryHelper");
var iOSDebugModeManager_1 = require("../common/ios/iOSDebugModeManager");
var CommandPaletteHandler = (function () {
    function CommandPaletteHandler(workspaceRoot, reactNativePackager, packagerStatusIndicator, exponentHelper) {
        this.workspaceRoot = workspaceRoot;
        this.reactNativePackager = reactNativePackager;
        this.reactNativePackageStatusIndicator = packagerStatusIndicator;
        this.exponentHelper = exponentHelper;
    }
    /**
     * Starts the React Native packager
     */
    CommandPaletteHandler.prototype.startPackager = function () {
        var _this = this;
        return this.executeCommandInContext("startPackager", function () {
            return _this.reactNativePackager.isRunning()
                .then(function (running) {
                if (running) {
                    return _this.reactNativePackager.stop();
                }
            });
        }).then(function () {
            return _this.exponentHelper.configureReactNativeEnvironment();
        }).then(function () { return _this.runStartPackagerCommandAndUpdateStatus(); });
    };
    /**
     * Starts the Exponent packager
     */
    CommandPaletteHandler.prototype.startExponentPackager = function () {
        var _this = this;
        return this.executeCommandInContext("startExponentPackager", function () {
            return _this.reactNativePackager.isRunning()
                .then(function (running) {
                if (running) {
                    return _this.reactNativePackager.stop();
                }
            });
        }).then(function () {
            return _this.exponentHelper.configureExponentEnvironment();
        }).then(function () { return _this.runStartPackagerCommandAndUpdateStatus(packager_1.PackagerRunAs.EXPONENT); });
    };
    /**
     * Kills the React Native packager invoked by the extension's packager
     */
    CommandPaletteHandler.prototype.stopPackager = function () {
        var _this = this;
        return this.executeCommandInContext("stopPackager", function () { return _this.reactNativePackager.stop(); })
            .then(function () { return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED); });
    };
    /**
     * Restarts the React Native packager
     */
    CommandPaletteHandler.prototype.restartPackager = function () {
        var _this = this;
        return this.executeCommandInContext("restartPackager", function () {
            return _this.runRestartPackagerCommandAndUpdateStatus();
        });
    };
    /**
     * Execute command to publish to exponent host.
     */
    CommandPaletteHandler.prototype.publishToExpHost = function () {
        var _this = this;
        return this.executeCommandInContext("publishToExpHost", function () {
            _this.executePublishToExpHost().then(function (didPublish) {
                if (!didPublish) {
                    log_1.Log.logMessage("Publishing was unsuccessful. Please make sure you are logged in Exponent and your project is a valid Exponentjs project");
                }
            });
        });
    };
    /**
     * Executes the 'react-native run-android' command
     */
    CommandPaletteHandler.prototype.runAndroid = function () {
        var _this = this;
        targetPlatformHelper_1.TargetPlatformHelper.checkTargetPlatformSupport("android");
        return this.executeCommandInContext("runAndroid", function () { return _this.executeWithPackagerRunning(function () {
            var packagerPort = settingsHelper_1.SettingsHelper.getPackagerPort();
            return new androidPlatform_1.AndroidPlatform({ projectRoot: _this.workspaceRoot, packagerPort: packagerPort }).runApp(/*shouldLaunchInAllDevices*/ true);
        }); });
    };
    /**
     * Executes the 'react-native run-ios' command
     */
    CommandPaletteHandler.prototype.runIos = function () {
        var _this = this;
        targetPlatformHelper_1.TargetPlatformHelper.checkTargetPlatformSupport("ios");
        return this.executeCommandInContext("runIos", function () {
            // Set the Debugging setting to disabled, because in iOS it's persisted across runs of the app
            return new iOSDebugModeManager_1.IOSDebugModeManager(_this.workspaceRoot).setSimulatorJSDebuggingModeSetting(/*enable=*/ false)
                .catch(function () { }) // If setting the debugging mode fails, we ignore the error and we run the run ios command anyways
                .then(function () { return _this.executeReactNativeRunCommand("run-ios"); });
        });
    };
    CommandPaletteHandler.prototype.runRestartPackagerCommandAndUpdateStatus = function () {
        var _this = this;
        return this.reactNativePackager.restart(settingsHelper_1.SettingsHelper.getPackagerPort())
            .then(function () { return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED); });
    };
    /**
     * Helper method to run packager and update appropriate configurations
     */
    CommandPaletteHandler.prototype.runStartPackagerCommandAndUpdateStatus = function (startAs) {
        var _this = this;
        if (startAs === void 0) { startAs = packager_1.PackagerRunAs.REACT_NATIVE; }
        if (startAs === packager_1.PackagerRunAs.EXPONENT) {
            return this.loginToExponent()
                .then(function () {
                return _this.reactNativePackager.startAsExponent(settingsHelper_1.SettingsHelper.getPackagerPort());
            }).then(function (exponentUrl) {
                _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.EXPONENT_PACKAGER_STARTED);
                log_1.Log.logMessage("Application is running on Exponent.");
                var exponentOutput = "Open your exponent app at " + exponentUrl;
                log_1.Log.logMessage(exponentOutput);
                vscode.window.showInformationMessage(exponentOutput);
            });
        }
        return this.reactNativePackager.startAsReactNative(settingsHelper_1.SettingsHelper.getPackagerPort())
            .then(function () { return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED); });
    };
    /**
     * Executes a react-native command passed after starting the packager
     * {command} The command to be executed
     * {args} The arguments to be passed to the command
     */
    CommandPaletteHandler.prototype.executeReactNativeRunCommand = function (command, args) {
        var _this = this;
        return this.executeWithPackagerRunning(function () {
            return new commandExecutor_1.CommandExecutor(_this.workspaceRoot).spawnReactCommand(command, args).outcome;
        });
    };
    /**
     * Executes a lambda function after starting the packager
     * {lambda} The lambda function to be executed
     */
    CommandPaletteHandler.prototype.executeWithPackagerRunning = function (lambda) {
        // Start the packager before executing the React-Native command
        log_1.Log.logMessage("Attempting to start the React Native packager");
        return this.runStartPackagerCommandAndUpdateStatus().then(lambda);
    };
    /**
     * Ensures that we are in a React Native project and then executes the operation
     * Otherwise, displays an error message banner
     * {operation} - a function that performs the expected operation
     */
    CommandPaletteHandler.prototype.executeCommandInContext = function (rnCommand, operation) {
        var reactNativeProjectHelper = new reactNativeProjectHelper_1.ReactNativeProjectHelper(this.workspaceRoot);
        return telemetryHelper_1.TelemetryHelper.generate("RNCommand", function (generator) {
            generator.add("command", rnCommand, false);
            return reactNativeProjectHelper.isReactNativeProject().then(function (isRNProject) {
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
    };
    /**
     * Publish project to exponent server. In order to do this we need to make sure the user is logged in exponent and the packager is running.
     */
    CommandPaletteHandler.prototype.executePublishToExpHost = function () {
        var _this = this;
        log_1.Log.logMessage("Publishing app to Exponent server. This might take a moment.");
        return this.loginToExponent()
            .then(function (user) {
            log_1.Log.logMessage("Publishing as " + user.username + "...");
            return _this.startExponentPackager()
                .then(function () {
                return XDL.publish(_this.workspaceRoot);
            })
                .then(function (response) {
                if (response.err || !response.url) {
                    return false;
                }
                var publishedOutput = "App successfully published to " + response.url;
                log_1.Log.logMessage(publishedOutput);
                vscode.window.showInformationMessage(publishedOutput);
                return true;
            });
        }).catch(function () {
            log_1.Log.logWarning("An error has occured. Please make sure you are logged in to exponent, your project is setup correctly for publishing and your packager is running as exponent.");
            return false;
        });
    };
    CommandPaletteHandler.prototype.loginToExponent = function () {
        return this.exponentHelper.loginToExponent(function (message, password) { return Q(vscode.window.showInputBox({ placeHolder: message, password: password })); }, function (message) { return Q(vscode.window.showInformationMessage(message)); });
    };
    return CommandPaletteHandler;
}());
exports.CommandPaletteHandler = CommandPaletteHandler;

//# sourceMappingURL=commandPaletteHandler.js.map
