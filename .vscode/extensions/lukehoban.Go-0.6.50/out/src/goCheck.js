/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var path = require('path');
var os = require('os');
var goPath_1 = require('./goPath');
var goCover_1 = require('./goCover');
var goStatus_1 = require('./goStatus');
var goInstallTools_1 = require('./goInstallTools');
function runTool(cmd, args, cwd, severity, useStdErr, toolName, notFoundError) {
    return new Promise(function (resolve, reject) {
        cp.execFile(cmd, args, { cwd: cwd }, function (err, stdout, stderr) {
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
                var lines = (useStdErr ? stderr : stdout).toString().split('\n');
                goStatus_1.outputChannel.appendLine(['Finished running tool:', cmd].concat(args).join(' '));
                var ret = [];
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i][0] === '\t' && ret.length > 0) {
                        ret[ret.length - 1].msg += '\n' + lines[i];
                        continue;
                    }
                    var match = /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+)?)?:(?:\w+:)? (.*)$/.exec(lines[i]);
                    if (!match)
                        continue;
                    var _1 = match[0], __ = match[1], file = match[2], ___ = match[3], lineStr = match[4], ____ = match[5], charStr = match[6], msg = match[7];
                    var line = +lineStr;
                    file = path.resolve(cwd, file);
                    ret.push({ file: file, line: line, msg: msg, severity: severity });
                    goStatus_1.outputChannel.appendLine(file + ":" + line + ": " + msg);
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
    var runningToolsPromises = [];
    var cwd = path.dirname(filename);
    var goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve([]);
    }
    if (!!goConfig['buildOnSave']) {
        var buildFlags = goConfig['buildFlags'] || [];
        var buildTags = '"' + goConfig['buildTags'] + '"';
        var tmppath = path.normalize(path.join(os.tmpdir(), 'go-code-check'));
        var args = ['build', '-o', tmppath, '-tags', buildTags].concat(buildFlags, ['.']);
        if (filename.match(/_test.go$/i)) {
            args = ['test', '-copybinary', '-o', tmppath, '-c', '-tags', buildTags].concat(buildFlags, ['.']);
        }
        runningToolsPromises.push(runTool(goRuntimePath, args, cwd, 'error', true, null, "Cannot find " + goRuntimePath));
    }
    if (!!goConfig['lintOnSave']) {
        var lintTool = goPath_1.getBinPath(goConfig['lintTool'] || 'golint');
        var lintFlags = goConfig['lintFlags'] || [];
        var args = lintFlags.slice();
        if (lintTool === 'golint') {
            args.push(filename);
        }
        runningToolsPromises.push(runTool(lintTool, args, cwd, 'warning', lintTool === 'golint', lintTool === 'golint' ? 'golint' : null, lintTool === 'golint' ? undefined : 'No "gometalinter" could be found.  Install gometalinter to use this option.'));
    }
    if (!!goConfig['vetOnSave']) {
        var vetFlags = goConfig['vetFlags'] || [];
        runningToolsPromises.push(runTool(goRuntimePath, ['tool', 'vet'].concat(vetFlags, [filename]), cwd, 'warning', true, null, "Cannot find " + goRuntimePath));
    }
    if (!!goConfig['coverOnSave']) {
        runningToolsPromises.push(goCover_1.getCoverage(filename));
    }
    return Promise.all(runningToolsPromises).then(function (resultSets) { return [].concat.apply([], resultSets); });
}
exports.check = check;
//# sourceMappingURL=goCheck.js.map