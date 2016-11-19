/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var cp = require('child_process');
var path = require('path');
var vscode = require('vscode');
var goPath_1 = require('./goPath');
var goInstallTools_1 = require('./goInstallTools');
var goOutline_1 = require('./goOutline');
var generatedWord = 'Generated ';
/**
 * If current active editor has a Go file, returns the editor.
 */
function checkActiveEditor() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot generate unit tests. No editor selected.');
        return;
    }
    if (!editor.document.fileName.endsWith('.go')) {
        vscode.window.showInformationMessage('Cannot generate unit tests. File in the editor is not a Go file.');
        return;
    }
    return editor;
}
/**
 * Opens test file (if any) corresponding to the Go file in the current active editor
 */
function openTestFile() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot open test file. No editor selected.');
        return;
    }
    var filePath = editor.document.fileName;
    if (!filePath.endsWith('.go')) {
        vscode.window.showInformationMessage('Cannot open test file. File in the editor is not a Go file.');
        return;
    }
    var testFilePath = filePath.substr(0, filePath.lastIndexOf('.go')) + '_test.go';
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(testFilePath));
}
exports.openTestFile = openTestFile;
/**
 * Opens the Go file with implementation for the test file in the current active editor
 */
function openImplementationForTestFile() {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot open file. No editor selected.');
        return;
    }
    var filePath = editor.document.fileName;
    if (!filePath.endsWith('_test.go')) {
        vscode.window.showInformationMessage('Cannot open file. File in the editor is not a Go test file.');
        return;
    }
    var testFilePath = filePath.substr(0, filePath.lastIndexOf('_test.go')) + '.go';
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(testFilePath));
}
exports.openImplementationForTestFile = openImplementationForTestFile;
function generateTestCurrentPackage() {
    var editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    var dir = path.dirname(editor.document.uri.fsPath);
    var message = 'Unit tests generated for package: ' + path.basename(dir);
    return generateTests({ dir: dir });
}
exports.generateTestCurrentPackage = generateTestCurrentPackage;
function generateTestCurrentFile() {
    var editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    var file = editor.document.uri.fsPath;
    var message = 'Unit tests generated for file: ' + path.basename(file);
    return generateTests({ dir: file });
}
exports.generateTestCurrentFile = generateTestCurrentFile;
function generateTestCurrentFunction() {
    var editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    var file = editor.document.uri.fsPath;
    getFunctions(editor.document).then(function (functions) {
        var currentFunction;
        for (var _i = 0, functions_1 = functions; _i < functions_1.length; _i++) {
            var func = functions_1[_i];
            var selection = editor.selection;
            if (selection && func.location.range.contains(selection.start)) {
                currentFunction = func;
                break;
            }
        }
        ;
        if (!currentFunction) {
            vscode.window.setStatusBarMessage('No function found at cursor.', 5000);
            return;
        }
        var message = 'Unit test generated for function: ' + currentFunction.name + ' in file: ' + path.basename(file);
        return generateTests({ dir: file, func: currentFunction.name });
    }).then(null, function (err) {
        console.error(err);
    });
}
exports.generateTestCurrentFunction = generateTestCurrentFunction;
function generateTests(conf) {
    return new Promise(function (resolve, reject) {
        var cmd = goPath_1.getBinPath('gotests');
        var args;
        if (conf.func) {
            args = ['-w', '-only', conf.func, conf.dir];
        }
        else {
            args = ['-w', '-all', conf.dir];
        }
        cp.execFile(cmd, args, {}, function (err, stdout, stderr) {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('gotests');
                    return resolve(false);
                }
                if (err) {
                    return reject('Cannot generate test due to errors: ' + stderr);
                }
                var message = stdout;
                var testsGenerated = false;
                // Expected stdout is of the format "Generated TestMain\nGenerated Testhello\n"
                if (stdout.startsWith(generatedWord)) {
                    var lines = stdout.split('\n').filter(function (element) {
                        return element.startsWith(generatedWord);
                    }).map(function (element) {
                        return element.substr(generatedWord.length);
                    });
                    message = "Generated " + lines.join(', ');
                    testsGenerated = true;
                }
                vscode.window.showInformationMessage(message);
                if (testsGenerated) {
                    openTestFile();
                }
                return resolve(true);
            }
            catch (e) {
                vscode.window.showInformationMessage(e.msg);
                reject(e);
            }
        });
    });
}
function getFunctions(doc) {
    var documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
    return documentSymbolProvider
        .provideDocumentSymbols(doc, null)
        .then(function (symbols) {
        return symbols.filter(function (sym) {
            return sym.kind === vscode.SymbolKind.Function;
        });
    });
}
//# sourceMappingURL=goGenerateTests.js.map