/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const path = require('path');
const fs = require('fs');
const vscode_1 = require('vscode');
const vscode_languageclient_1 = require('vscode-languageclient');
const eslintrc = [
    '{',
    '    "env": {',
    '        "browser": true,',
    '        "commonjs": true,',
    '        "es6": true,',
    '        "node": true',
    '    },',
    '    "parserOptions": {',
    '        "ecmaFeatures": {',
    '            "jsx": true',
    '        },',
    '        "sourceType": "module"',
    '    },',
    '    "rules": {',
    '        "no-const-assign": "warn",',
    '        "no-this-before-super": "warn",',
    '        "no-undef": "warn",',
    '        "no-unreachable": "warn",',
    '        "no-unused-vars": "warn",',
    '        "constructor-super": "warn",',
    '        "valid-typeof": "warn"',
    '    }',
    '}'
].join(process.platform === 'win32' ? '\r\n' : '\n');
var AllFixesRequest;
(function (AllFixesRequest) {
    AllFixesRequest.type = { get method() { return 'textDocument/eslint/allFixes'; } };
})(AllFixesRequest || (AllFixesRequest = {}));
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["warn"] = 2] = "warn";
    Status[Status["error"] = 3] = "error";
})(Status || (Status = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = { get method() { return 'eslint/status'; } };
})(StatusNotification || (StatusNotification = {}));
let noConfigShown = false;
var NoConfigRequest;
(function (NoConfigRequest) {
    NoConfigRequest.type = { get method() { return 'eslint/noConfig'; } };
})(NoConfigRequest || (NoConfigRequest = {}));
var NoESLintLibraryRequest;
(function (NoESLintLibraryRequest) {
    NoESLintLibraryRequest.type = { get method() { return 'eslint/noLibrary'; } };
})(NoESLintLibraryRequest || (NoESLintLibraryRequest = {}));
const exitCalled = { method: 'eslint/exitCalled' };
let willSaveTextDocument;
function activate(context) {
    let statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
    let eslintStatus = Status.ok;
    let serverRunning = false;
    statusBarItem.text = 'ESLint';
    statusBarItem.command = 'eslint.showOutputChannel';
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
                statusBarItem.color = 'yellow';
                break;
            case Status.error:
                statusBarItem.color = 'darkred';
                break;
        }
        eslintStatus = status;
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    }
    function udpateStatusBarVisibility(editor) {
        statusBarItem.text = eslintStatus === Status.ok ? 'ESLint' : 'ESLint!';
        showStatusBarItem(serverRunning &&
            (eslintStatus !== Status.ok ||
                (editor && (editor.document.languageId === 'javascript' || editor.document.languageId === 'javascriptreact'))));
    }
    vscode_1.window.onDidChangeActiveTextEditor(udpateStatusBarVisibility);
    udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    // We need to go one level up since an extension compile the js code into
    // the output folder.
    // serverModule
    let serverModule = path.join(__dirname, '..', 'server', 'server.js');
    let debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    let defaultErrorHandler;
    let serverCalledProcessExit = false;
    let languages = ['javascript', 'javascriptreact'];
    let languageIds = new Set(languages);
    let clientOptions = {
        documentSelector: languages,
        diagnosticCollectionName: 'eslint',
        revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never,
        synchronize: {
            configurationSection: 'eslint',
            fileEvents: [
                vscode_1.workspace.createFileSystemWatcher('**/.eslintr{c.js,c.yaml,c.yml,c,c.json}'),
                vscode_1.workspace.createFileSystemWatcher('**/package.json')
            ],
            textDocumentFilter: (textDocument) => {
                let fsPath = textDocument.fileName;
                if (fsPath) {
                    let basename = path.basename(fsPath);
                    return /^\.eslintrc\./.test(basename) || /^package.json$/.test(basename);
                }
            }
        },
        initializationOptions: () => {
            let configuration = vscode_1.workspace.getConfiguration('eslint');
            return {
                legacyModuleResolve: configuration ? configuration.get('_legacyModuleResolve', false) : false,
                nodePath: configuration ? configuration.get('nodePath', undefined) : undefined
            };
        },
        initializationFailedHandler: (error) => {
            client.error('Server initialization failed.', error);
            client.outputChannel.show(true);
            return false;
        },
        errorHandler: {
            error: (error, message, count) => {
                return defaultErrorHandler.error(error, message, count);
            },
            closed: () => {
                if (serverCalledProcessExit) {
                    return vscode_languageclient_1.CloseAction.DoNotRestart;
                }
                return defaultErrorHandler.closed();
            }
        }
    };
    let client = new vscode_languageclient_1.LanguageClient('ESLint', serverOptions, clientOptions);
    const running = 'ESLint server is running.';
    const stopped = 'ESLint server stopped.';
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
    client.onNotification(StatusNotification.type, (params) => {
        updateStatus(params.state);
    });
    defaultErrorHandler = client.createDefaultErrorHandler();
    client.onNotification(exitCalled, (params) => {
        serverCalledProcessExit = true;
        client.error(`Server process exited with code ${params[0]}. This usually indicates a misconfigured ESLint setup.`, params[1]);
        vscode_1.window.showErrorMessage(`ESLint server shut down itself. See 'ESLint' output channel for details.`);
    });
    client.onRequest(NoConfigRequest.type, (params) => {
        let document = vscode_1.Uri.parse(params.document.uri);
        let location = document.fsPath;
        if (vscode_1.workspace.rootPath && document.fsPath.indexOf(vscode_1.workspace.rootPath) === 0) {
            location = document.fsPath.substr(vscode_1.workspace.rootPath.length + 1);
        }
        client.warn([
            '',
            `No ESLint configuration (e.g .eslintrc) found for file: ${location}`,
            `File will not be validated. Consider running the 'Create .eslintrc.json file' command.`,
            `Alternatively you can disable ESLint for this workspace by executing the 'Disable ESLint for this workspace' command.`
        ].join('\n'));
        eslintStatus = Status.warn;
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
        return {};
    });
    client.onRequest(NoESLintLibraryRequest.type, (params) => {
        const key = 'noESLintMessageShown';
        let state = context.globalState.get(key, {});
        let uri = vscode_1.Uri.parse(params.source.uri);
        if (vscode_1.workspace.rootPath) {
            client.info([
                '',
                `Failed to load the ESLint library for the document ${uri.fsPath}`,
                '',
                'To use ESLint in this workspace please install eslint using \'npm install eslint\' or globally using \'npm install -g eslint\'.',
                'You need to reopen the workspace after installing eslint.',
                '',
                `Alternatively you can disable ESLint for this workspace by executing the 'Disable ESLint for this workspace' command.`
            ].join('\n'));
            if (!state.workspaces) {
                state.workspaces = Object.create(null);
            }
            if (!state.workspaces[vscode_1.workspace.rootPath]) {
                state.workspaces[vscode_1.workspace.rootPath] = true;
                client.outputChannel.show(true);
                context.globalState.update(key, state);
            }
        }
        else {
            client.info([
                `Failed to load the ESLint library for the document ${uri.fsPath}`,
                'To use ESLint for single JavaScript file install eslint globally using \'npm install -g eslint\'.',
                'You need to reopen VS Code after installing eslint.',
            ].join('\n'));
            if (!state.global) {
                state.global = true;
                client.outputChannel.show(true);
                context.globalState.update(key, state);
            }
        }
        return {};
    });
    function enable() {
        if (!vscode_1.workspace.rootPath) {
            vscode_1.window.showErrorMessage('ESLint can only be enabled if VS Code is opened on a workspace folder.');
            return;
        }
        vscode_1.workspace.getConfiguration('eslint').update('enable', true, false);
    }
    function disable() {
        if (!vscode_1.workspace.rootPath) {
            vscode_1.window.showErrorMessage('ESLint can only be disabled if VS Code is opened on a workspace folder.');
            return;
        }
        vscode_1.workspace.getConfiguration('eslint').update('enable', false, false);
    }
    function applyTextEdits(uri, documentVersion, edits) {
        let textEditor = vscode_1.window.activeTextEditor;
        if (textEditor && textEditor.document.uri.toString() === uri) {
            if (textEditor.document.version !== documentVersion) {
                vscode_1.window.showInformationMessage(`ESLint fixes are outdated and can't be applied to the document.`);
            }
            textEditor.edit(mutator => {
                for (let edit of edits) {
                    mutator.replace(vscode_languageclient_1.Protocol2Code.asRange(edit.range), edit.newText);
                }
            }).then((success) => {
                if (!success) {
                    vscode_1.window.showErrorMessage('Failed to apply ESLint fixes to the document. Please consider opening an issue with steps to reproduce.');
                }
            });
        }
    }
    function runAutoFix() {
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
            vscode_1.window.showErrorMessage('Failed to apply ESLint fixes to the document. Please consider opening an issue with steps to reproduce.');
        });
    }
    function createDefaultConfiguration() {
        if (!vscode_1.workspace.rootPath) {
            vscode_1.window.showErrorMessage('An ESLint configuration can only be generated if VS Code is opened on a workspace folder.');
            return;
        }
        let eslintConfigFile = path.join(vscode_1.workspace.rootPath, '.eslintrc.json');
        if (!fs.existsSync(eslintConfigFile)) {
            fs.writeFileSync(eslintConfigFile, eslintrc, { encoding: 'utf8' });
        }
    }
    function configurationChanged() {
        let config = vscode_1.workspace.getConfiguration('eslint');
        let autoFix = config.get('autoFixOnSave', false);
        if (autoFix && !willSaveTextDocument) {
            willSaveTextDocument = vscode_1.workspace.onWillSaveTextDocument((event) => {
                let document = event.document;
                if (!languageIds.has(document.languageId) || event.reason === vscode_1.TextDocumentSaveReason.AfterDelay) {
                    return;
                }
                const version = document.version;
                event.waitUntil(client.sendRequest(AllFixesRequest.type, { textDocument: { uri: document.uri.toString() } }).then((result) => {
                    if (result && version === result.documentVersion) {
                        return vscode_languageclient_1.Protocol2Code.asTextEdits(result.edits);
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
    }
    vscode_1.workspace.onDidChangeConfiguration(configurationChanged);
    configurationChanged();
    context.subscriptions.push(new vscode_languageclient_1.SettingMonitor(client, 'eslint.enable').start(), vscode_1.commands.registerCommand('eslint.applySingleFix', applyTextEdits), vscode_1.commands.registerCommand('eslint.applySameFixes', applyTextEdits), vscode_1.commands.registerCommand('eslint.applyAllFixes', applyTextEdits), vscode_1.commands.registerCommand('eslint.executeAutofix', runAutoFix), vscode_1.commands.registerCommand('eslint.createConfig', createDefaultConfiguration), vscode_1.commands.registerCommand('eslint.enable', enable), vscode_1.commands.registerCommand('eslint.disable', disable), vscode_1.commands.registerCommand('eslint.showOutputChannel', () => { client.outputChannel.show(); }), statusBarItem);
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