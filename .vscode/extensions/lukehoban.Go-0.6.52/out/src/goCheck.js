/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const os = require("os");
const goPath_1 = require("./goPath");
const goCover_1 = require("./goCover");
const goStatus_1 = require("./goStatus");
const goInstallTools_1 = require("./goInstallTools");
function runTool(cmd, args, cwd, severity, useStdErr, toolName, notFoundError) {
    return new Promise((resolve, reject) => {
        cp.execFile(cmd, args, { cwd: cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    if (toolName) {
                        goInstallTools_1.promptForMissingTool(toolName);
                    }
                    else {
                        vscode.window.showInformationMessage(notFoundError);
                    }
                    return resolve([]);
                }
                let lines = (useStdErr ? stderr : stdout).toString().split('\n');
                goStatus_1.outputChannel.appendLine(['Finished running tool:', cmd, ...args].join(' '));
                let ret = [];
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i][0] === '\t' && ret.length > 0) {
                        ret[ret.length - 1].msg += '\n' + lines[i];
                        continue;
                    }
                    let match = /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+)?)?:(?:\w+:)? (.*)$/.exec(lines[i]);
                    if (!match)
                        continue;
                    let [_, __, file, ___, lineStr, ____, charStr, msg] = match;
                    let line = +lineStr;
                    file = path.resolve(cwd, file);
                    ret.push({ file, line, msg, severity });
                    goStatus_1.outputChannel.appendLine(`${file}:${line}: ${msg}`);
                }
                goStatus_1.outputChannel.appendLine('');
                resolve(ret);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
function check(filename, goConfig) {
    goStatus_1.outputChannel.clear();
    let runningToolsPromises = [];
    let cwd = path.dirname(filename);
    let goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve([]);
    }
    if (!!goConfig['buildOnSave']) {
        let buildFlags = goConfig['buildFlags'] || [];
        let buildTags = '"' + goConfig['buildTags'] + '"';
        let tmppath = path.normalize(path.join(os.tmpdir(), 'go-code-check'));
        let args = ['build', '-o', tmppath, '-tags', buildTags, ...buildFlags, '.'];
        if (filename.match(/_test.go$/i)) {
            args = ['test', '-copybinary', '-o', tmppath, '-c', '-tags', buildTags, ...buildFlags, '.'];
        }
        runningToolsPromises.push(runTool(goRuntimePath, args, cwd, 'error', true, null, `Cannot find ${goRuntimePath}`));
    }
    if (!!goConfig['lintOnSave']) {
        let lintTool = goPath_1.getBinPath(goConfig['lintTool'] || 'golint');
        let lintFlags = goConfig['lintFlags'] || [];
        let args = [...lintFlags];
        if (lintTool === 'golint') {
            args.push(filename);
        }
        runningToolsPromises.push(runTool(lintTool, args, cwd, 'warning', lintTool === 'golint', lintTool === 'golint' ? 'golint' : null, lintTool === 'golint' ? undefined : 'No "gometalinter" could be found.  Install gometalinter to use this option.'));
    }
    if (!!goConfig['vetOnSave']) {
        let vetFlags = goConfig['vetFlags'] || [];
        runningToolsPromises.push(runTool(goRuntimePath, ['tool', 'vet', ...vetFlags, filename], cwd, 'warning', true, null, `Cannot find ${goRuntimePath}`));
    }
    if (!!goConfig['coverOnSave']) {
        runningToolsPromises.push(goCover_1.getCoverage(filename));
    }
    return Promise.all(runningToolsPromises).then(resultSets => [].concat.apply([], resultSets));
}
exports.check = check;
//# sourceMappingURL=goCheck.js.map