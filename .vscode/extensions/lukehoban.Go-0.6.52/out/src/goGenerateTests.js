/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const goPath_1 = require("./goPath");
const goInstallTools_1 = require("./goInstallTools");
const goOutline_1 = require("./goOutline");
const generatedWord = 'Generated ';
/**
 * If current active editor has a Go file, returns the editor.
 */
function checkActiveEditor() {
    let editor = vscode.window.activeTextEditor;
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
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot open test file. No editor selected.');
        return;
    }
    let filePath = editor.document.fileName;
    if (!filePath.endsWith('.go')) {
        vscode.window.showInformationMessage('Cannot open test file. File in the editor is not a Go file.');
        return;
    }
    let testFilePath = filePath.substr(0, filePath.lastIndexOf('.go')) + '_test.go';
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(testFilePath));
}
exports.openTestFile = openTestFile;
/**
 * Opens the Go file with implementation for the test file in the current active editor
 */
function openImplementationForTestFile() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Cannot open file. No editor selected.');
        return;
    }
    let filePath = editor.document.fileName;
    if (!filePath.endsWith('_test.go')) {
        vscode.window.showInformationMessage('Cannot open file. File in the editor is not a Go test file.');
        return;
    }
    let testFilePath = filePath.substr(0, filePath.lastIndexOf('_test.go')) + '.go';
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(testFilePath));
}
exports.openImplementationForTestFile = openImplementationForTestFile;
function generateTestCurrentPackage() {
    let editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    let dir = path.dirname(editor.document.uri.fsPath);
    return generateTests({ dir: dir });
}
exports.generateTestCurrentPackage = generateTestCurrentPackage;
function generateTestCurrentFile() {
    let editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    let file = editor.document.uri.fsPath;
    return generateTests({ dir: file });
}
exports.generateTestCurrentFile = generateTestCurrentFile;
function generateTestCurrentFunction() {
    let editor = checkActiveEditor();
    if (!editor) {
        return;
    }
    let file = editor.document.uri.fsPath;
    return getFunctions(editor.document).then(functions => {
        let currentFunction;
        for (let func of functions) {
            let selection = editor.selection;
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
        let funcName = currentFunction.name;
        if (funcName.includes('.')) {
            funcName = funcName.split('.')[1];
        }
        return generateTests({ dir: file, func: funcName });
    });
}
exports.generateTestCurrentFunction = generateTestCurrentFunction;
function generateTests(conf) {
    return new Promise((resolve, reject) => {
        let cmd = goPath_1.getBinPath('gotests');
        let args;
        if (conf.func) {
            args = ['-w', '-only', conf.func, conf.dir];
        }
        else {
            args = ['-w', '-all', conf.dir];
        }
        cp.execFile(cmd, args, {}, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('gotests');
                    return resolve(false);
                }
                if (err) {
                    console.log(err);
                    return reject('Cannot generate test due to errors');
                }
                let message = stdout;
                let testsGenerated = false;
                // Expected stdout is of the format "Generated TestMain\nGenerated Testhello\n"
                if (stdout.startsWith(generatedWord)) {
                    let lines = stdout.split('\n').filter(element => {
                        return element.startsWith(generatedWord);
                    }).map((element) => {
                        return element.substr(generatedWord.length);
                    });
                    message = `Generated ${lines.join(', ')}`;
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
    let documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
    return documentSymbolProvider
        .provideDocumentSymbols(doc, null)
        .then(symbols => symbols.filter(sym => sym.kind === vscode.SymbolKind.Function));
}
//# sourceMappingURL=goGenerateTests.js.map