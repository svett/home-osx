'use strict';
var vscode = require('vscode');
var path = require('path');
var util = require('./common');
var vsutil = require('./common_vscode');
var Telemetry = require('./telemetry');
var C_Cpp = require('./LanguageServer/C_Cpp');
var DebuggerExtension = require('./Debugger/extension');
var platform_1 = require('./platform');
var packageManager_1 = require('./packageManager');
var delayedCommandsToExecute;
var unregisterTempCommands;
function registerTempCommand(command) {
    unregisterTempCommands.push(vscode.commands.registerCommand(command, function () {
        delayedCommandsToExecute.add(command);
    }));
}
function activate(context) {
    Telemetry.activate(context);
    util.setExtensionPath(context.extensionPath);
    delayedCommandsToExecute = new Set();
    unregisterTempCommands = [];
    registerTempCommand("extension.pickNativeProcess");
    registerTempCommand("extension.pickRemoteNativeProcess");
    registerTempCommand("C_Cpp.ConfigurationEdit");
    registerTempCommand("C_Cpp.ConfigurationSelect");
    registerTempCommand("C_Cpp.SwitchHeaderSource");
    registerTempCommand("C_Cpp.UnloadLanguageServer");
    processRuntimeDependencies(function () {
        unregisterTempCommands.forEach(function (command) {
            command.dispose();
        });
        unregisterTempCommands = [];
        DebuggerExtension.activate(context);
        C_Cpp.activate(context);
        delayedCommandsToExecute.forEach(function (command) {
            vscode.commands.executeCommand(command);
        });
        delayedCommandsToExecute.clear();
    });
}
exports.activate = activate;
function deactivate() {
    C_Cpp.deactivate();
    DebuggerExtension.deactivate();
    unregisterTempCommands.forEach(function (command) {
        command.dispose();
    });
    Telemetry.deactivate();
}
exports.deactivate = deactivate;
function processRuntimeDependencies(activateExtensions) {
    util.checkLockFile().then(function (lockExists) {
        if (!lockExists) {
            var channel_1 = vsutil.getOutputChannel();
            channel_1.show();
            channel_1.appendLine("Updating C/C++ dependencies...");
            var statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            var errorMessage_1 = '';
            var hasError_1 = false;
            var installationStage_1 = 'getPlatformInfo';
            var platformInfo_1;
            var packageManager_2;
            var telemetryProperties_1 = {};
            platform_1.PlatformInformation.GetPlatformInformation()
                .then(function (info) {
                platformInfo_1 = info;
                packageManager_2 = new packageManager_1.PackageManager(info, channel_1, statusItem);
                channel_1.appendLine("");
                installationStage_1 = "downloadPackages";
                return packageManager_2.DownloadPackages();
            })
                .then(function () {
                channel_1.appendLine("");
                installationStage_1 = "installPackages";
                return packageManager_2.InstallPackages();
            })
                .then(function () {
                installationStage_1 = "makeBinariesExecutable";
                return vsutil.allowExecution(path.resolve(util.getDebugAdaptersPath(), "OpenDebugAD7"));
            })
                .then(function () {
                installationStage_1 = "rewriteManifest";
                return rewriteManifest();
            })
                .then(function () {
                checkDistro(channel_1, platformInfo_1);
                installationStage_1 = "touchLockFile";
                return util.touchLockFile();
            })
                .catch(function (error) {
                hasError_1 = true;
                telemetryProperties_1['stage'] = installationStage_1;
                if (error instanceof packageManager_1.PackageManagerError) {
                    if (error instanceof packageManager_1.PackageManagerWebResponseError) {
                        var webRequestPackageError = error;
                        if (webRequestPackageError.socket) {
                            var address = webRequestPackageError.socket.address();
                            if (address) {
                                telemetryProperties_1['error.targetIP'] = address.address + ':' + address.port;
                            }
                        }
                    }
                    var packageError = error;
                    telemetryProperties_1['error.methodName'] = packageError.methodName;
                    telemetryProperties_1['error.message'] = packageError.message;
                    if (packageError.innerError) {
                        errorMessage_1 = packageError.innerError.toString();
                    }
                    else {
                        errorMessage_1 = packageError.message;
                    }
                    if (packageError.pkg) {
                        telemetryProperties_1['error.packageName'] = packageError.pkg.description;
                        telemetryProperties_1['error.packageUrl'] = packageError.pkg.url;
                    }
                    if (packageError.errorCode) {
                        telemetryProperties_1['error.errorCode'] = packageError.errorCode;
                    }
                }
                else {
                    errorMessage_1 = error.toString();
                }
                channel_1.appendLine("Failed at stage: " + installationStage_1);
                channel_1.appendLine(errorMessage_1);
            })
                .then(function () {
                channel_1.appendLine("");
                installationStage_1 = '';
                channel_1.appendLine("Finished");
                telemetryProperties_1['success'] = (!hasError_1).toString();
                if (platformInfo_1.distribution) {
                    telemetryProperties_1['linuxDistroName'] = platformInfo_1.distribution.name;
                    telemetryProperties_1['linuxDistroVersion'] = platformInfo_1.distribution.version;
                }
                telemetryProperties_1['osArchitecture'] = platformInfo_1.architecture;
                Telemetry.logDebuggerEvent("acquisition", telemetryProperties_1);
                statusItem.dispose();
                activateExtensions();
            });
        }
        else {
            activateExtensions();
        }
    });
}
function checkDistro(channel, platformInfo) {
    if (platformInfo.platform != 'win32' && platformInfo.platform != 'linux' && platformInfo.platform != 'darwin') {
        channel.appendLine("Warning: Debugging has not been tested for this platform. " + util.getReadmeMessage());
    }
}
function rewriteManifest() {
    var manifestPath = path.resolve(util.getExtensionPath(), "package.json");
    return util.readFileText(manifestPath)
        .then(function (manifestString) {
        var manifestObject = JSON.parse(manifestString);
        manifestObject.activationEvents = [
            "onLanguage:cpp",
            "onLanguage:c",
            "onCommand:extension.pickNativeProcess",
            "onCommand:extension.pickRemoteNativeProcess",
            "onCommand:C_Cpp.ConfigurationEdit",
            "onCommand:C_Cpp.ConfigurationSelect",
            "onCommand:C_Cpp.SwitchHeaderSource",
            "onCommand:C_Cpp.UnloadLanguageServer",
            "workspaceContains:.vscode/c_cpp_properties.json",
            "onDebug:cppdbg",
            "onDebug:cppvsdbg"
        ];
        manifestObject.contributes.debuggers[0].runtime = undefined;
        manifestObject.contributes.debuggers[0].program = './debugAdapters/OpenDebugAD7';
        manifestObject.contributes.debuggers[0].windows = { "program": "./debugAdapters/bin/OpenDebugAD7.exe" };
        manifestString = JSON.stringify(manifestObject, null, 2);
        return util.writeFileText(manifestPath, manifestString);
    });
}
//# sourceMappingURL=main.js.map