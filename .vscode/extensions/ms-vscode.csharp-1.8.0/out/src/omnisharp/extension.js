/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const definitionProvider_1 = require("../features/definitionProvider");
const implementationProvider_1 = require("../features/implementationProvider");
const codeLensProvider_1 = require("../features/codeLensProvider");
const definitionMetadataDocumentProvider_1 = require("../features/definitionMetadataDocumentProvider");
const documentHighlightProvider_1 = require("../features/documentHighlightProvider");
const documentSymbolProvider_1 = require("../features/documentSymbolProvider");
const codeActionProvider_1 = require("../features/codeActionProvider");
const referenceProvider_1 = require("../features/referenceProvider");
const hoverProvider_1 = require("../features/hoverProvider");
const renameProvider_1 = require("../features/renameProvider");
const formattingEditProvider_1 = require("../features/formattingEditProvider");
const completionItemProvider_1 = require("../features/completionItemProvider");
const workspaceSymbolProvider_1 = require("../features/workspaceSymbolProvider");
const diagnosticsProvider_1 = require("../features/diagnosticsProvider");
const signatureHelpProvider_1 = require("../features/signatureHelpProvider");
const commands_1 = require("../features/commands");
const changeForwarding_1 = require("../features/changeForwarding");
const status_1 = require("../features/status");
const server_1 = require("./server");
const options_1 = require("./options");
const assets_1 = require("../assets");
const common_1 = require("../common");
const utils = require("./utils");
function activate(context, reporter) {
    const documentSelector = {
        language: 'csharp',
        scheme: 'file' // only files from disk
    };
    const server = new server_1.OmniSharpServer(reporter);
    const advisor = new diagnosticsProvider_1.Advisor(server); // create before server is started
    const disposables = [];
    const localDisposables = [];
    disposables.push(server.onServerStart(() => {
        // register language feature provider on start
        const definitionMetadataDocumentProvider = new definitionMetadataDocumentProvider_1.default();
        definitionMetadataDocumentProvider.register();
        localDisposables.push(definitionMetadataDocumentProvider);
        localDisposables.push(vscode.languages.registerDefinitionProvider(documentSelector, new definitionProvider_1.default(server, definitionMetadataDocumentProvider)));
        localDisposables.push(vscode.languages.registerImplementationProvider(documentSelector, new implementationProvider_1.default(server)));
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
        const codeActionProvider = new codeActionProvider_1.default(server);
        localDisposables.push(codeActionProvider);
        localDisposables.push(vscode.languages.registerCodeActionsProvider(documentSelector, codeActionProvider));
        localDisposables.push(diagnosticsProvider_1.default(server, advisor));
        localDisposables.push(changeForwarding_1.default(server));
    }));
    disposables.push(server.onServerStop(() => {
        // remove language feature providers on stop
        vscode.Disposable.from(...localDisposables).dispose();
    }));
    disposables.push(commands_1.default(server, context.extensionPath));
    disposables.push(status_1.default(server));
    if (!context.workspaceState.get('assetPromptDisabled')) {
        disposables.push(server.onServerStart(() => {
            // Update or add tasks.json and launch.json
            assets_1.addAssetsIfNecessary(server).then(result => {
                if (result === assets_1.AddAssetResult.Disable) {
                    context.workspaceState.update('assetPromptDisabled', true);
                }
            });
        }));
    }
    // Send telemetry about the sorts of projects the server was started on.
    disposables.push(server.onServerStart(() => {
        let measures = {};
        utils.requestWorkspaceInformation(server)
            .then(workspaceInfo => {
            if (workspaceInfo.DotNet && workspaceInfo.DotNet.Projects.length > 0) {
                measures['projectjson.projectcount'] = workspaceInfo.DotNet.Projects.length;
                measures['projectjson.filecount'] = common_1.sum(workspaceInfo.DotNet.Projects, p => common_1.safeLength(p.SourceFiles));
            }
            if (workspaceInfo.MsBuild && workspaceInfo.MsBuild.Projects.length > 0) {
                measures['msbuild.projectcount'] = workspaceInfo.MsBuild.Projects.length;
                measures['msbuild.filecount'] = common_1.sum(workspaceInfo.MsBuild.Projects, p => common_1.safeLength(p.SourceFiles));
                measures['msbuild.unityprojectcount'] = common_1.sum(workspaceInfo.MsBuild.Projects, p => p.IsUnityProject ? 1 : 0);
                measures['msbuild.netcoreprojectcount'] = common_1.sum(workspaceInfo.MsBuild.Projects, p => utils.isNetCoreProject(p) ? 1 : 0);
            }
            // TODO: Add measurements for script.
            reporter.sendTelemetryEvent('OmniSharp.Start', null, measures);
        });
    }));
    // read and store last solution or folder path
    disposables.push(server.onBeforeServerStart(path => context.workspaceState.update('lastSolutionPathOrFolder', path)));
    const options = options_1.Options.Read();
    if (options.autoStart) {
        server.autoStart(context.workspaceState.get('lastSolutionPathOrFolder'));
    }
    // stop server on deactivate
    disposables.push(new vscode.Disposable(() => {
        advisor.dispose();
        server.stop();
    }));
    context.subscriptions.push(...disposables);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map