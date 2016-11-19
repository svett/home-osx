// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var fileSystem_1 = require("../common/node/fileSystem");
var path = require("path");
var Q = require("q");
var vscode = require("vscode");
var semver = require("semver");
var telemetry_1 = require("../common/telemetry");
var telemetryHelper_1 = require("../common/telemetryHelper");
var commandExecutor_1 = require("../common/commandExecutor");
var tsconfigHelper_1 = require("./tsconfigHelper");
var settingsHelper_1 = require("./settingsHelper");
var hostPlatform_1 = require("../common/hostPlatform");
var log_1 = require("../common/log/log");
var logHelper_1 = require("../common/log/logHelper");
var IntellisenseHelper = (function () {
    function IntellisenseHelper() {
    }
    // note: semver considers "x.x.x-<string>" to be < "x.x.x"" - so we include insider here as the
    //       insider build is less than the release build of 0.10.10 and we will support it.
    /**
     * Helper method that configures the workspace for Salsa intellisense.
     */
    IntellisenseHelper.setupReactNativeIntellisense = function () {
        // Telemetry - Send Salsa Environment setup information
        var tsSalsaEnvSetup = telemetryHelper_1.TelemetryHelper.createTelemetryEvent("RNIntellisense");
        telemetryHelper_1.TelemetryHelper.addTelemetryEventProperty(tsSalsaEnvSetup, "TsSalsaEnvSetup", !!process.env.VSCODE_TSJS, false);
        telemetry_1.Telemetry.send(tsSalsaEnvSetup);
        var configureWorkspace = Q({})
            .then(function () { return tsconfigHelper_1.TsConfigHelper.createTsConfigIfNotPresent(); })
            .then(function () { return IntellisenseHelper.installReactNativeTypings(); });
        // The actions taken in the promise chain below may result in requring a restart.
        var configureTypescript = Q(false)
            .then(function (isRestartRequired) { return IntellisenseHelper.enableSalsa(isRestartRequired); })
            .then(function (isRestartRequired) { return IntellisenseHelper.verifyInstallTypeScript(isRestartRequired); })
            .then(function (isRestartRequired) { return IntellisenseHelper.configureWorkspaceSettings(isRestartRequired); })
            .then(function (isRestartRequired) { return IntellisenseHelper.warnIfRestartIsRequired(isRestartRequired); })
            .catch(function (err) {
            log_1.Log.logError("Error while setting up IntelliSense: " + err);
            return Q.reject(err);
        });
        /* TODO #83: Refactor this code to
            Q.all([enableSalsa(), installTypescript(), configureWorkspace()])
            .then((result) => warnIfRestartIsRequired(result.any((x) => x)))
        */
        return Q.all([configureWorkspace, configureTypescript]).then(function () { });
    };
    /**
     * Helper method that install typings for React Native.
     */
    IntellisenseHelper.installReactNativeTypings = function () {
        var typingsSource = path.resolve(__dirname, "..", "..", "ReactTypings");
        var reactTypings = path.resolve(typingsSource, "react");
        var reactNativeTypings = path.resolve(typingsSource, "react-native");
        var typingsIndex = path.resolve(typingsSource, "react-native.d.ts.index");
        var typingsDestination = path.resolve(vscode.workspace.rootPath, ".vscode", "typings");
        var reactTypingsDestination = path.resolve(typingsDestination, "react");
        var reactNativeTypingsDestination = path.resolve(typingsDestination, "react-native");
        var typingsIndexDestination = path.resolve(vscode.workspace.rootPath, "typings");
        var typingIndexFinalPath = path.resolve(typingsIndexDestination, "react-native.d.ts");
        var fileSystem = new fileSystem_1.FileSystem();
        var createTypingsDirectoryIfNeeded = fileSystem.directoryExists(typingsDestination).
            then(function (exists) {
            if (!exists) {
                return fileSystem.makeDirectoryRecursiveSync(typingsDestination);
            }
        });
        var copyReactTypingsIfNeeded = fileSystem.directoryExists(reactTypingsDestination)
            .then(function (exists) {
            if (!exists) {
                return fileSystem.copyRecursive(reactTypings, reactTypingsDestination);
            }
        });
        var copyReactNativeTypingsIfNeeded = fileSystem.directoryExists(reactNativeTypingsDestination)
            .then(function (exists) {
            if (!exists) {
                return fileSystem.copyRecursive(reactNativeTypings, reactNativeTypingsDestination);
            }
        });
        var copyTypingsIndexIfNeeded = fileSystem.directoryExists(typingsIndexDestination)
            .then(function (exists) {
            if (!exists) {
                return fileSystem.makeDirectoryRecursiveSync(typingsIndexDestination);
            }
        })
            .then(function () { return fileSystem.exists(typingIndexFinalPath); })
            .then(function (exists) {
            if (!exists) {
                return fileSystem.copyFile(typingsIndex, typingIndexFinalPath);
            }
        });
        return Q.all([
            createTypingsDirectoryIfNeeded,
            copyReactTypingsIfNeeded,
            copyReactNativeTypingsIfNeeded,
            copyTypingsIndexIfNeeded,
        ]).then(function () { });
    };
    /**
     * Helper method that verifies the correct version of TypeScript is installed.
     * If using a newer version of VSCode TypeScript is installed by default and no
     * action is needed. If using an older version, verify that the correct TS version is
     * installed, if not install it.
     */
    IntellisenseHelper.verifyInstallTypeScript = function (isRestartRequired) {
        if (IntellisenseHelper.isSalsaSupported()) {
            // this is the correct version of vscode, which includes TypeScript (Salsa) support, nothing to do here
            return Q.resolve(isRestartRequired);
        }
        return IntellisenseHelper.getInstalledTypeScriptVersion()
            .then(function (installProps) {
            if (installProps.installed === true) {
                if (semver.neq(IntellisenseHelper.s_typeScriptVersion, installProps.version)) {
                    log_1.Log.logInternalMessage(logHelper_1.LogLevel.Debug, "TypeScript is installed with the wrong version: " + installProps.version);
                    return true;
                }
                else {
                    log_1.Log.logInternalMessage(logHelper_1.LogLevel.Debug, "Installed TypeScript version is correct");
                    return false;
                }
            }
            else {
                log_1.Log.logInternalMessage(logHelper_1.LogLevel.Debug, "TypeScript is not installed");
                return true;
            }
        })
            .then(function (install) {
            if (install) {
                var installPath = path.resolve(hostPlatform_1.HostPlatform.getUserHomePath(), ".vscode");
                var runArguments = [];
                var npmCommand = hostPlatform_1.HostPlatform.getNpmCliCommand("npm");
                runArguments.push("install");
                runArguments.push("--prefix " + installPath);
                runArguments.push("typescript@" + IntellisenseHelper.s_typeScriptVersion);
                return new commandExecutor_1.CommandExecutor(installPath).spawn(npmCommand, runArguments)
                    .then(function () {
                    return true;
                })
                    .catch(function (err) {
                    log_1.Log.logError("Error attempting to install TypeScript: " + err);
                    return Q.reject(err);
                });
            }
            else {
                return isRestartRequired;
            }
        });
    };
    IntellisenseHelper.configureWorkspaceSettings = function (isRestartRequired) {
        var typeScriptLibPath = path.resolve(IntellisenseHelper.getTypeScriptInstallPath(), "lib");
        var tsdkPath = settingsHelper_1.SettingsHelper.getTypeScriptTsdk();
        if (IntellisenseHelper.isSalsaSupported()) {
            if (tsdkPath === typeScriptLibPath) {
                // Note: In previous releases of VSCode (< 0.10.10) the Salsa TypeScript
                // IntelliSense was not enabled by default, this extension would install
                // Salsa itself, and update the settings to point at that. Here we
                // attempt to reset that value to null if it still points to the previous
                // installed (and no longer valid) version of TypeScript.
                settingsHelper_1.SettingsHelper.notifyUserToRemoveTSDKFromSettingsJson(tsdkPath);
                // We are already telling the user to restart. No need to show another message.
                return false;
            }
        }
        else {
            if (tsdkPath === null) {
                settingsHelper_1.SettingsHelper.notifyUserToAddTSDKInSettingsJson(typeScriptLibPath);
                // We are already telling the user to restart. No need to show another message.
                return false;
            }
        }
        return isRestartRequired;
    };
    IntellisenseHelper.warnIfRestartIsRequired = function (isRestartRequired) {
        if (isRestartRequired) {
            vscode.window.showInformationMessage("React Native intellisense was successfully configured for this project. Restart to enable it.");
        }
        return;
    };
    /**
     * Helper method that sets the environment variable and informs the user they need to restart
     * in order to enable the Salsa intellisense.
     */
    IntellisenseHelper.enableSalsa = function (isRestartRequired) {
        if (!IntellisenseHelper.isSalsaSupported() && !process.env.VSCODE_TSJS) {
            return Q({})
                .then(function () { return hostPlatform_1.HostPlatform.setEnvironmentVariable("VSCODE_TSJS", "1"); })
                .then(function () { return true; });
        }
        return Q(isRestartRequired);
    };
    /**
     * Simple check to see if the TypeScript package is in the expected location (where we installed it)
     */
    IntellisenseHelper.isTypeScriptInstalled = function () {
        var fileSystem = new fileSystem_1.FileSystem();
        var installPath = path.join(IntellisenseHelper.getTypeScriptInstallPath(), "lib");
        return fileSystem.exists(installPath);
    };
    /**
     * Checks for the existance of our installed TypeScript package, if it exists also determine its version
     */
    IntellisenseHelper.getInstalledTypeScriptVersion = function () {
        return IntellisenseHelper.isTypeScriptInstalled()
            .then(function (installed) {
            var installProps = {
                installed: installed,
                version: "",
            };
            if (installed === true) {
                log_1.Log.logInternalMessage(logHelper_1.LogLevel.Debug, "TypeScript is installed - checking version");
                return IntellisenseHelper.readPackageJson()
                    .then(function (version) {
                    installProps.version = version;
                    return installProps;
                });
            }
            else {
                return installProps;
            }
        });
    };
    /**
     * Read the package.json from the TypeScript install path and return the version if it's available
     */
    IntellisenseHelper.readPackageJson = function () {
        var packageFilePath = path.join(IntellisenseHelper.getTypeScriptInstallPath(), "package.json");
        var fileSystem = new fileSystem_1.FileSystem();
        return fileSystem.exists(packageFilePath)
            .then(function (exists) {
            if (!exists) {
                return Q.reject("package.json not found at:" + packageFilePath);
            }
            return fileSystem.readFile(packageFilePath, "utf-8");
        })
            .then(function (jsonContents) {
            var data = JSON.parse(jsonContents);
            return data.version;
        })
            .catch(function (err) {
            log_1.Log.logError("Error while processing package.json: " + err);
            return "0.0.0";
        });
    };
    /**
     * Simple helper to get the TypeScript install path
     */
    IntellisenseHelper.getTypeScriptInstallPath = function () {
        var codePath = path.resolve(hostPlatform_1.HostPlatform.getUserHomePath(), ".vscode");
        var typeScriptLibPath = path.join(codePath, "node_modules", "typescript");
        return typeScriptLibPath;
    };
    /**
     * Simple helper to determine if the current version of VSCode supports TypeScript (Salsa) or better
     */
    IntellisenseHelper.isSalsaSupported = function () {
        return semver.gte(vscode.version, IntellisenseHelper.s_vsCodeVersion, true);
    };
    IntellisenseHelper.s_typeScriptVersion = "1.8.2"; // preferred version of TypeScript for legacy VSCode installs
    IntellisenseHelper.s_vsCodeVersion = "0.10.10-insider"; // preferred version of VSCode (current is 0.10.9, 0.10.10-insider+ will include native TypeScript support)
    return IntellisenseHelper;
}());
exports.IntellisenseHelper = IntellisenseHelper;

//# sourceMappingURL=intellisenseHelper.js.map
