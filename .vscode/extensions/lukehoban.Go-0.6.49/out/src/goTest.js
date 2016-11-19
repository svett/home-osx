/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var cp = require('child_process');
var path = require('path');
var vscode = require('vscode');
var util = require('util');
var goPath_1 = require('./goPath');
var goOutline_1 = require('./goOutline');
var outputChannel = vscode.window.createOutputChannel('Go Tests');
// lastTestConfig holds a reference to the last executed TestConfig which allows
// the last test to be easily re-executed.
var lastTestConfig;
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
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    getTestFunctions(editor.document).then(function (testFunctions) {
        var testFunction;
        // Find any test function containing the cursor.
        for (var _i = 0, testFunctions_1 = testFunctions; _i < testFunctions_1.length; _i++) {
            var func = testFunctions_1[_i];
            var selection = editor.selection;
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
    }).then(null, function (err) {
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
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    goTest({
        goConfig: goConfig,
        dir: path.dirname(editor.document.fileName)
    }).then(null, function (err) {
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
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    return getTestFunctions(editor.document).then(function (testFunctions) {
        return goTest({
            goConfig: goConfig,
            dir: path.dirname(editor.document.fileName),
            functions: testFunctions.map(function (func) { return func.name; })
        });
    }).then(null, function (err) {
        console.error(err);
        return Promise.resolve(false);
    });
}
exports.testCurrentFile = testCurrentFile;
/**
 * Runs the previously executed test.
 */
function testPrevious() {
    var editor = vscode.window.activeTextEditor;
    if (!lastTestConfig) {
        vscode.window.showInformationMessage('No test has been recently executed.');
        return;
    }
    goTest(lastTestConfig).then(null, function (err) {
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
    return new Promise(function (resolve, reject) {
        // Remember this config as the last executed test.
        lastTestConfig = testconfig;
        outputChannel.clear();
        outputChannel.show(2, true);
        var buildFlags = testconfig.goConfig['buildFlags'];
        var buildTags = testconfig.goConfig['buildTags'];
        var args = ['test', '-v', '-timeout', testconfig.goConfig['testTimeout'], '-tags', buildTags].concat(buildFlags);
        var testEnvVars = Object.assign({}, process.env, testconfig.goConfig['testEnvVars']);
        var goRuntimePath = goPath_1.getGoRuntimePath();
        if (!goRuntimePath) {
            vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
            return Promise.resolve();
        }
        if (testconfig.functions) {
            args.push('-run');
            args.push(util.format('^%s$', testconfig.functions.join('|')));
        }
        var proc = cp.spawn(goRuntimePath, args, { env: testEnvVars, cwd: testconfig.dir });
        proc.stdout.on('data', function (chunk) { return outputChannel.append(chunk.toString()); });
        proc.stderr.on('data', function (chunk) { return outputChannel.append(chunk.toString()); });
        proc.on('close', function (code) {
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
    var documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
    return documentSymbolProvider
        .provideDocumentSymbols(doc, null)
        .then(function (symbols) {
        return symbols.filter(function (sym) {
            return sym.kind === vscode.SymbolKind.Function
                && hasTestFunctionPrefix(sym.name);
        });
    });
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