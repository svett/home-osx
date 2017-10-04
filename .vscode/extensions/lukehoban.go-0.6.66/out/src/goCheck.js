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
const goPath_1 = require("./goPath");
const goCover_1 = require("./goCover");
const goStatus_1 = require("./goStatus");
const testUtils_1 = require("./testUtils");
const util_1 = require("./util");
const goPackages_1 = require("./goPackages");
const testUtils_2 = require("./testUtils");
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
function runTool(args, cwd, severity, useStdErr, toolName, env, printUnexpectedOutput) {
    let goRuntimePath = goPath_1.getGoRuntimePath();
    let cmd = toolName ? util_1.getBinPath(toolName) : goRuntimePath;
    return new Promise((resolve, reject) => {
        cp.execFile(cmd, args, { env: env, cwd: cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    // Since the tool is run on save which can be frequent
                    // we avoid sending explicit notification if tool is missing
                    console.log(`Cannot find ${toolName ? toolName : goRuntimePath}`);
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
                    // Building skips vendor folders,
                    // But vet and lint take in directories and not import paths, so no way to skip them
                    // So prune out the results from vendor folders herehere.
                    if (!path.isAbsolute(file) && (file.startsWith(`vendor${path.sep}`) || file.indexOf(`${path.sep}vendor${path.sep}`) > -1)) {
                        continue;
                    }
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
function check(fileUri, goConfig) {
    goStatus_1.outputChannel.clear();
    let runningToolsPromises = [];
    let cwd = path.dirname(fileUri.fsPath);
    let currentWorkspace = vscode.workspace.getWorkspaceFolder(fileUri) ? vscode.workspace.getWorkspaceFolder(fileUri).uri.fsPath : '';
    let env = util_1.getToolsEnvVars();
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
        testPromise = testUtils_1.goTest({
            goConfig: goConfig,
            dir: cwd,
            flags: args,
            background: true
        });
        return testPromise;
    };
    if (!!goConfig['buildOnSave'] && goConfig['buildOnSave'] !== 'off') {
        const tmpPath = path.normalize(path.join(os.tmpdir(), 'go-code-check'));
        const isTestFile = fileUri.fsPath.endsWith('_test.go');
        let buildFlags = isTestFile ? testUtils_2.getTestFlags(goConfig, null) : (goConfig['buildFlags'] || []);
        // Remove the -i flag as it will be added later anyway
        if (buildFlags.indexOf('-i') > -1) {
            buildFlags.splice(buildFlags.indexOf('-i'), 1);
        }
        // If current file is a test file, then use `go test -c` instead of `go build` to find build errors
        let buildArgs = isTestFile ? ['test', '-c'] : ['build'];
        buildArgs.push('-i', '-o', tmpPath, ...buildFlags);
        if (goConfig['buildTags'] && buildFlags.indexOf('-tags') === -1) {
            buildArgs.push('-tags');
            buildArgs.push('"' + goConfig['buildTags'] + '"');
        }
        if (goConfig['buildOnSave'] === 'workspace' && currentWorkspace && !isTestFile) {
            let buildPromises = [];
            let outerBuildPromise = goPackages_1.getNonVendorPackages(currentWorkspace).then(pkgs => {
                buildPromises = pkgs.map(pkgPath => {
                    return runTool(buildArgs.concat(pkgPath), cwd, 'error', true, null, env, true);
                });
                return Promise.all(buildPromises).then((resultSets) => {
                    return Promise.resolve([].concat.apply([], resultSets));
                });
            });
            runningToolsPromises.push(outerBuildPromise);
        }
        else {
            // Find the right importPath instead of directly using `.`. Fixes https://github.com/Microsoft/vscode-go/issues/846
            let currentGoWorkspace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), cwd);
            let importPath = currentGoWorkspace ? cwd.substr(currentGoWorkspace.length + 1) : '.';
            runningToolsPromises.push(runTool(buildArgs.concat(importPath), cwd, 'error', true, null, env, true));
        }
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
    if (!!goConfig['lintOnSave'] && goConfig['lintOnSave'] !== 'off') {
        let lintTool = goConfig['lintTool'] || 'golint';
        let lintFlags = goConfig['lintFlags'] || [];
        let lintEnv = Object.assign({}, env);
        let args = [];
        let configFlag = '--config=';
        lintFlags.forEach(flag => {
            // --json is not a valid flag for golint and in gometalinter, it is used to print output in json which we dont want
            if (flag === '--json') {
                return;
            }
            if (flag.startsWith(configFlag)) {
                let configFilePath = flag.substr(configFlag.length);
                configFilePath = util_1.resolvePath(configFilePath);
                args.push(`${configFlag}${configFilePath}`);
                return;
            }
            args.push(flag);
        });
        if (lintTool === 'gometalinter') {
            if (args.indexOf('--aggregate') === -1) {
                args.push('--aggregate');
            }
            if (goConfig['toolsGopath']) {
                // gometalinter will expect its linters to be in the GOPATH
                // So add the toolsGopath to GOPATH
                lintEnv['GOPATH'] += path.delimiter + goConfig['toolsGopath'];
            }
        }
        let lintWorkDir = cwd;
        if (goConfig['lintOnSave'] === 'workspace' && currentWorkspace) {
            args.push('./...');
            lintWorkDir = currentWorkspace;
        }
        runningToolsPromises.push(runTool(args, lintWorkDir, 'warning', false, lintTool, lintEnv));
    }
    if (!!goConfig['vetOnSave'] && goConfig['vetOnSave'] !== 'off') {
        let vetFlags = goConfig['vetFlags'] || [];
        let vetArgs = ['tool', 'vet', ...vetFlags, '.'];
        let vetWorkDir = cwd;
        if (goConfig['vetOnSave'] === 'workspace' && currentWorkspace) {
            vetWorkDir = currentWorkspace;
        }
        runningToolsPromises.push(runTool(vetArgs, vetWorkDir, 'warning', true, null, env));
    }
    if (!!goConfig['coverOnSave']) {
        runTest().then(success => {
            if (!success) {
                return [];
            }
            // FIXME: it's not obvious that tmpCoverPath comes from runTest()
            return goCover_1.getCoverage(tmpCoverPath);
        });
    }
    return Promise.all(runningToolsPromises).then(resultSets => [].concat.apply([], resultSets));
}
exports.check = check;
//# sourceMappingURL=goCheck.js.map