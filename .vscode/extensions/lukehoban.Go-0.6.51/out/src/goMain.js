/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var goSuggest_1 = require('./goSuggest');
var goExtraInfo_1 = require('./goExtraInfo');
var goDeclaration_1 = require('./goDeclaration');
var goReferences_1 = require('./goReferences');
var goFormat_1 = require('./goFormat');
var goRename_1 = require('./goRename');
var goOutline_1 = require('./goOutline');
var goSignature_1 = require('./goSignature');
var goSymbol_1 = require('./goSymbol');
var goCodeAction_1 = require('./goCodeAction');
var goCheck_1 = require('./goCheck');
var goInstallTools_1 = require('./goInstallTools');
var goMode_1 = require('./goMode');
var goStatus_1 = require('./goStatus');
var goCover_1 = require('./goCover');
var goTest_1 = require('./goTest');
var goGenerateTests = require('./goGenerateTests');
var goImport_1 = require('./goImport');
var goInstallTools_2 = require('./goInstallTools');
var util_1 = require('./util');
var diagnosticCollection;
function activate(ctx) {
    ctx.subscriptions.push(vscode.languages.registerHoverProvider(goMode_1.GO_MODE, new goExtraInfo_1.GoHoverProvider(vscode.workspace.getConfiguration('go')['docsTool'])));
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(goMode_1.GO_MODE, new goSuggest_1.GoCompletionItemProvider(), '.', '\"'));
    ctx.subscriptions.push(vscode.languages.registerDefinitionProvider(goMode_1.GO_MODE, new goDeclaration_1.GoDefinitionProvider(vscode.workspace.getConfiguration('go')['docsTool'])));
    ctx.subscriptions.push(vscode.languages.registerReferenceProvider(goMode_1.GO_MODE, new goReferences_1.GoReferenceProvider()));
    ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(goMode_1.GO_MODE, new goFormat_1.GoDocumentFormattingEditProvider()));
    ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(goMode_1.GO_MODE, new goOutline_1.GoDocumentSymbolProvider()));
    ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new goSymbol_1.GoWorkspaceSymbolProvider()));
    ctx.subscriptions.push(vscode.languages.registerRenameProvider(goMode_1.GO_MODE, new goRename_1.GoRenameProvider()));
    ctx.subscriptions.push(vscode.languages.registerSignatureHelpProvider(goMode_1.GO_MODE, new goSignature_1.GoSignatureHelpProvider(vscode.workspace.getConfiguration('go')['docsTool']), '(', ','));
    ctx.subscriptions.push(vscode.languages.registerCodeActionsProvider(goMode_1.GO_MODE, new goCodeAction_1.GoCodeActionProvider()));
    diagnosticCollection = vscode.languages.createDiagnosticCollection('go');
    ctx.subscriptions.push(diagnosticCollection);
    vscode.workspace.onDidChangeTextDocument(goCover_1.removeCodeCoverage, null, ctx.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(goStatus_1.showHideStatus, null, ctx.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(goCover_1.getCodeCoverage, null, ctx.subscriptions);
    goInstallTools_1.setupGoPathAndOfferToInstallTools();
    startBuildOnSaveWatcher(ctx.subscriptions);
    ctx.subscriptions.push(vscode.commands.registerCommand('go.gopath', function () {
        var gopath = process.env['GOPATH'];
        vscode.window.showInformationMessage('Current GOPATH:' + gopath);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.cursor', function () {
        var goConfig = vscode.workspace.getConfiguration('go');
        goTest_1.testAtCursor(goConfig);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.package', function () {
        var goConfig = vscode.workspace.getConfiguration('go');
        goTest_1.testCurrentPackage(goConfig);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.file', function () {
        var goConfig = vscode.workspace.getConfiguration('go');
        goTest_1.testCurrentFile(goConfig);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.previous', function () {
        goTest_1.testPrevious();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.coverage', function () {
        goCover_1.coverageCurrentPackage();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.import.add', function (arg) {
        return goImport_1.addImport(typeof arg === 'string' ? arg : null);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.tools.install', function () {
        goInstallTools_2.installAllTools();
    }));
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(function () {
        goInstallTools_1.updateGoPathGoRootFromConfig();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.package', function () {
        goGenerateTests.generateTestCurrentPackage();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.file', function () {
        goGenerateTests.generateTestCurrentFile();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.function', function () {
        goGenerateTests.generateTestCurrentFunction();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.open.test.file', function () {
        goGenerateTests.openTestFile();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.open.test.implementation', function () {
        goGenerateTests.openImplementationForTestFile();
    }));
    vscode.languages.setLanguageConfiguration(goMode_1.GO_MODE.language, {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}'']*$
            increaseIndentPattern: /^.*\{[^}'']*$/
        },
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    });
    if (vscode.window.activeTextEditor && util_1.isGoPathSet()) {
        var goConfig = vscode.workspace.getConfiguration('go');
        runBuilds(vscode.window.activeTextEditor.document, goConfig);
    }
}
exports.activate = activate;
function deactivate() {
}
function runBuilds(document, goConfig) {
    function mapSeverityToVSCodeSeverity(sev) {
        switch (sev) {
            case 'error': return vscode.DiagnosticSeverity.Error;
            case 'warning': return vscode.DiagnosticSeverity.Warning;
            default: return vscode.DiagnosticSeverity.Error;
        }
    }
    if (document.languageId !== 'go') {
        return;
    }
    var uri = document.uri;
    goCheck_1.check(uri.fsPath, goConfig).then(function (errors) {
        diagnosticCollection.clear();
        var diagnosticMap = new Map();
        errors.forEach(function (error) {
            var canonicalFile = vscode.Uri.file(error.file).toString();
            var startColumn = 0;
            var endColumn = 1;
            if (document && document.uri.toString() === canonicalFile) {
                var range_1 = new vscode.Range(error.line - 1, 0, error.line - 1, document.lineAt(error.line - 1).range.end.character + 1);
                var text = document.getText(range_1);
                var _a = /^(\s*).*(\s*)$/.exec(text), _1 = _a[0], leading = _a[1], trailing = _a[2];
                startColumn = leading.length;
                endColumn = text.length - trailing.length;
            }
            var range = new vscode.Range(error.line - 1, startColumn, error.line - 1, endColumn);
            var diagnostic = new vscode.Diagnostic(range, error.msg, mapSeverityToVSCodeSeverity(error.severity));
            var diagnostics = diagnosticMap.get(canonicalFile);
            if (!diagnostics) {
                diagnostics = [];
            }
            diagnostics.push(diagnostic);
            diagnosticMap.set(canonicalFile, diagnostics);
        });
        diagnosticMap.forEach(function (diags, file) {
            diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
    }).catch(function (err) {
        vscode.window.showInformationMessage('Error: ' + err);
    });
}
function startBuildOnSaveWatcher(subscriptions) {
    // TODO: This is really ugly.  I'm not sure we can do better until
    // Code supports a pre-save event where we can do the formatting before
    // the file is written to disk.
    var ignoreNextSave = new WeakSet();
    vscode.workspace.onDidSaveTextDocument(function (document) {
        if (document.languageId !== 'go' || ignoreNextSave.has(document)) {
            return;
        }
        var goConfig = vscode.workspace.getConfiguration('go');
        var textEditor = vscode.window.activeTextEditor;
        var formatPromise = Promise.resolve();
        if (goConfig['formatOnSave'] && textEditor.document === document) {
            var formatter = new goFormat_1.Formatter();
            formatPromise = formatter.formatDocument(document).then(function (edits) {
                return textEditor.edit(function (editBuilder) {
                    edits.forEach(function (edit) { return editBuilder.replace(edit.range, edit.newText); });
                });
            }).then(function (applied) {
                ignoreNextSave.add(document);
                return document.save();
            }).then(function () {
                ignoreNextSave.delete(document);
            }, function () {
                // Catch any errors and ignore so that we still trigger
                // the file save.
            });
        }
        formatPromise.then(function () {
            runBuilds(document, goConfig);
        });
    }, null, subscriptions);
}
//# sourceMappingURL=goMain.js.map