/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const goSuggest_1 = require("./goSuggest");
const goExtraInfo_1 = require("./goExtraInfo");
const goDeclaration_1 = require("./goDeclaration");
const goReferences_1 = require("./goReferences");
const goFormat_1 = require("./goFormat");
const goRename_1 = require("./goRename");
const goOutline_1 = require("./goOutline");
const goSignature_1 = require("./goSignature");
const goSymbol_1 = require("./goSymbol");
const goCodeAction_1 = require("./goCodeAction");
const goCheck_1 = require("./goCheck");
const goInstallTools_1 = require("./goInstallTools");
const goMode_1 = require("./goMode");
const goStatus_1 = require("./goStatus");
const goCover_1 = require("./goCover");
const goTest_1 = require("./goTest");
const goGenerateTests = require("./goGenerateTests");
const goImport_1 = require("./goImport");
const goInstallTools_2 = require("./goInstallTools");
const util_1 = require("./util");
const vscode_languageclient_1 = require("vscode-languageclient");
const goPath_1 = require("./goPath");
const goModifytags_1 = require("./goModifytags");
let diagnosticCollection;
function activate(ctx) {
    let useLangServer = vscode.workspace.getConfiguration('go')['useLanguageServer'];
    let langServerFlags = vscode.workspace.getConfiguration('go')['languageServerFlags'] || [];
    let toolsGopath = vscode.workspace.getConfiguration('go')['toolsGopath'];
    goInstallTools_1.updateGoPathGoRootFromConfig().then(() => {
        goInstallTools_1.offerToInstallTools();
        let langServerAvailable = goInstallTools_2.checkLanguageServer();
        if (langServerAvailable) {
            let langServerFlags = vscode.workspace.getConfiguration('go')['languageServerFlags'] || [];
            const c = new vscode_languageclient_1.LanguageClient('go-langserver', {
                command: util_1.getBinPath('go-langserver'),
                args: ['-mode=stdio', ...langServerFlags],
            }, {
                documentSelector: ['go'],
                uriConverters: {
                    // Apply file:/// scheme to all file paths.
                    code2Protocol: (uri) => (uri.scheme ? uri : uri.with({ scheme: 'file' })).toString(),
                    protocol2Code: (uri) => vscode.Uri.parse(uri),
                },
            });
            ctx.subscriptions.push(c.start());
        }
        else {
            ctx.subscriptions.push(vscode.languages.registerHoverProvider(goMode_1.GO_MODE, new goExtraInfo_1.GoHoverProvider()));
            ctx.subscriptions.push(vscode.languages.registerDefinitionProvider(goMode_1.GO_MODE, new goDeclaration_1.GoDefinitionProvider()));
            ctx.subscriptions.push(vscode.languages.registerReferenceProvider(goMode_1.GO_MODE, new goReferences_1.GoReferenceProvider()));
            ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(goMode_1.GO_MODE, new goOutline_1.GoDocumentSymbolProvider()));
            ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new goSymbol_1.GoWorkspaceSymbolProvider()));
            ctx.subscriptions.push(vscode.languages.registerSignatureHelpProvider(goMode_1.GO_MODE, new goSignature_1.GoSignatureHelpProvider(), '(', ','));
        }
        if (vscode.window.activeTextEditor && util_1.isGoPathSet()) {
            runBuilds(vscode.window.activeTextEditor.document, vscode.workspace.getConfiguration('go'));
        }
    });
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(goMode_1.GO_MODE, new goSuggest_1.GoCompletionItemProvider(), '.', '\"'));
    ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(goMode_1.GO_MODE, new goFormat_1.GoDocumentFormattingEditProvider()));
    ctx.subscriptions.push(vscode.languages.registerRenameProvider(goMode_1.GO_MODE, new goRename_1.GoRenameProvider()));
    ctx.subscriptions.push(vscode.languages.registerCodeActionsProvider(goMode_1.GO_MODE, new goCodeAction_1.GoCodeActionProvider()));
    diagnosticCollection = vscode.languages.createDiagnosticCollection('go');
    ctx.subscriptions.push(diagnosticCollection);
    vscode.workspace.onDidChangeTextDocument(goCover_1.removeCodeCoverage, null, ctx.subscriptions);
    vscode.workspace.onDidChangeTextDocument(goCheck_1.removeTestStatus, null, ctx.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(goStatus_1.showHideStatus, null, ctx.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(goCover_1.getCodeCoverage, null, ctx.subscriptions);
    startBuildOnSaveWatcher(ctx.subscriptions);
    ctx.subscriptions.push(vscode.commands.registerCommand('go.gopath', () => {
        let gopath = process.env['GOPATH'];
        let wasInfered = vscode.workspace.getConfiguration('go')['inferGopath'];
        // not only if it was configured, but if it was successful.
        if (wasInfered && vscode.workspace.rootPath.indexOf(gopath) === 0) {
            vscode.window.showInformationMessage('Current GOPATH is inferred from workspace root: ' + gopath);
        }
        else {
            vscode.window.showInformationMessage('Current GOPATH: ' + gopath);
        }
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.add.tags', (args) => {
        goModifytags_1.addTags(args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.remove.tags', (args) => {
        goModifytags_1.removeTags(args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.cursor', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go');
        goTest_1.testAtCursor(goConfig, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.package', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go');
        goTest_1.testCurrentPackage(goConfig, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.file', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go');
        goTest_1.testCurrentFile(goConfig, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.previous', () => {
        goTest_1.testPrevious();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.coverage', () => {
        goCover_1.coverageCurrentPackage();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.showOutput', () => {
        goTest_1.showTestOutput();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.import.add', (arg) => {
        return goImport_1.addImport(typeof arg === 'string' ? arg : null);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.tools.install', () => {
        goInstallTools_2.installAllTools();
    }));
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        let updatedGoConfig = vscode.workspace.getConfiguration('go');
        sendTelemetryEventForConfig(updatedGoConfig);
        goInstallTools_1.updateGoPathGoRootFromConfig();
        // If there was a change in "useLanguageServer" setting, then ask the user to reload VS Code.
        if (process.platform !== 'win32'
            && didLangServerConfigChange(useLangServer, langServerFlags, updatedGoConfig)
            && (!updatedGoConfig['useLanguageServer'] || goInstallTools_2.checkLanguageServer())) {
            vscode.window.showInformationMessage('Reload VS Code window for the change in usage of language server to take effect', 'Reload').then(selected => {
                if (selected === 'Reload') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        }
        useLangServer = updatedGoConfig['useLanguageServer'];
        // If there was a change in "toolsGopath" setting, then clear cache for go tools
        if (toolsGopath !== updatedGoConfig['toolsGopath']) {
            goPath_1.clearCacheForTools();
            toolsGopath = updatedGoConfig['toolsGopath'];
        }
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.package', () => {
        goGenerateTests.generateTestCurrentPackage();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.file', () => {
        goGenerateTests.generateTestCurrentFile();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.function', () => {
        goGenerateTests.generateTestCurrentFunction();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.toggle.test.file', () => {
        goGenerateTests.toggleTestFile();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.debug.startSession', config => {
        if (!config.request) {
            config = Object.assign(config, {
                'name': 'Launch',
                'type': 'go',
                'request': 'launch',
                'mode': 'debug',
                'program': '${file}'
            });
        }
        vscode.commands.executeCommand('vscode.startDebug', config);
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
    sendTelemetryEventForConfig(vscode.workspace.getConfiguration('go'));
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
    let uri = document.uri;
    goCheck_1.check(uri.fsPath, goConfig).then(errors => {
        diagnosticCollection.clear();
        let diagnosticMap = new Map();
        errors.forEach(error => {
            let canonicalFile = vscode.Uri.file(error.file).toString();
            let startColumn = 0;
            let endColumn = 1;
            if (document && document.uri.toString() === canonicalFile) {
                let range = new vscode.Range(error.line - 1, 0, error.line - 1, document.lineAt(error.line - 1).range.end.character + 1);
                let text = document.getText(range);
                let [_, leading, trailing] = /^(\s*).*(\s*)$/.exec(text);
                startColumn = leading.length;
                endColumn = text.length - trailing.length;
            }
            let range = new vscode.Range(error.line - 1, startColumn, error.line - 1, endColumn);
            let diagnostic = new vscode.Diagnostic(range, error.msg, mapSeverityToVSCodeSeverity(error.severity));
            let diagnostics = diagnosticMap.get(canonicalFile);
            if (!diagnostics) {
                diagnostics = [];
            }
            diagnostics.push(diagnostic);
            diagnosticMap.set(canonicalFile, diagnostics);
        });
        diagnosticMap.forEach((diags, file) => {
            diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
    }).catch(err => {
        vscode.window.showInformationMessage('Error: ' + err);
    });
}
function startBuildOnSaveWatcher(subscriptions) {
    // TODO: This is really ugly.  I'm not sure we can do better until
    // Code supports a pre-save event where we can do the formatting before
    // the file is written to disk.
    let ignoreNextSave = new WeakSet();
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId !== 'go' || ignoreNextSave.has(document)) {
            return;
        }
        let goConfig = vscode.workspace.getConfiguration('go');
        let textEditor = vscode.window.activeTextEditor;
        let formatPromise = Promise.resolve();
        if (goConfig['formatOnSave'] && textEditor.document === document) {
            let formatter = new goFormat_1.Formatter();
            formatPromise = formatter.formatDocument(document).then(edits => {
                return textEditor.edit(editBuilder => {
                    edits.forEach(edit => editBuilder.replace(edit.range, edit.newText));
                });
            }).then(applied => {
                ignoreNextSave.add(document);
                return document.save();
            }).then(() => {
                ignoreNextSave.delete(document);
            }, () => {
                // Catch any errors and ignore so that we still trigger
                // the file save.
            });
        }
        formatPromise.then(() => {
            runBuilds(document, goConfig);
        });
    }, null, subscriptions);
}
function sendTelemetryEventForConfig(goConfig) {
    util_1.sendTelemetryEvent('goConfig', {
        buildOnSave: goConfig['buildOnSave'] + '',
        buildFlags: goConfig['buildFlags'],
        buildTags: goConfig['buildTags'],
        formatOnSave: goConfig['formatOnSave'] + '',
        formatTool: goConfig['formatTool'],
        formatFlags: goConfig['formatFlags'],
        lintOnSave: goConfig['lintOnSave'] + '',
        lintFlags: goConfig['lintFlags'],
        lintTool: goConfig['lintTool'],
        vetOnSave: goConfig['vetOnSave'] + '',
        vetFlags: goConfig['vetFlags'],
        testOnSave: goConfig['testOnSave'] + '',
        testFlags: goConfig['testFlags'],
        coverOnSave: goConfig['coverOnSave'] + '',
        useDiffForFormatting: goConfig['useDiffForFormatting'] + '',
        gopath: goConfig['gopath'] ? 'set' : '',
        goroot: goConfig['goroot'] ? 'set' : '',
        inferGopath: goConfig['inferGopath'] + '',
        toolsGopath: goConfig['toolsGopath'] ? 'set' : '',
        gocodeAutoBuild: goConfig['gocodeAutoBuild'] + '',
        useCodeSnippetsOnFunctionSuggest: goConfig['useCodeSnippetsOnFunctionSuggest'] + '',
        autocompleteUnimportedPackages: goConfig['autocompleteUnimportedPackages'] + '',
        docsTool: goConfig['docsTool'],
        useLanguageServer: goConfig['useLanguageServer'] + '',
        includeImports: goConfig['gotoSymbol'] && goConfig['gotoSymbol']['includeImports'] + '',
        addTags: JSON.stringify(goConfig['addTags']),
        removeTags: JSON.stringify(goConfig['removeTags']),
        editorContextMenuCommands: JSON.stringify(goConfig['editorContextMenuCommands'])
    });
}
function didLangServerConfigChange(useLangServer, langServerFlags, newconfig) {
    let newLangServerFlags = newconfig['languageServerFlags'] || [];
    if (useLangServer !== newconfig['useLanguageServer'] || langServerFlags.length !== newLangServerFlags.length) {
        return true;
    }
    for (let i = 0; i < langServerFlags.length; i++) {
        if (newLangServerFlags[i] !== langServerFlags[i]) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=goMain.js.map