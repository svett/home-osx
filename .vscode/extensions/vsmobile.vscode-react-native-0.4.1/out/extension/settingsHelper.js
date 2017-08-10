// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const configurationReader_1 = require("../common/configurationReader");
const packager_1 = require("../common/packager");
const logHelper_1 = require("../common/log/logHelper");
class SettingsHelper {
    /**
     * Path to the workspace settings file
     */
    static get settingsJsonPath() {
        return path.join(vscode.workspace.rootPath, ".vscode", "settings.json");
    }
    /**
     * Enable javascript intellisense via typescript.
     */
    static notifyUserToAddTSDKInSettingsJson(path) {
        vscode.window.showInformationMessage(`Please make sure you have \"typescript.tsdk\": \"${path}\" in .vscode/settings.json and restart VSCode afterwards.`);
    }
    /**
     * Removes javascript intellisense via typescript.
     */
    static notifyUserToRemoveTSDKFromSettingsJson(path) {
        vscode.window.showInformationMessage(`Please remove \"typescript.tsdk\": \"${path}\" from .vscode/settings.json and restart VSCode afterwards.`);
    }
    /**
     * Get the path of the Typescript TSDK as it is in the workspace configuration
     */
    static getTypeScriptTsdk() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("typescript.tsdk")) {
            const tsdk = workspaceConfiguration.get("typescript.tsdk");
            if (tsdk) {
                return configurationReader_1.ConfigurationReader.readString(tsdk);
            }
        }
        return null;
    }
    /**
     * We get the packager port configured by the user
     */
    static getPackagerPort() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native.packager.port")) {
            return configurationReader_1.ConfigurationReader.readInt(workspaceConfiguration.get("react-native.packager.port"));
        }
        return packager_1.Packager.DEFAULT_PORT;
    }
    /**
     * Get showInternalLogs setting
     */
    static getShowInternalLogs() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.showInternalLogs")) {
            return configurationReader_1.ConfigurationReader.readBoolean(workspaceConfiguration.get("react-native-tools.showInternalLogs"));
        }
        return false;
    }
    /**
     * Get logLevel setting
     */
    static getLogLevel() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.logLevel")) {
            let logLevelString = configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get("react-native-tools.logLevel"));
            return parseInt(logHelper_1.LogLevel[logLevelString], 10);
        }
        return logHelper_1.LogLevel.None;
    }
    /**
     * Get the React Native project root path
     */
    static getReactNativeProjectRoot() {
        const workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native-tools.projectRoot")) {
            let projectRoot = configurationReader_1.ConfigurationReader.readString(workspaceConfiguration.get("react-native-tools.projectRoot"));
            if (path.isAbsolute(projectRoot)) {
                return projectRoot;
            }
            else {
                return path.resolve(vscode.workspace.rootPath, projectRoot);
            }
        }
        return vscode.workspace.rootPath;
    }
}
exports.SettingsHelper = SettingsHelper;

//# sourceMappingURL=settingsHelper.js.map
