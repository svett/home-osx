/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");
const goPath_1 = require("./goPath");
const goCover_1 = require("./goCover");
const goStatus_1 = require("./goStatus");
const goInstallTools_1 = require("./goInstallTools");
const goTest_1 = require("./goTest");
const util_1 = require("./util");
let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
statusBarItem.command = 'go.test.showOutput';
function removeTestStatus(e) {
    if (e.document.isUntitled) {
        return;
    }
    statusBarItem.hide();
    statusBarItem.text = '';
}
exports.removeTestStatus = removeTestStatus;
/**
 * Runs given Go tool and returns errors/warnings that can be fed to the Problems Matcher
 * @param args Arguments to be passed while running given tool
 * @param cwd cwd that will passed in the env object while running given tool
 * @param severity error or warning
 * @param useStdErr If true, the stderr of the output of the given tool will be used, else stdout will be used
 * @param toolName The name of the Go tool to run. If none is provided, the go runtime itself is used
 * @param printUnexpectedOutput If true, then output that doesnt match expected format is printed to the output channel
 */
function runTool(args, cwd, severity, useStdErr, toolName, printUnexpectedOutput) {
    let goRuntimePath = goPath_1.getGoRuntimePath();
    let cmd = toolName ? util_1.getBinPath(toolName) : goRuntimePath;
    return new Promise((resolve, reject) => {
        cp.execFile(cmd, args, { cwd: cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    if (toolName) {
                        goInstallTools_1.promptForMissingTool(toolName);
                    }
                    else {
                        vscode.window.showInformationMessage(`Cannot find ${goRuntimePath}`);
                    }
                    return resolve([]);
                }
                if (err && stderr && !useStdErr) {
                    goStatus_1.outputChannel.appendLine(['Error while running tool:', cmd, ...args].join(' '));
                    goStatus_1.outputChannel.appendLine(stderr);
                    return resolve([]);
                }
                let lines = (useStdErr ? stderr : stdout).toString().split('\n');
                goStatus_1.outputChannel.appendLine(['Finished running tool:', cmd, ...args].join(' '));
                let ret = [];
                let unexpectedOutput = false;
                let atleastSingleMatch = false;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i][0] === '\t' && ret.length > 0) {
                        ret[ret.length - 1].msg += '\n' + lines[i];
                        continue;
                    }
                    let match = /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+)?)?:(?:\w+:)? (.*)$/.exec(lines[i]);
                    if (!match) {
                        if (printUnexpectedOutput && useStdErr && stderr)
                            unexpectedOutput = true;
                        continue;
                    }
                    atleastSingleMatch = true;
                    let [_, __, file, ___, lineStr, ____, charStr, msg] = match;
                    let line = +lineStr;
                    file = path.resolve(cwd, file);
                    ret.push({ file, line, msg, severity });
                    goStatus_1.outputChannel.appendLine(`${file}:${line}: ${msg}`);
                }
                if (!atleastSingleMatch && unexpectedOutput && vscode.window.activeTextEditor) {
                    goStatus_1.outputChannel.appendLine(stderr);
                    if (err) {
                        ret.push({
                            file: vscode.window.activeTextEditor.document.fileName,
                            line: 1,
                            msg: stderr,
                            severity: 'error'
                        });
                    }
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
    let testPromise;
    let tmpCoverPath;
    let runTest = () => {
        if (testPromise) {
            return testPromise;
        }
        let buildFlags = goConfig['testFlags'] || goConfig['buildFlags'] || [];
        let args = buildFlags;
        if (goConfig['coverOnSave']) {
            tmpCoverPath = path.normalize(path.join(os.tmpdir(), 'go-code-cover'));
            args = ['-coverprofile=' + tmpCoverPath, ...buildFlags];
        }
        testPromise = goTest_1.goTest({
            goConfig: goConfig,
            dir: cwd,
            flags: args,
            background: true
        });
        return testPromise;
    };
    if (!!goConfig['buildOnSave']) {
        // we need to parse the file to check the package name
        // if the package is a main pkg, we won't be doing a go build -i
        let buildPromise = new Promise((resolve, reject) => {
            let isMainPkg = false;
            fs.readFile(filename, 'utf8', (err, data) => {
                if (err) {
                    return;
                }
                let prelude = util_1.parseFilePrelude(data);
                if (prelude.pkg) {
                    isMainPkg = prelude.pkg.name === 'main';
                }
                let buildFlags = goConfig['buildFlags'] || [];
                let buildTags = '"' + goConfig['buildTags'] + '"';
                let tmppath = path.normalize(path.join(os.tmpdir(), 'go-code-check'));
                let args = ['build'];
                if (!isMainPkg) {
                    args.push('-i');
                }
                ;
                let currentGoWorkspace = util_1.getCurrentGoWorkspaceFromGOPATH(cwd);
                let importPath = cwd.substr(currentGoWorkspace.length + 1);
                args = args.concat(['-o', tmppath, '-tags', buildTags, ...buildFlags, importPath]);
                if (filename.match(/_test.go$/i)) {
                    args = ['test', '-copybinary', '-o', tmppath, '-c', '-tags', buildTags, ...buildFlags, importPath];
                }
                runTool(args, cwd, 'error', true, null, true).then(result => resolve(result), err => reject(err));
            });
        });
        runningToolsPromises.push(buildPromise);
    }
    if (!!goConfig['testOnSave']) {
        statusBarItem.show();
        statusBarItem.text = 'Tests Running';
        runTest().then(success => {
            if (statusBarItem.text === '') {
                return;
            }
            if (success) {
                statusBarItem.text = 'Tests Passed';
            }
            else {
                statusBarItem.text = 'Tests Failed';
            }
        });
    }
    if (!!goConfig['lintOnSave']) {
        let lintTool = goConfig['lintTool'] || 'golint';
        let lintFlags = goConfig['lintFlags'] || [];
        // --json is not a valid flag for golint and in gometalinter, it is used to print output in json which we dont want
        let jsonFlagindex = lintFlags.indexOf('--json');
        if (jsonFlagindex > -1)
            lintFlags.splice(jsonFlagindex, 1);
        let args = [...lintFlags];
        runningToolsPromises.push(runTool(args, cwd, 'warning', false, lintTool));
    }
    if (!!goConfig['vetOnSave']) {
        let vetFlags = goConfig['vetFlags'] || [];
        runningToolsPromises.push(runTool(['tool', 'vet', ...vetFlags, filename], cwd, 'warning', true, null));
    }
    if (!!goConfig['coverOnSave']) {
        let coverPromise = runTest().then(success => {
            if (!success) {
                return [];
            }
            // FIXME: it's not obvious that tmpCoverPath comes from runTest()
            return goCover_1.getCoverage(tmpCoverPath);
        });
        runningToolsPromises.push(coverPromise);
    }
    return Promise.all(runningToolsPromises).then(resultSets => [].concat.apply([], resultSets));
}
exports.check = check;
//# sourceMappingURL=goCheck.js.map