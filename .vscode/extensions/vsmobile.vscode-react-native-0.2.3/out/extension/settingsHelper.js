// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var vscode = require("vscode");
var path = require("path");
var configurationReader_1 = require("../common/configurationReader");
var packager_1 = require("../common/packager");
var SettingsHelper = (function () {
    function SettingsHelper() {
    }
    Object.defineProperty(SettingsHelper, "settingsJsonPath", {
        /**
         * Path to the workspace settings file
         */
        get: function () {
            return path.join(vscode.workspace.rootPath, ".vscode", "settings.json");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Enable javascript intellisense via typescript.
     */
    SettingsHelper.notifyUserToAddTSDKInSettingsJson = function (path) {
        vscode.window.showInformationMessage("Please make sure you have \"typescript.tsdk\": \"" + path + "\" in .vscode/settings.json and restart VSCode afterwards.");
    };
    /**
     * Removes javascript intellisense via typescript.
     */
    SettingsHelper.notifyUserToRemoveTSDKFromSettingsJson = function (path) {
        vscode.window.showInformationMessage("Please remove \"typescript.tsdk\": \"" + path + "\" from .vscode/settings.json and restart VSCode afterwards.");
    };
    /**
     * Get the path of the Typescript TSDK as it is in the workspace configuration
     */
    SettingsHelper.getTypeScriptTsdk = function () {
        var workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("typescript.tsdk")) {
            var tsdk = workspaceConfiguration.get("typescript.tsdk");
            if (tsdk) {
                return configurationReader_1.ConfigurationReader.readString(tsdk);
            }
        }
        return null;
    };
    /**
     * We get the packager port configured by the user
     */
    SettingsHelper.getPackagerPort = function () {
        var workspaceConfiguration = vscode.workspace.getConfiguration();
        if (workspaceConfiguration.has("react-native.packager.port")) {
            return configurationReader_1.ConfigurationReader.readInt(workspaceConfiguration.get("react-native.packager.port"));
        }
        return packager_1.Packager.DEFAULT_PORT;
    };
    return SettingsHelper;
}());
exports.SettingsHelper = SettingsHelper;

//# sourceMappingURL=settingsHelper.js.map
