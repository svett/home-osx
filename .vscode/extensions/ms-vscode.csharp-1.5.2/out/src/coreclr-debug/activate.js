/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var util_1 = require('./util');
var debugInstall = require('./install');
var platform_1 = require('./../platform');
var _debugUtil = null;
var _reporter = null;
var _logger = null;
function activate(context, reporter, logger) {
    _debugUtil = new util_1.CoreClrDebugUtil(context.extensionPath, logger);
    _reporter = reporter;
    _logger = logger;
    if (!util_1.CoreClrDebugUtil.existsSync(_debugUtil.debugAdapterDir())) {
        platform_1.PlatformInformation.GetCurrent().then(function (info) {
            if (info.runtimeId) {
                logger.appendLine("[ERROR]: C# Extension failed to install the debugger package");
                showInstallErrorMessage();
            }
            else {
                if (info.isLinux) {
                    logger.appendLine("[WARNING]: The current Linux distribution '" + info.distribution.name + "' version '" + info.distribution.version + "' is not currently supported by the .NET Core debugger. Debugging will not be available.");
                }
                else {
                    logger.appendLine("[WARNING]: The current operating system is not currently supported by the .NET Core debugger. Debugging will not be available.");
                }
            }
        }, function (err) {
            // Somehow we couldn't figure out the platform we are on
            logger.appendLine("[ERROR]: C# Extension failed to install the debugger package");
            showInstallErrorMessage();
        });
    }
    else if (!util_1.CoreClrDebugUtil.existsSync(_debugUtil.installCompleteFilePath())) {
        _debugUtil.checkDotNetCli()
            .then(function (dotnetInfo) {
            var installer = new debugInstall.DebugInstaller(_debugUtil);
            installer.finishInstall()
                .then(function () {
                vscode.window.setStatusBarMessage('Successfully installed .NET Core Debugger.');
            })
                .catch(function (err) {
                logger.appendLine("[ERROR]: An error occured while installing the .NET Core Debugger:");
                logger.appendLine(err);
                showInstallErrorMessage();
                // TODO: log telemetry?
            });
        }, function (err) {
            // Check for dotnet tools failed. pop the UI
            // err is a DotNetCliError but use defaults in the unexpected case that it's not
            showDotnetToolsWarning(err.ErrorMessage || _debugUtil.defaultDotNetCliErrorMessage());
            _logger.appendLine(err.ErrorString || err);
            // TODO: log telemetry?
        });
    }
}
exports.activate = activate;
function showInstallErrorMessage() {
    vscode.window.showErrorMessage("An error occured during installation of the .NET Core Debugger. The C# extension may need to be reinstalled.");
}
function showDotnetToolsWarning(message) {
    var config = vscode.workspace.getConfiguration('csharp');
    if (!config.get('suppressDotnetInstallWarning', false)) {
        var getDotNetMessage_1 = 'Get .NET CLI tools';
        var goToSettingsMessage_1 = 'Disable this message in user settings';
        // Buttons are shown in right-to-left order, with a close button to the right of everything;
        // getDotNetMessage will be the first button, then goToSettingsMessage, then the close button.
        vscode.window.showErrorMessage(message, goToSettingsMessage_1, getDotNetMessage_1).then(function (value) {
            if (value === getDotNetMessage_1) {
                var open = require('open');
                open('https://www.microsoft.com/net/core');
            }
            else if (value === goToSettingsMessage_1) {
                vscode.commands.executeCommand('workbench.action.openGlobalSettings');
            }
        });
    }
}
//# sourceMappingURL=activate.js.map