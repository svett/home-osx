"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
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
const dockerComposeHoverProvider_1 = require("./dockerCompose/dockerComposeHoverProvider");
const dockerfileCompletionItemProvider_1 = require("./dockerfile/dockerfileCompletionItemProvider");
const dockerComposeCompletionItemProvider_1 = require("./dockerCompose/dockerComposeCompletionItemProvider");
const dockerComposeKeyInfo_1 = require("./dockerCompose/dockerComposeKeyInfo");
const dockerComposeParser_1 = require("./dockerCompose/dockerComposeParser");
const vscode = require("vscode");
const build_image_1 = require("./commands/build-image");
const inspect_image_1 = require("./commands/inspect-image");
const remove_image_1 = require("./commands/remove-image");
const push_image_1 = require("./commands/push-image");
const start_container_1 = require("./commands/start-container");
const stop_container_1 = require("./commands/stop-container");
const restart_container_1 = require("./commands/restart-container");
const showlogs_container_1 = require("./commands/showlogs-container");
const open_shell_container_1 = require("./commands/open-shell-container");
const tag_image_1 = require("./commands/tag-image");
const docker_compose_1 = require("./commands/docker-compose");
const configure_1 = require("./configureWorkspace/configure");
const system_prune_1 = require("./commands/system-prune");
const telemetry_1 = require("./telemetry/telemetry");
const dockerInspect_1 = require("./documentContentProviders/dockerInspect");
const dockerExplorer_1 = require("./explorer/dockerExplorer");
const remove_container_1 = require("./commands/remove-container");
const vscode_languageclient_1 = require("vscode-languageclient");
const webAppCreator_1 = require("./explorer/deploy/webAppCreator");
const azureAccountWrapper_1 = require("./explorer/deploy/azureAccountWrapper");
const util = require("./explorer/deploy/util");
const dockerHubUtils_1 = require("./explorer/models/dockerHubUtils");
const opn = require("opn");
const configDebugProvider_1 = require("./configureWorkspace/configDebugProvider");
exports.FROM_DIRECTIVE_PATTERN = /^\s*FROM\s*([\w-\/:]*)(\s*AS\s*[a-z][a-z0-9-_\\.]*)?$/i;
exports.COMPOSE_FILE_GLOB_PATTERN = '**/[dD]ocker-[cC]ompose*.{yaml,yml}';
exports.DOCKERFILE_GLOB_PATTERN = '**/{*.dockerfile,[dD]ocker[fF]ile}';
;
let client;
function activate(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const DOCKERFILE_MODE_ID = { language: 'dockerfile', scheme: 'file' };
        const installedExtensions = vscode.extensions.all;
        const outputChannel = util.getOutputChannel();
        let azureAccount;
        for (var i = 0; i < installedExtensions.length; i++) {
            const ext = installedExtensions[i];
            if (ext.id === 'ms-vscode.azure-account') {
                try {
                    azureAccount = yield ext.activate();
                }
                catch (error) {
                    console.log('Failed to activate the Azure Account Extension: ' + error);
                }
                break;
            }
        }
        ctx.subscriptions.push(new telemetry_1.Reporter(ctx));
        exports.dockerExplorerProvider = new dockerExplorer_1.DockerExplorerProvider(azureAccount);
        vscode.window.registerTreeDataProvider('dockerExplorer', exports.dockerExplorerProvider);
        vscode.commands.registerCommand('dockerExplorer.refreshExplorer', () => exports.dockerExplorerProvider.refresh());
        vscode.commands.registerCommand('dockerExplorer.systemPrune', () => system_prune_1.systemPrune());
        ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(DOCKERFILE_MODE_ID, new dockerfileCompletionItemProvider_1.DockerfileCompletionItemProvider(), '.'));
        const YAML_MODE_ID = { language: 'yaml', scheme: 'file', pattern: exports.COMPOSE_FILE_GLOB_PATTERN };
        var yamlHoverProvider = new dockerComposeHoverProvider_1.DockerComposeHoverProvider(new dockerComposeParser_1.DockerComposeParser(), dockerComposeKeyInfo_1.default.All);
        ctx.subscriptions.push(vscode.languages.registerHoverProvider(YAML_MODE_ID, yamlHoverProvider));
        ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(YAML_MODE_ID, new dockerComposeCompletionItemProvider_1.DockerComposeCompletionItemProvider(), '.'));
        ctx.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(dockerInspect_1.SCHEME, new dockerInspect_1.default()));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.configure', configure_1.configure));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.build', build_image_1.buildImage));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.inspect', inspect_image_1.default));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.remove', remove_image_1.removeImage));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.push', push_image_1.pushImage));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.tag', tag_image_1.tagImage));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.start', start_container_1.startContainer));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.start.interactive', start_container_1.startContainerInteractive));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.start.azurecli', start_container_1.startAzureCLI));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.stop', stop_container_1.stopContainer));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.restart', restart_container_1.restartContainer));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.show-logs', showlogs_container_1.showLogsContainer));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.open-shell', open_shell_container_1.openShellContainer));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.remove', remove_container_1.removeContainer));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.compose.up', docker_compose_1.composeUp));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.compose.down', docker_compose_1.composeDown));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.system.prune', system_prune_1.systemPrune));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.createWebApp', (context) => __awaiter(this, void 0, void 0, function* () {
            if (context) {
                if (azureAccount) {
                    const azureAccountWrapper = new azureAccountWrapper_1.AzureAccountWrapper(ctx, azureAccount);
                    const wizard = new webAppCreator_1.WebAppCreator(outputChannel, azureAccountWrapper, context);
                    const result = yield wizard.run();
                }
                else {
                    const open = { title: "View in Marketplace" };
                    const response = yield vscode.window.showErrorMessage('Please install the Azure Account extension to deploy to Azure.', open);
                    if (response === open) {
                        opn('https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account');
                    }
                }
            }
        })));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.dockerHubLogout', dockerHubUtils_1.dockerHubLogout));
        ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.browseDockerHub', (context) => __awaiter(this, void 0, void 0, function* () {
            dockerHubUtils_1.browseDockerHub(context);
        })));
        ctx.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('docker', new configDebugProvider_1.DockerDebugConfigProvider()));
        activateLanguageClient(ctx);
    });
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    // perform cleanup
    Configuration.dispose();
    return client.stop();
}
exports.deactivate = deactivate;
var Configuration;
(function (Configuration) {
    let configurationListener;
    function computeConfiguration(params) {
        if (!params.items) {
            return null;
        }
        let result = [];
        for (let item of params.items) {
            let config = null;
            if (item.scopeUri) {
                config = vscode.workspace.getConfiguration(item.section, client.protocol2CodeConverter.asUri(item.scopeUri));
            }
            else {
                config = vscode.workspace.getConfiguration(item.section);
            }
            result.push(config);
        }
        return result;
    }
    Configuration.computeConfiguration = computeConfiguration;
    function initialize() {
        configurationListener = vscode.workspace.onDidChangeConfiguration(() => {
            // notify the language server that settings have change
            client.sendNotification(vscode_languageclient_1.DidChangeConfigurationNotification.type, { settings: null });
        });
    }
    Configuration.initialize = initialize;
    function dispose() {
        if (configurationListener) {
            // remove this listener when disposed
            configurationListener.dispose();
        }
    }
    Configuration.dispose = dispose;
})(Configuration || (Configuration = {}));
function activateLanguageClient(ctx) {
    let serverModule = ctx.asAbsolutePath(path.join("node_modules", "dockerfile-language-server-nodejs", "lib", "server.js"));
    let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, args: ["--node-ipc"] },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    let middleware = {
        workspace: {
            configuration: Configuration.computeConfiguration
        }
    };
    let clientOptions = {
        documentSelector: ['dockerfile'],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        },
        middleware: middleware
    };
    client = new vscode_languageclient_1.LanguageClient("dockerfile-langserver", "Dockerfile Language Server", serverOptions, clientOptions);
    // enable the proposed workspace/configuration feature
    client.registerProposedFeatures();
    client.onReady().then(() => {
        // attach the VS Code settings listener
        Configuration.initialize();
    });
    client.start();
}
//# sourceMappingURL=dockerExtension.js.map