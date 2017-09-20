"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const child_process_1 = require("child_process");
const open = require("open");
var AllFixesRequest;
(function (AllFixesRequest) {
    AllFixesRequest.type = new vscode_languageclient_1.RequestType('textDocument/tslint/allFixes');
})(AllFixesRequest || (AllFixesRequest = {}));
var NoTSLintLibraryRequest;
(function (NoTSLintLibraryRequest) {
    NoTSLintLibraryRequest.type = new vscode_languageclient_1.RequestType('tslint/noLibrary');
})(NoTSLintLibraryRequest || (NoTSLintLibraryRequest = {}));
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["warn"] = 2] = "warn";
    Status[Status["error"] = 3] = "error";
})(Status || (Status = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = new vscode_languageclient_1.NotificationType('tslint/status');
})(StatusNotification || (StatusNotification = {}));
let willSaveTextDocument;
let configurationChangedListener;
function activate(context) {
    let statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
    let tslintStatus = Status.ok;
    let serverRunning = false;
    statusBarItem.text = 'TSLint';
    statusBarItem.command = 'tslint.showOutputChannel';
    let errorColor = new vscode_1.ThemeColor('tslint.error');
    let warningColor = new vscode_1.ThemeColor('tslint.warning');
    function showStatusBarItem(show) {
        if (show) {
            statusBarItem.show();
        }
        else {
            statusBarItem.hide();
        }
    }
    function updateStatus(status) {
        switch (status) {
            case Status.ok:
                statusBarItem.color = undefined;
                break;
            case Status.warn:
                statusBarItem.color = warningColor;
                break;
            case Status.error:
                statusBarItem.color = errorColor; // darkred doesn't work
                break;
        }
        if (tslintStatus !== Status.ok && status === Status.ok) {
            client.info('vscode-tslint: Status is OK');
        }
        tslintStatus = status;
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    }
    function isTypeScriptDocument(languageId) {
        return languageId === 'typescript' || languageId === 'typescriptreact';
    }
    function isJavaScriptDocument(languageId) {
        return languageId === 'javascript' || languageId === 'javascriptreact';
    }
    function isEnableForJavaScriptDocument(languageId) {
        let isJsEnable = vscode_1.workspace.getConfiguration('tslint').get('jsEnable', true);
        if (isJsEnable && isJavaScriptDocument(languageId)) {
            return true;
        }
        return false;
    }
    function udpateStatusBarVisibility(editor) {
        switch (tslintStatus) {
            case Status.ok:
                statusBarItem.text = 'TSLint';
                break;
            case Status.warn:
                statusBarItem.text = 'TSLint: Warning';
                break;
            case Status.error:
                statusBarItem.text = 'TSLint: Error';
                break;
        }
        let enabled = vscode_1.workspace.getConfiguration('tslint')['enable'];
        if (!editor || !enabled) {
            showStatusBarItem(false);
            return;
        }
        showStatusBarItem(serverRunning &&
            (isTypeScriptDocument(editor.document.languageId) || isEnableForJavaScriptDocument(editor.document.languageId)));
    }
    vscode_1.window.onDidChangeActiveTextEditor(udpateStatusBarVisibility);
    udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    // We need to go one level up since an extension compile the js code into
    // the output folder.
    let serverModulePath = path.join(__dirname, '..', 'server', 'server.js');
    // break on start options
    //let debugOptions = { execArgv: ["--nolazy", "--debug=6010", "--debug-brk"] };
    let debugOptions = { execArgv: ["--nolazy", "--inspect=6010"], cwd: process.cwd() };
    let runOptions = { cwd: process.cwd() };
    let serverOptions = {
        run: { module: serverModulePath, transport: vscode_languageclient_1.TransportKind.ipc, options: runOptions },
        debug: { module: serverModulePath, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    let clientOptions = {
        documentSelector: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        synchronize: {
            configurationSection: 'tslint',
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/tslint.json')
        },
        diagnosticCollectionName: 'tslint',
        initializationFailedHandler: (error) => {
            client.error('Server initialization failed.', error);
            client.outputChannel.show(true);
            return false;
        },
        middleware: {
            workspace: {
                configuration: (params, token, next) => {
                    if (!params.items) {
                        return [];
                    }
                    let result = next(params, token, next);
                    let settings = result[0];
                    let scopeUri = "";
                    // add the workspaceFolder to the settings
                    for (let item of params.items) {
                        if (!item.scopeUri) {
                            continue;
                        }
                        else {
                            scopeUri = item.scopeUri;
                        }
                    }
                    let resource = client.protocol2CodeConverter.asUri(scopeUri);
                    let workspaceFolder = vscode_1.workspace.getWorkspaceFolder(resource);
                    if (workspaceFolder) {
                        settings.workspaceFolder = {
                            name: workspaceFolder.name,
                            uri: client.code2ProtocolConverter.asUri(workspaceFolder.uri)
                        };
                    }
                    return result;
                }
            }
        }
    };
    let client = new vscode_languageclient_1.LanguageClient('tslint', serverOptions, clientOptions);
    client.registerProposedFeatures();
    const running = 'Linter is running.';
    const stopped = 'Linter has stopped.';
    client.onDidChangeState((event) => {
        if (event.newState === vscode_languageclient_1.State.Running) {
            client.info(running);
            statusBarItem.tooltip = running;
            serverRunning = true;
        }
        else {
            client.info(stopped);
            statusBarItem.tooltip = stopped;
            serverRunning = false;
        }
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    });
    client.onReady().then(() => {
        client.onNotification(StatusNotification.type, (params) => {
            updateStatus(params.state);
        });
        client.onRequest(NoTSLintLibraryRequest.type, (params) => {
            let uri = vscode_1.Uri.parse(params.source.uri);
            if (vscode_1.workspace.rootPath) {
                client.info([
                    '',
                    `Failed to load the TSLint library for the document ${uri.fsPath}`,
                    '',
                    'To use TSLint in this workspace please install tslint using \'npm install tslint\' or globally using \'npm install -g tslint\'.',
                    'TSLint has a peer dependency on `typescript`, make sure that `typescript` is installed as well.',
                    'You need to reopen the workspace after installing tslint.',
                ].join('\n'));
            }
            else {
                client.info([
                    `Failed to load the TSLint library for the document ${uri.fsPath}`,
                    'To use TSLint for single file install tslint globally using \'npm install -g tslint\'.',
                    'TSLint has a peer dependency on `typescript`, make sure that `typescript` is installed as well.',
                    'You need to reopen VS Code after installing tslint.',
                ].join('\n'));
            }
            updateStatus(Status.warn);
            return {};
        });
    });
    function applyTextEdits(uri, documentVersion, edits) {
        let textEditor = vscode_1.window.activeTextEditor;
        if (textEditor && textEditor.document.uri.toString() === uri) {
            if (textEditor.document.version !== documentVersion) {
                vscode_1.window.showInformationMessage(`TSLint fixes are outdated and can't be applied to the document.`);
            }
            textEditor.edit(mutator => {
                for (let edit of edits) {
                    mutator.replace(client.protocol2CodeConverter.asRange(edit.range), edit.newText);
                }
            }).then((success) => {
                if (!success) {
                    vscode_1.window.showErrorMessage('Failed to apply TSLint fixes to the document. Please consider opening an issue with steps to reproduce.');
                }
            });
        }
    }
    function applyDisableRuleEdit(uri, documentVersion, edits) {
        let textEditor = vscode_1.window.activeTextEditor;
        if (textEditor && textEditor.document.uri.toString() === uri) {
            if (textEditor.document.version !== documentVersion) {
                vscode_1.window.showInformationMessage(`TSLint fixes are outdated and can't be applied to the document.`);
            }
            // prefix disable comment with same indent as line with the diagnostic
            let edit = edits[0];
            let ruleLine = textEditor.document.lineAt(edit.range.start.line);
            let prefixIndex = ruleLine.firstNonWhitespaceCharacterIndex;
            let prefix = ruleLine.text.substr(0, prefixIndex);
            edit.newText = prefix + edit.newText;
            applyTextEdits(uri, documentVersion, edits);
        }
    }
    function showRuleDocumentation(uri, documentVersion, edits, ruleId) {
        const tslintDocBaseURL = "https://palantir.github.io/tslint/rules";
        if (!ruleId) {
            return;
        }
        open(tslintDocBaseURL + '/' + ruleId);
    }
    function fixAllProblems() {
        // server is not running so there can be no problems to fix
        if (!serverRunning) {
            return;
        }
        let textEditor = vscode_1.window.activeTextEditor;
        if (!textEditor) {
            return;
        }
        let uri = textEditor.document.uri.toString();
        client.sendRequest(AllFixesRequest.type, { textDocument: { uri } }).then((result) => {
            if (result) {
                applyTextEdits(uri, result.documentVersion, result.edits);
            }
        }, (error) => {
            vscode_1.window.showErrorMessage('Failed to apply TSLint fixes to the document. Please consider opening an issue with steps to reproduce.');
        });
    }
    function createDefaultConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            let folders = vscode_1.workspace.workspaceFolders;
            if (!folders) {
                vscode_1.window.showErrorMessage('A TSLint configuration file can only be generated if VS Code is opened on a folder.');
                return;
            }
            let folderPicks = folders.map(each => {
                return { label: each.name, description: each.uri.fsPath };
            });
            let selection;
            if (folderPicks.length === 1) {
                selection = folderPicks[0];
            }
            else {
                selection = yield vscode_1.window.showQuickPick(folderPicks, { placeHolder: 'Select the target folder for the tslint.json' });
            }
            if (!selection) {
                return;
            }
            let tslintConfigFile = path.join(selection.description, 'tslint.json');
            if (fs.existsSync(tslintConfigFile)) {
                vscode_1.window.showInformationMessage('A TSLint configuration file already exists.');
                let document = yield vscode_1.workspace.openTextDocument(tslintConfigFile);
                vscode_1.window.showTextDocument(document);
            }
            else {
                const cmd = 'tslint --init';
                const p = child_process_1.exec(cmd, { cwd: selection.description, env: process.env });
                p.on('exit', (code, signal) => __awaiter(this, void 0, void 0, function* () {
                    if (code === 0) {
                        let document = yield vscode_1.workspace.openTextDocument(tslintConfigFile);
                        vscode_1.window.showTextDocument(document);
                    }
                }));
            }
        });
    }
    function configurationChanged() {
        let config = vscode_1.workspace.getConfiguration('tslint');
        let autoFix = config.get('autoFixOnSave', false);
        if (autoFix && !willSaveTextDocument) {
            willSaveTextDocument = vscode_1.workspace.onWillSaveTextDocument((event) => {
                let document = event.document;
                // only auto fix when the document was manually saved by the user
                if (!(isTypeScriptDocument(document.languageId) || isEnableForJavaScriptDocument(document.languageId))
                    || event.reason !== vscode_1.TextDocumentSaveReason.Manual) {
                    return;
                }
                const version = document.version;
                event.waitUntil(client.sendRequest(AllFixesRequest.type, { textDocument: { uri: document.uri.toString() }, isOnSave: true }).then((result) => {
                    if (result && version === result.documentVersion) {
                        return client.protocol2CodeConverter.asTextEdits(result.edits);
                    }
                    else {
                        return [];
                    }
                }));
            });
        }
        else if (!autoFix && willSaveTextDocument) {
            willSaveTextDocument.dispose();
            willSaveTextDocument = undefined;
        }
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    }
    configurationChangedListener = vscode_1.workspace.onDidChangeConfiguration(configurationChanged);
    configurationChanged();
    context.subscriptions.push(client.start(), configurationChangedListener, 
    // internal commands
    vscode_1.commands.registerCommand('_tslint.applySingleFix', applyTextEdits), vscode_1.commands.registerCommand('_tslint.applySameFixes', applyTextEdits), vscode_1.commands.registerCommand('_tslint.applyAllFixes', applyTextEdits), vscode_1.commands.registerCommand('_tslint.applyDisableRule', applyDisableRuleEdit), vscode_1.commands.registerCommand('_tslint.showRuleDocumentation', showRuleDocumentation), 
    // user commands
    vscode_1.commands.registerCommand('tslint.fixAllProblems', fixAllProblems), vscode_1.commands.registerCommand('tslint.createConfig', createDefaultConfiguration), vscode_1.commands.registerCommand('tslint.showOutputChannel', () => { client.outputChannel.show(); }), statusBarItem);
}
exports.activate = activate;
function deactivate() {
    if (willSaveTextDocument) {
        willSaveTextDocument.dispose();
        willSaveTextDocument = undefined;
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map