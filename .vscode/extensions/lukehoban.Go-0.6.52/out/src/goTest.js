/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
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
*
* TODO: go test returns filenames with no path information for failures,
* so output doesn't produce navigable line references.
*/
function testAtCursor(goConfig) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
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
            vscode.window.setStatusBarMessage('No test function found at cursor.', 5000);
            return;
        }
        return goTest({
            goConfig: goConfig,
            dir: path.dirname(editor.document.fileName),
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
function testCurrentPackage(goConfig) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    goTest({
        goConfig: goConfig,
        dir: path.dirname(editor.document.fileName)
    }).then(null, err => {
        console.error(err);
    });
}
exports.testCurrentPackage = testCurrentPackage;
/**
 * Runs all tests in the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testCurrentFile(goConfig) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    return getTestFunctions(editor.document).then(testFunctions => {
        return goTest({
            goConfig: goConfig,
            dir: path.dirname(editor.document.fileName),
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
 * Runs go test and presents the output in the 'Go' channel.
 *
 * @param goConfig Configuration for the Go extension.
 */
function goTest(testconfig) {
    return new Promise((resolve, reject) => {
        // Remember this config as the last executed test.
        lastTestConfig = testconfig;
        outputChannel.clear();
        outputChannel.show(2, true);
        let buildFlags = testconfig.goConfig['buildFlags'];
        let buildTags = testconfig.goConfig['buildTags'];
        let args = ['test', '-v', '-timeout', testconfig.goConfig['testTimeout'], '-tags', buildTags, ...buildFlags];
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
        let proc = cp.spawn(goRuntimePath, args, { env: testEnvVars, cwd: testconfig.dir });
        proc.stdout.on('data', chunk => outputChannel.append(chunk.toString()));
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
//# sourceMappingURL=goTest.js.map