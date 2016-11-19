// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var path = require("path");
var vscode = require("vscode");
var fileSystem_1 = require("../common/node/fileSystem");
var commandPaletteHandler_1 = require("./commandPaletteHandler");
var packager_1 = require("../common/packager");
var entryPointHandler_1 = require("../common/entryPointHandler");
var errorHelper_1 = require("../common/error/errorHelper");
var internalErrorCode_1 = require("../common/error/internalErrorCode");
var log_1 = require("../common/log/log");
var packagerStatusIndicator_1 = require("./packagerStatusIndicator");
var reactNativeProjectHelper_1 = require("../common/reactNativeProjectHelper");
var reactDirManager_1 = require("./reactDirManager");
var intellisenseHelper_1 = require("./intellisenseHelper");
var telemetry_1 = require("../common/telemetry");
var telemetryHelper_1 = require("../common/telemetryHelper");
var extensionServer_1 = require("./extensionServer");
var outputChannelLogger_1 = require("./outputChannelLogger");
var exponentHelper_1 = require("../common/exponent/exponentHelper");
/* all components use the same packager instance */
var projectRootPath = vscode.workspace.rootPath;
var globalPackager = new packager_1.Packager(projectRootPath);
var packagerStatusIndicator = new packagerStatusIndicator_1.PackagerStatusIndicator();
var globalExponentHelper = new exponentHelper_1.ExponentHelper(projectRootPath);
var commandPaletteHandler = new commandPaletteHandler_1.CommandPaletteHandler(projectRootPath, globalPackager, packagerStatusIndicator, globalExponentHelper);
var outputChannelLogger = new outputChannelLogger_1.DelayedOutputChannelLogger("React-Native");
var entryPointHandler = new entryPointHandler_1.EntryPointHandler(entryPointHandler_1.ProcessType.Extension, outputChannelLogger);
var reactNativeProjectHelper = new reactNativeProjectHelper_1.ReactNativeProjectHelper(projectRootPath);
var fsUtil = new fileSystem_1.FileSystem();
function activate(context) {
    entryPointHandler.runApp("react-native", function () { return require("../../package.json").version; }, errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExtensionActivationFailed), projectRootPath, function () {
        return reactNativeProjectHelper.isReactNativeProject()
            .then(function (isRNProject) {
            if (isRNProject) {
                var activateExtensionEvent = telemetryHelper_1.TelemetryHelper.createTelemetryEvent("activate");
                telemetry_1.Telemetry.send(activateExtensionEvent);
                warnWhenReactNativeVersionIsNotSupported();
                entryPointHandler.runFunction("debugger.setupLauncherStub", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.DebuggerStubLauncherFailed), function () {
                    return setupReactNativeDebugger()
                        .then(function () {
                        return setupAndDispose(new reactDirManager_1.ReactDirManager(), context);
                    })
                        .then(function () {
                        return setupAndDispose(new extensionServer_1.ExtensionServer(projectRootPath, globalPackager, packagerStatusIndicator, globalExponentHelper), context);
                    })
                        .then(function () { });
                });
                entryPointHandler.runFunction("intelliSense.setup", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.IntellisenseSetupFailed), function () {
                    return intellisenseHelper_1.IntellisenseHelper.setupReactNativeIntellisense();
                });
            }
            entryPointHandler.runFunction("debugger.setupNodeDebuggerLocation", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.NodeDebuggerConfigurationFailed), function () {
                return configureNodeDebuggerLocation();
            });
            registerReactNativeCommands(context);
        });
    });
}
exports.activate = activate;
function deactivate() {
    return Q.Promise(function (resolve) {
        // Kill any packager processes that we spawned
        entryPointHandler.runFunction("extension.deactivate", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToStopPackagerOnExit), function () {
            commandPaletteHandler.stopPackager().done(function () {
                // Tell vscode that we are done with deactivation
                resolve(void 0);
            });
        }, /*errorsAreFatal*/ true);
    });
}
exports.deactivate = deactivate;
function configureNodeDebuggerLocation() {
    var nodeDebugExtension = vscode.extensions.getExtension("ms-vscode.node-debug") // We try to get the new version
        || vscode.extensions.getExtension("andreweinand.node-debug"); // If it's not available, we try to get the old version
    if (!nodeDebugExtension) {
        return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.CouldNotFindLocationOfNodeDebugger));
    }
    var nodeDebugPath = nodeDebugExtension.extensionPath;
    return fsUtil.writeFile(path.resolve(__dirname, "../", "debugger", "nodeDebugLocation.json"), JSON.stringify({ nodeDebugPath: nodeDebugPath }));
}
function setupAndDispose(setuptableDisposable, context) {
    return setuptableDisposable.setup()
        .then(function () {
        context.subscriptions.push(setuptableDisposable);
        return setuptableDisposable;
    });
}
function warnWhenReactNativeVersionIsNotSupported() {
    return reactNativeProjectHelper.validateReactNativeVersion().done(function () { }, function (reason) {
        telemetryHelper_1.TelemetryHelper.sendSimpleEvent("unsupportedRNVersion", { rnVersion: reason });
        var shortMessage = "React Native Tools need React Native version 0.19.0 or later to be installed in <PROJECT_ROOT>/node_modules/";
        var longMessage = shortMessage + ": " + reason;
        vscode.window.showWarningMessage(shortMessage);
        log_1.Log.logMessage(longMessage);
    });
}
function registerReactNativeCommands(context) {
    // Register React Native commands
    registerVSCodeCommand(context, "runAndroid", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToRunOnAndroid), function () { return commandPaletteHandler.runAndroid(); });
    registerVSCodeCommand(context, "runIos", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToRunOnIos), function () { return commandPaletteHandler.runIos(); });
    registerVSCodeCommand(context, "startPackager", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToStartPackager), function () { return commandPaletteHandler.startPackager(); });
    registerVSCodeCommand(context, "startExponentPackager", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToStartExponentPackager), function () { return commandPaletteHandler.startExponentPackager(); });
    registerVSCodeCommand(context, "stopPackager", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToStopPackager), function () { return commandPaletteHandler.stopPackager(); });
    registerVSCodeCommand(context, "restartPackager", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToRestartPackager), function () { return commandPaletteHandler.restartPackager(); });
    registerVSCodeCommand(context, "publishToExpHost", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.FailedToPublishToExpHost), function () { return commandPaletteHandler.publishToExpHost(); });
}
function registerVSCodeCommand(context, commandName, error, commandHandler) {
    context.subscriptions.push(vscode.commands.registerCommand("reactNative." + commandName, function () {
        return entryPointHandler.runFunction("commandPalette." + commandName, error, commandHandler);
    }));
}
/**
 * Sets up the debugger for the React Native project by dropping
 * the debugger stub into the workspace
 */
function setupReactNativeDebugger() {
    var launcherPath = require.resolve("../debugger/launcher");
    var pkg = require("../../package.json");
    var extensionVersionNumber = pkg.version;
    var extensionName = pkg.name;
    var debuggerEntryCode = "// This file is automatically generated by " + extensionName + "@" + extensionVersionNumber + "\n// Please do not modify it manually. All changes will be lost.\ntry {\n    var path = require(\"path\");\n    var Launcher = require(" + JSON.stringify(launcherPath) + ").Launcher;\n    new Launcher(path.resolve(__dirname, \"..\")).launch();\n} catch (e) {\n    throw new Error(\"Unable to launch application. Try deleting .vscode/launchReactNative.js and restarting vscode.\");\n}";
    var vscodeFolder = path.join(projectRootPath, ".vscode");
    var debugStub = path.join(vscodeFolder, "launchReactNative.js");
    return fsUtil.ensureDirectory(vscodeFolder)
        .then(function () { return fsUtil.ensureFileWithContents(debugStub, debuggerEntryCode); })
        .catch(function (err) {
        vscode.window.showErrorMessage(err.message);
    });
}

//# sourceMappingURL=rn-extension.js.map
