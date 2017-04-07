/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const util = require("util");
const goPath_1 = require("./goPath");
const goOutline_1 = require("./goOutline");
let outputChannel = vscode.window.createOutputChannel('Go Tests');
// lastTestConfig holds a reference to the last executed TestConfig which allows
// the last test to be easily re-executed.
let lastTestConfig;
/**
* Executes the unit test at the primary cursor using `go test`. Output
* is sent to the 'Go' channel.
*
* @param goConfig Configuration for the Go extension.
*/
function testAtCursor(goConfig, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('_test.go')) {
        vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
        return;
    }
    getTestFunctions(editor.document).then(testFunctions => {
        let testFunction;
        // Find any test function containing the cursor.
        for (let func of testFunctions) {
            let selection = editor.selection;
            if (selection && func.location.range.contains(selection.start)) {
                testFunction = func;
                break;
            }
        }
        ;
        if (!testFunction) {
            vscode.window.showInformationMessage('No test function found at cursor.');
            return;
        }
        return goTest({
            goConfig: goConfig,
            dir: path.dirname(editor.document.fileName),
            flags: getTestFlags(goConfig, args),
            functions: [testFunction.name]
        });
    }).then(null, err => {
        console.error(err);
    });
}
exports.testAtCursor = testAtCursor;
/**
 * Runs all tests in the package of the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testCurrentPackage(goConfig, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    goTest({
        goConfig: goConfig,
        dir: path.dirname(editor.document.fileName),
        flags: getTestFlags(goConfig, args)
    }).then(null, err => {
        console.error(err);
    });
}
exports.testCurrentPackage = testCurrentPackage;
/**
 * Runs all tests from all directories in the workspace.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testWorkspace(goConfig, args) {
    goTest({
        goConfig: goConfig,
        dir: vscode.workspace.rootPath,
        flags: getTestFlags(goConfig, args),
        includeSubDirectories: true
    }).then(null, err => {
        console.error(err);
    });
}
exports.testWorkspace = testWorkspace;
/**
 * Runs all tests in the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testCurrentFile(goConfig, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('_test.go')) {
        vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
        return;
    }
    return getTestFunctions(editor.document).then(testFunctions => {
        return goTest({
            goConfig: goConfig,
            dir: path.dirname(editor.document.fileName),
            flags: getTestFlags(goConfig, args),
            functions: testFunctions.map(func => { return func.name; })
        });
    }).then(null, err => {
        console.error(err);
        return Promise.resolve(false);
    });
}
exports.testCurrentFile = testCurrentFile;
/**
 * Runs the previously executed test.
 */
function testPrevious() {
    let editor = vscode.window.activeTextEditor;
    if (!lastTestConfig) {
        vscode.window.showInformationMessage('No test has been recently executed.');
        return;
    }
    goTest(lastTestConfig).then(null, err => {
        console.error(err);
    });
}
exports.testPrevious = testPrevious;
/**
 * Reveals the output channel in the UI.
 */
function showTestOutput() {
    outputChannel.show(true);
}
exports.showTestOutput = showTestOutput;
/**
 * Runs go test and presents the output in the 'Go' channel.
 *
 * @param goConfig Configuration for the Go extension.
 */
function goTest(testconfig) {
    return new Promise((resolve, reject) => {
        outputChannel.clear();
        if (!testconfig.background) {
            // Remember this config as the last executed test.
            lastTestConfig = testconfig;
            outputChannel.show(true);
        }
        let buildTags = testconfig.goConfig['buildTags'];
        let args = ['test', ...testconfig.flags, '-timeout', testconfig.goConfig['testTimeout'], '-tags', buildTags];
        let testEnvVars = Object.assign({}, process.env, testconfig.goConfig['testEnvVars']);
        let goRuntimePath = goPath_1.getGoRuntimePath();
        if (!goRuntimePath) {
            vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
            return Promise.resolve();
        }
        if (testconfig.functions) {
            args.push('-run');
            args.push(util.format('^%s$', testconfig.functions.join('|')));
        }
        else if (testconfig.includeSubDirectories) {
            args.push('./...');
        }
        outputChannel.appendLine(['Running tool:', goRuntimePath, ...args].join(' '));
        outputChannel.appendLine('');
        let proc = cp.spawn(goRuntimePath, args, { env: testEnvVars, cwd: testconfig.dir });
        proc.stdout.on('data', chunk => {
            let testOutput = expandFilePathInOutput(chunk.toString(), testconfig.dir);
            outputChannel.append(testOutput);
        });
        proc.stderr.on('data', chunk => outputChannel.append(chunk.toString()));
        proc.on('close', code => {
            if (code) {
                outputChannel.append('Error: Tests failed.');
            }
            else {
                outputChannel.append('Success: Tests passed.');
            }
            resolve(code === 0);
        });
    });
}
exports.goTest = goTest;
/**
 * Returns all Go unit test functions in the given source file.
 *
 * @param the URI of a Go source file.
 * @return test function symbols for the source file.
 */
function getTestFunctions(doc) {
    let documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
    return documentSymbolProvider
        .provideDocumentSymbols(doc, null)
        .then(symbols => symbols.filter(sym => sym.kind === vscode.SymbolKind.Function
        && hasTestFunctionPrefix(sym.name)));
}
/**
 * Returns whether a given function name has a test prefix.
 * Test functions have "Test" or "Example" as a prefix.
 *
 * @param the function name.
 * @return whether the name has a test function prefix.
 */
function hasTestFunctionPrefix(name) {
    return name.startsWith('Test') || name.startsWith('Example');
}
function getTestFlags(goConfig, args) {
    let testFlags = goConfig['testFlags'] ? goConfig['testFlags'] : goConfig['buildFlags'];
    return (args && args.hasOwnProperty('flags') && Array.isArray(args['flags'])) ? args['flags'] : testFlags;
}
function expandFilePathInOutput(output, cwd) {
    let lines = output.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let matches = lines[i].match(/^\t(\S+_test.go):(\d+):/);
        if (matches) {
            lines[i] = lines[i].replace(matches[1], path.join(cwd, matches[1]));
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=goTest.js.map