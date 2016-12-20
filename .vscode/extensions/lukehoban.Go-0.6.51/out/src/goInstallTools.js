/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var fs = require('fs');
var cp = require('child_process');
var goStatus_1 = require('./goStatus');
var goPath_1 = require('./goPath');
var goStatus_2 = require('./goStatus');
var util_1 = require('./util');
var updatesDeclinedTools = [];
function getTools(goVersion) {
    var goConfig = vscode.workspace.getConfiguration('go');
    var tools = {
        'gocode': 'github.com/nsf/gocode',
        'gopkgs': 'github.com/tpng/gopkgs',
        'go-outline': 'github.com/lukehoban/go-outline',
        'go-symbols': 'github.com/newhook/go-symbols',
        'guru': 'golang.org/x/tools/cmd/guru',
        'gorename': 'golang.org/x/tools/cmd/gorename'
    };
    // Install the doc/def tool that was chosen by the user
    if (goConfig['docsTool'] === 'godoc') {
        tools['godef'] = 'github.com/rogpeppe/godef';
    }
    else if (goConfig['docsTool'] === 'gogetdoc') {
        tools['gogetdoc'] = 'github.com/zmb3/gogetdoc';
    }
    // Install the formattool that was chosen by the user
    if (goConfig['formatTool'] === 'goimports') {
        tools['goimports'] = 'golang.org/x/tools/cmd/goimports';
    }
    else if (goConfig['formatTool'] === 'goreturns') {
        tools['goreturns'] = 'sourcegraph.com/sqs/goreturns';
    }
    // golint and gotests are not supported in go1.5
    if (!goVersion || (goVersion.major > 1 || (goVersion.major === 1 && goVersion.minor > 5))) {
        tools['golint'] = 'github.com/golang/lint/golint';
        tools['gotests'] = 'github.com/cweill/gotests/...';
    }
    return tools;
}
function installAllTools() {
    util_1.getGoVersion().then(function (goVersion) { return installTools(goVersion); });
}
exports.installAllTools = installAllTools;
function promptForMissingTool(tool) {
    util_1.getGoVersion().then(function (goVersion) {
        if (goVersion && goVersion.major === 1 && goVersion.minor < 6) {
            if (tool === 'golint') {
                vscode.window.showInformationMessage('golint no longer supports go1.5, update your settings to use gometalinter as go.lintTool and install gometalinter');
                return;
            }
            if (tool === 'gotests') {
                vscode.window.showInformationMessage('Generate unit tests feature is not supported as gotests tool needs go1.6 or higher.');
                return;
            }
        }
        vscode.window.showInformationMessage("The \"" + tool + "\" command is not available.  Use \"go get -v " + getTools(goVersion)[tool] + "\" to install.", 'Install All', 'Install').then(function (selected) {
            if (selected === 'Install') {
                installTools(goVersion, [tool]);
            }
            else if (selected === 'Install All') {
                getMissingTools(goVersion).then(function (missing) { return installTools(goVersion, missing); });
                goStatus_1.hideGoStatus();
            }
        });
    });
}
exports.promptForMissingTool = promptForMissingTool;
function promptForUpdatingTool(tool) {
    // If user has declined to update, then don't prompt
    if (updatesDeclinedTools.indexOf(tool) > -1) {
        return;
    }
    util_1.getGoVersion().then(function (goVersion) {
        vscode.window.showInformationMessage("The Go extension is better with the latest version of \"" + tool + "\". Use \"go get -u -v " + getTools(goVersion)[tool] + "\" to update", 'Update').then(function (selected) {
            if (selected === 'Update') {
                installTools(goVersion, [tool]);
            }
            else {
                updatesDeclinedTools.push(tool);
            }
        });
    });
}
exports.promptForUpdatingTool = promptForUpdatingTool;
/**
 * Installs given array of missing tools. If no input is given, the all tools are installed
 *
 * @param string[] array of tool names to be installed
 */
function installTools(goVersion, missing) {
    var tools = getTools(goVersion);
    var goRuntimePath = goPath_1.getGoRuntimePath();
    if (!missing) {
        missing = Object.keys(tools);
    }
    goStatus_2.outputChannel.show();
    goStatus_2.outputChannel.clear();
    goStatus_2.outputChannel.appendLine('Installing ' + missing.length + ' tools');
    missing.forEach(function (missingTool, index, missing) {
        goStatus_2.outputChannel.appendLine('  ' + missingTool);
    });
    goStatus_2.outputChannel.appendLine(''); // Blank line for spacing.
    missing.reduce(function (res, tool) {
        return res.then(function (sofar) { return new Promise(function (resolve, reject) {
            cp.execFile(goRuntimePath, ['get', '-u', '-v', tools[tool]], { env: process.env }, function (err, stdout, stderr) {
                if (err) {
                    goStatus_2.outputChannel.appendLine('Installing ' + tool + ' FAILED');
                    var failureReason = tool + ';;' + err + stdout.toString() + stderr.toString();
                    resolve(sofar.concat([failureReason]));
                }
                else {
                    goStatus_2.outputChannel.appendLine('Installing ' + tool + ' SUCCEEDED');
                    resolve(sofar.concat([null]));
                }
            });
        }); });
    }, Promise.resolve([])).then(function (res) {
        goStatus_2.outputChannel.appendLine(''); // Blank line for spacing
        var failures = res.filter(function (x) { return x != null; });
        if (failures.length === 0) {
            goStatus_2.outputChannel.appendLine('All tools successfully installed. You\'re ready to Go :).');
            return;
        }
        goStatus_2.outputChannel.appendLine(failures.length + ' tools failed to install.\n');
        failures.forEach(function (failure, index, failures) {
            var reason = failure.split(';;');
            goStatus_2.outputChannel.appendLine(reason[0] + ':');
            goStatus_2.outputChannel.appendLine(reason[1]);
        });
    });
}
function updateGoPathGoRootFromConfig() {
    var goroot = vscode.workspace.getConfiguration('go')['goroot'];
    if (goroot) {
        process.env['GOROOT'] = goroot;
    }
    var gopath = vscode.workspace.getConfiguration('go')['gopath'];
    if (gopath) {
        process.env['GOPATH'] = gopath.replace(/\${workspaceRoot}/g, vscode.workspace.rootPath);
    }
}
exports.updateGoPathGoRootFromConfig = updateGoPathGoRootFromConfig;
function setupGoPathAndOfferToInstallTools() {
    updateGoPathGoRootFromConfig();
    util_1.isVendorSupported();
    util_1.getGoVersion().then(function (goVersion) {
        getMissingTools(goVersion).then(function (missing) {
            if (missing.length > 0) {
                goStatus_1.showGoStatus('Analysis Tools Missing', 'go.promptforinstall', 'Not all Go tools are available on the GOPATH');
                vscode.commands.registerCommand('go.promptforinstall', function () {
                    promptForInstall(goVersion, missing);
                    goStatus_1.hideGoStatus();
                });
            }
        });
    });
    function promptForInstall(goVersion, missing) {
        var item = {
            title: 'Install',
            command: function () {
                installTools(goVersion, missing);
            }
        };
        vscode.window.showInformationMessage('Some Go analysis tools are missing from your GOPATH.  Would you like to install them?', item).then(function (selection) {
            if (selection) {
                selection.command();
            }
        });
    }
}
exports.setupGoPathAndOfferToInstallTools = setupGoPathAndOfferToInstallTools;
function getMissingTools(goVersion) {
    var keys = Object.keys(getTools(goVersion));
    return Promise.all(keys.map(function (tool) { return new Promise(function (resolve, reject) {
        var toolPath = goPath_1.getBinPath(tool);
        fs.exists(toolPath, function (exists) {
            resolve(exists ? null : tool);
        });
    }); })).then(function (res) {
        var missing = res.filter(function (x) { return x != null; });
        return missing;
    });
}
//# sourceMappingURL=goInstallTools.js.map