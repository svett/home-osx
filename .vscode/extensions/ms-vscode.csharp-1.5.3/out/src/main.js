/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var vscode = require('vscode');
var vscode_extension_telemetry_1 = require('vscode-extension-telemetry');
var coreclrdebug = require('./coreclr-debug/activate');
var OmniSharp = require('./omnisharp/extension');
var util = require('./common');
var logger_1 = require('./logger');
var packages_1 = require('./packages');
var platform_1 = require('./platform');
var _channel = null;
function activate(context) {
    var extensionId = 'ms-vscode.csharp';
    var extension = vscode.extensions.getExtension(extensionId);
    var extensionVersion = extension.packageJSON.version;
    var aiKey = extension.packageJSON.contributes.debuggers[0].aiKey;
    var reporter = new vscode_extension_telemetry_1.default(extensionId, extensionVersion, aiKey);
    util.setExtensionPath(extension.extensionPath);
    _channel = vscode.window.createOutputChannel('C#');
    var logger = new logger_1.Logger(function (text) { return _channel.append(text); });
    ensureRuntimeDependencies(extension, logger, reporter)
        .then(function () {
        // activate language services
        OmniSharp.activate(context, reporter);
        // activate coreclr-debug
        coreclrdebug.activate(context, reporter, logger);
    });
}
exports.activate = activate;
function ensureRuntimeDependencies(extension, logger, reporter) {
    return util.installFileExists(util.InstallFileType.Lock)
        .then(function (exists) {
        if (!exists) {
            return util.touchInstallFile(util.InstallFileType.Begin).then(function () {
                return installRuntimeDependencies(extension, logger, reporter);
            });
        }
    });
}
function installRuntimeDependencies(extension, logger, reporter) {
    logger.append('Updating C# dependencies...');
    _channel.show();
    var statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    var status = {
        setMessage: function (text) {
            statusItem.text = text;
            statusItem.show();
        },
        setDetail: function (text) {
            statusItem.tooltip = text;
            statusItem.show();
        }
    };
    var platformInfo;
    var packageManager;
    var installationStage = 'touchBeginFile';
    var errorMessage = '';
    var telemetryProps = {};
    return util.touchInstallFile(util.InstallFileType.Begin)
        .then(function () {
        installationStage = 'getPlatformInfo';
        return platform_1.PlatformInformation.GetCurrent();
    })
        .then(function (info) {
        platformInfo = info;
        packageManager = new packages_1.PackageManager(info, extension.packageJSON);
        logger.appendLine();
        // Display platform information and RID followed by a blank line
        logger.append("Platform: " + info.toString());
        if (info.runtimeId) {
            logger.appendLine(" (" + info.runtimeId + ")");
        }
        else {
            logger.appendLine();
        }
        logger.appendLine();
        installationStage = 'downloadPackages';
        var config = vscode.workspace.getConfiguration();
        var proxy = config.get('http.proxy');
        var strictSSL = config.get('http.proxyStrictSSL', true);
        return packageManager.DownloadPackages(logger, status, proxy, strictSSL);
    })
        .then(function () {
        logger.appendLine();
        installationStage = 'installPackages';
        return packageManager.InstallPackages(logger, status);
    })
        .then(function () {
        installationStage = 'touchLockFile';
        return util.touchInstallFile(util.InstallFileType.Lock);
    })
        .then(function () {
        installationStage = 'completeSuccess';
    })
        .catch(function (error) {
        if (error instanceof packages_1.PackageError) {
            // we can log the message in a PackageError to telemetry as we do not put PII in PackageError messages
            telemetryProps['error.message'] = error.message;
            if (error.innerError) {
                errorMessage = error.innerError.toString();
            }
            else {
                errorMessage = error.message;
            }
            if (error.pkg) {
                telemetryProps['error.packageUrl'] = error.pkg.url;
            }
        }
        else {
            // do not log raw errorMessage in telemetry as it is likely to contain PII.
            errorMessage = error.toString();
        }
        logger.appendLine("Failed at stage: " + installationStage);
        logger.appendLine(errorMessage);
    })
        .then(function () {
        telemetryProps['installStage'] = installationStage;
        telemetryProps['platform.architecture'] = platformInfo.architecture;
        telemetryProps['platform.platform'] = platformInfo.platform;
        telemetryProps['platform.runtimeId'] = platformInfo.runtimeId;
        if (platformInfo.distribution) {
            telemetryProps['platform.distribution'] = platformInfo.distribution.toString();
        }
        reporter.sendTelemetryEvent('Acquisition', telemetryProps);
        logger.appendLine();
        installationStage = '';
        logger.appendLine('Finished');
        statusItem.dispose();
    })
        .then(function () {
        // We do this step at the end so that we clean up the begin file in the case that we hit above catch block
        // Attach a an empty catch to this so that errors here do not propogate
        return util.deleteInstallFile(util.InstallFileType.Begin).catch(function (error) { });
    });
}
//# sourceMappingURL=main.js.map