/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const goStatus_1 = require("./goStatus");
const goPath_1 = require("./goPath");
const goStatus_2 = require("./goStatus");
const util_1 = require("./util");
let updatesDeclinedTools = [];
function getTools(goVersion) {
    let goConfig = vscode.workspace.getConfiguration('go');
    let tools = {
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
    if (goConfig['lintTool'] === 'gometalinter') {
        tools['gometalinter'] = 'github.com/alecthomas/gometalinter';
    }
    if (goConfig['useLanguageServer']) {
        tools['go-langserver'] = 'github.com/sourcegraph/go-langserver';
    }
    return tools;
}
function installAllTools() {
    util_1.getGoVersion().then((goVersion) => installTools(goVersion));
}
exports.installAllTools = installAllTools;
function promptForMissingTool(tool) {
    util_1.getGoVersion().then((goVersion) => {
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
        vscode.window.showInformationMessage(`The "${tool}" command is not available.  Use "go get -v ${getTools(goVersion)[tool]}" to install.`, 'Install', 'Install All').then(selected => {
            if (selected === 'Install') {
                installTools(goVersion, [tool]);
            }
            else if (selected === 'Install All') {
                getMissingTools(goVersion).then((missing) => installTools(goVersion, missing));
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
    util_1.getGoVersion().then((goVersion) => {
        vscode.window.showInformationMessage(`The Go extension is better with the latest version of "${tool}". Use "go get -u -v ${getTools(goVersion)[tool]}" to update`, 'Update').then(selected => {
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
    let tools = getTools(goVersion);
    let goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return;
    }
    if (!missing) {
        missing = Object.keys(tools);
    }
    goStatus_2.outputChannel.show();
    goStatus_2.outputChannel.clear();
    goStatus_2.outputChannel.appendLine(`Installing ${missing.length} ${missing.length > 1 ? 'tools' : 'tool'}`);
    missing.forEach((missingTool, index, missing) => {
        goStatus_2.outputChannel.appendLine('  ' + missingTool);
    });
    goStatus_2.outputChannel.appendLine(''); // Blank line for spacing.
    // http.proxy setting takes precedence over environment variables
    let httpProxy = vscode.workspace.getConfiguration('http').get('proxy');
    let envForTools = Object.assign({}, process.env);
    if (httpProxy) {
        envForTools = Object.assign({}, process.env, {
            http_proxy: httpProxy,
            HTTP_PROXY: httpProxy,
            https_proxy: httpProxy,
            HTTPS_PROXY: httpProxy,
        });
    }
    // If the go.toolsGopath is set, use
    // its value as the GOPATH for the "go get" child process.
    let toolsGopath = util_1.getToolsGopath();
    let envWithSeparateGoPathForTools = null;
    if (toolsGopath) {
        envWithSeparateGoPathForTools = Object.assign({}, envForTools, { GOPATH: toolsGopath });
    }
    missing.reduce((res, tool) => {
        return res.then(sofar => new Promise((resolve, reject) => {
            // gometalinter expects its linters to be in the user's GOPATH
            // Therefore, cannot use an isolated GOPATH for installing gometalinter
            let env = (envWithSeparateGoPathForTools && tool !== 'gometalinter') ? envWithSeparateGoPathForTools : envForTools;
            cp.execFile(goRuntimePath, ['get', '-u', '-v', tools[tool]], { env }, (err, stdout, stderr) => {
                if (err) {
                    goStatus_2.outputChannel.appendLine('Installing ' + tool + ' FAILED');
                    let failureReason = tool + ';;' + err + stdout.toString() + stderr.toString();
                    resolve([...sofar, failureReason]);
                }
                else {
                    goStatus_2.outputChannel.appendLine('Installing ' + tool + ' SUCCEEDED');
                    if (tool === 'gometalinter') {
                        // Gometalinter needs to install all the linters it uses.
                        goStatus_2.outputChannel.appendLine('Installing all linters used by gometalinter....');
                        let gometalinterBinPath = util_1.getBinPath('gometalinter');
                        cp.execFile(gometalinterBinPath, ['--install'], (err, stdout, stderr) => {
                            if (!err) {
                                goStatus_2.outputChannel.appendLine('Installing all linters used by gometalinter SUCCEEDED.');
                                resolve([...sofar, null]);
                            }
                            else {
                                let failureReason = `Error while running gometalinter --install;; ${stderr}`;
                                resolve([...sofar, failureReason]);
                            }
                        });
                    }
                    else {
                        resolve([...sofar, null]);
                    }
                }
            });
        }));
    }, Promise.resolve([])).then(res => {
        goStatus_2.outputChannel.appendLine(''); // Blank line for spacing
        let failures = res.filter(x => x != null);
        if (failures.length === 0) {
            if (missing.indexOf('langserver-go') > -1) {
                goStatus_2.outputChannel.appendLine('Reload VS Code window to use the Go language server');
            }
            goStatus_2.outputChannel.appendLine('All tools successfully installed. You\'re ready to Go :).');
            return;
        }
        goStatus_2.outputChannel.appendLine(failures.length + ' tools failed to install.\n');
        failures.forEach((failure, index, failures) => {
            let reason = failure.split(';;');
            goStatus_2.outputChannel.appendLine(reason[0] + ':');
            goStatus_2.outputChannel.appendLine(reason[1]);
        });
    });
}
function updateGoPathGoRootFromConfig() {
    let goroot = vscode.workspace.getConfiguration('go')['goroot'];
    if (goroot) {
        process.env['GOROOT'] = goroot;
    }
    let gopath = vscode.workspace.getConfiguration('go')['gopath'];
    if (gopath) {
        process.env['GOPATH'] = goPath_1.resolvePath(gopath, vscode.workspace.rootPath);
    }
    let inferGoPath = vscode.workspace.getConfiguration('go')['inferGopath'];
    if (inferGoPath) {
        let dirs = vscode.workspace.rootPath.toLowerCase().split(path.sep);
        // find src directory closest to workspace root
        let srcIdx = dirs.lastIndexOf('src');
        if (srcIdx > 0) {
            process.env['GOPATH'] = vscode.workspace.rootPath.substr(0, dirs.slice(0, srcIdx).join(path.sep).length);
        }
    }
    if (process.env['GOPATH']) {
        return Promise.resolve();
    }
    // From Go 1.8 onwards, when there is no GOPATH set, there is default GOPATH used which can be got from running `go env`
    let goRuntimePath = goPath_1.getGoRuntimePath();
    return new Promise((resolve, reject) => {
        cp.execFile(goRuntimePath, ['env'], (err, stdout, stderr) => {
            if (err) {
                return reject();
            }
            let gopathOutput = stdout.split('\n').find((value, index) => { return value.startsWith('GOPATH="') && value.trim().endsWith('"'); });
            if (gopathOutput) {
                process.env['GOPATH'] = gopathOutput.trim().substring('GOPATH="'.length, gopathOutput.length - 1);
            }
            return resolve();
        });
    });
}
exports.updateGoPathGoRootFromConfig = updateGoPathGoRootFromConfig;
function offerToInstallTools() {
    util_1.isVendorSupported();
    util_1.getGoVersion().then(goVersion => {
        getMissingTools(goVersion).then(missing => {
            if (missing.length > 0) {
                goStatus_1.showGoStatus('Analysis Tools Missing', 'go.promptforinstall', 'Not all Go tools are available on the GOPATH');
                vscode.commands.registerCommand('go.promptforinstall', () => {
                    promptForInstall(goVersion, missing);
                    goStatus_1.hideGoStatus();
                });
            }
        });
    });
    function promptForInstall(goVersion, missing) {
        let item = {
            title: 'Install',
            command() {
                installTools(goVersion, missing);
            }
        };
        vscode.window.showInformationMessage('Some Go analysis tools are missing from your GOPATH.  Would you like to install them?', item).then(selection => {
            if (selection) {
                selection.command();
            }
        });
    }
}
exports.offerToInstallTools = offerToInstallTools;
function getMissingTools(goVersion) {
    let keys = Object.keys(getTools(goVersion));
    return Promise.all(keys.map(tool => new Promise((resolve, reject) => {
        let toolPath = util_1.getBinPath(tool);
        fs.exists(toolPath, exists => {
            resolve(exists ? null : tool);
        });
    }))).then(res => {
        let missing = res.filter(x => x != null);
        return missing;
    });
}
// If langserver needs to be used, but is not installed, this will prompt user to install and Reload
// If langserver needs to be used, and is installed, this will return true
// Returns false in all other cases
function checkLanguageServer() {
    if (process.platform === 'win32')
        return false;
    let latestGoConfig = vscode.workspace.getConfiguration('go');
    if (!latestGoConfig['useLanguageServer'])
        return false;
    let langServerAvailable = util_1.getBinPath('go-langserver') !== 'go-langserver';
    if (!langServerAvailable) {
        promptForMissingTool('go-langserver');
        vscode.window.showInformationMessage('Reload VS Code window after installing the Go language server');
    }
    return langServerAvailable;
}
exports.checkLanguageServer = checkLanguageServer;
//# sourceMappingURL=goInstallTools.js.map