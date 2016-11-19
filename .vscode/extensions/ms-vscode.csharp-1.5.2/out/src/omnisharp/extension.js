/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var vscode = require('vscode');
var definitionProvider_1 = require('../features/definitionProvider');
var codeLensProvider_1 = require('../features/codeLensProvider');
var definitionMetadataDocumentProvider_1 = require('../features/definitionMetadataDocumentProvider');
var documentHighlightProvider_1 = require('../features/documentHighlightProvider');
var documentSymbolProvider_1 = require('../features/documentSymbolProvider');
var codeActionProvider_1 = require('../features/codeActionProvider');
var referenceProvider_1 = require('../features/referenceProvider');
var hoverProvider_1 = require('../features/hoverProvider');
var renameProvider_1 = require('../features/renameProvider');
var formattingEditProvider_1 = require('../features/formattingEditProvider');
var completionItemProvider_1 = require('../features/completionItemProvider');
var workspaceSymbolProvider_1 = require('../features/workspaceSymbolProvider');
var diagnosticsProvider_1 = require('../features/diagnosticsProvider');
var signatureHelpProvider_1 = require('../features/signatureHelpProvider');
var commands_1 = require('../features/commands');
var changeForwarding_1 = require('../features/changeForwarding');
var status_1 = require('../features/status');
var server_1 = require('./server');
var options_1 = require('./options');
var assets_1 = require('../assets');
function activate(context, reporter) {
    var documentSelector = {
        language: 'csharp',
        scheme: 'file' // only files from disk
    };
    var server = new server_1.OmniSharpServer(reporter);
    var advisor = new diagnosticsProvider_1.Advisor(server); // create before server is started
    var disposables = [];
    var localDisposables = [];
    disposables.push(server.onServerStart(function () {
        // register language feature provider on start
        var definitionMetadataDocumentProvider = new definitionMetadataDocumentProvider_1.default();
        definitionMetadataDocumentProvider.register();
        localDisposables.push(definitionMetadataDocumentProvider);
        localDisposables.push(vscode.languages.registerDefinitionProvider(documentSelector, new definitionProvider_1.default(server, definitionMetadataDocumentProvider)));
        localDisposables.push(vscode.languages.registerCodeLensProvider(documentSelector, new codeLensProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerDocumentHighlightProvider(documentSelector, new documentHighlightProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerDocumentSymbolProvider(documentSelector, new documentSymbolProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerReferenceProvider(documentSelector, new referenceProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerHoverProvider(documentSelector, new hoverProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerRenameProvider(documentSelector, new renameProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerDocumentRangeFormattingEditProvider(documentSelector, new formattingEditProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerOnTypeFormattingEditProvider(documentSelector, new formattingEditProvider_1.default(server), '}', ';'));
        localDisposables.push(vscode.languages.registerCompletionItemProvider(documentSelector, new completionItemProvider_1.default(server), '.', '<'));
        localDisposables.push(vscode.languages.registerWorkspaceSymbolProvider(new workspaceSymbolProvider_1.default(server)));
        localDisposables.push(vscode.languages.registerSignatureHelpProvider(documentSelector, new signatureHelpProvider_1.default(server), '(', ','));
        var codeActionProvider = new codeActionProvider_1.default(server);
        localDisposables.push(codeActionProvider);
        localDisposables.push(vscode.languages.registerCodeActionsProvider(documentSelector, codeActionProvider));
        localDisposables.push(diagnosticsProvider_1.default(server, advisor));
        localDisposables.push(changeForwarding_1.default(server));
    }));
    disposables.push(server.onServerStop(function () {
        // remove language feature providers on stop
        (_a = vscode.Disposable).from.apply(_a, localDisposables).dispose();
        var _a;
    }));
    disposables.push(commands_1.default(server, context.extensionPath));
    disposables.push(status_1.default(server));
    if (!context.workspaceState.get('assetPromptDisabled')) {
        disposables.push(server.onServerStart(function () {
            // Update or add tasks.json and launch.json
            assets_1.addAssetsIfNecessary(server).then(function (result) {
                if (result === assets_1.AddAssetResult.Disable) {
                    context.workspaceState.update('assetPromptDisabled', true);
                }
            });
        }));
    }
    // read and store last solution or folder path
    disposables.push(server.onBeforeServerStart(function (path) { return context.workspaceState.update('lastSolutionPathOrFolder', path); }));
    var options = options_1.Options.Read();
    if (options.autoStart) {
        server.autoStart(context.workspaceState.get('lastSolutionPathOrFolder'));
    }
    // stop server on deactivate
    disposables.push(new vscode.Disposable(function () {
        advisor.dispose();
        server.stop();
    }));
    (_a = context.subscriptions).push.apply(_a, disposables);
    var _a;
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map