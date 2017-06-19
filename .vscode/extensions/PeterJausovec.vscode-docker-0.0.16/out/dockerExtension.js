"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const dockerHoverProvider_1 = require("./dockerHoverProvider");
const dockerfileCompletionItemProvider_1 = require("./dockerfile/dockerfileCompletionItemProvider");
const dockerComposeCompletionItemProvider_1 = require("./dockerCompose/dockerComposeCompletionItemProvider");
const dockerfileKeyInfo_1 = require("./dockerfile/dockerfileKeyInfo");
const dockerComposeKeyInfo_1 = require("./dockerCompose/dockerComposeKeyInfo");
const dockerComposeParser_1 = require("./dockerCompose/dockerComposeParser");
const dockerfileParser_1 = require("./dockerfile/dockerfileParser");
const vscode = require("vscode");
const build_image_1 = require("./commands/build-image");
const remove_image_1 = require("./commands/remove-image");
const push_image_1 = require("./commands/push-image");
const start_container_1 = require("./commands/start-container");
const stop_container_1 = require("./commands/stop-container");
const showlogs_container_1 = require("./commands/showlogs-container");
const open_shell_container_1 = require("./commands/open-shell-container");
const tag_image_1 = require("./commands/tag-image");
const docker_compose_1 = require("./commands/docker-compose");
const configure_1 = require("./configureWorkspace/configure");
const dockerLinting_1 = require("./linting/dockerLinting");
const system_prune_1 = require("./commands/system-prune");
const telemetry_1 = require("./telemetry/telemetry");
exports.FROM_DIRECTIVE_PATTERN = /^\s*FROM\s*([\w-\/:]*)(\s*AS\s*[a-z][a-z0-9-_\\.]*)?$/i;
exports.COMPOSE_FILE_GLOB_PATTERN = '**/[dD]ocker-[cC]ompose*.{yaml,yml}';
exports.DOCKERFILE_GLOB_PATTERN = '**/[dD]ocker[fF]ile*';
;
function activate(ctx) {
    const DOCKERFILE_MODE_ID = { language: 'dockerfile', scheme: 'file' };
    ctx.subscriptions.push(new telemetry_1.Reporter(ctx));
    var dockerHoverProvider = new dockerHoverProvider_1.DockerHoverProvider(new dockerfileParser_1.DockerfileParser(), dockerfileKeyInfo_1.DOCKERFILE_KEY_INFO);
    ctx.subscriptions.push(vscode.languages.registerHoverProvider(DOCKERFILE_MODE_ID, dockerHoverProvider));
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(DOCKERFILE_MODE_ID, new dockerfileCompletionItemProvider_1.DockerfileCompletionItemProvider(), '.'));
    const YAML_MODE_ID = { language: 'yaml', scheme: 'file', pattern: exports.COMPOSE_FILE_GLOB_PATTERN };
    var yamlHoverProvider = new dockerHoverProvider_1.DockerHoverProvider(new dockerComposeParser_1.DockerComposeParser(), dockerComposeKeyInfo_1.default.All);
    ctx.subscriptions.push(vscode.languages.registerHoverProvider(YAML_MODE_ID, yamlHoverProvider));
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(YAML_MODE_ID, new dockerComposeCompletionItemProvider_1.DockerComposeCompletionItemProvider(), '.'));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.configure', configure_1.configure));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.debug.configureLaunchJson', configure_1.configureLaunchJson));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.build', build_image_1.buildImage));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.remove', remove_image_1.removeImage));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.push', push_image_1.pushImage));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.image.tag', tag_image_1.tagImage));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.start', start_container_1.startContainer));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.start.interactive', start_container_1.startContainerInteractive));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.start.azurecli', start_container_1.startAzureCLI));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.stop', stop_container_1.stopContainer));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.show-logs', showlogs_container_1.showLogsContainer));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.container.open-shell', open_shell_container_1.openShellContainer));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.compose.up', docker_compose_1.composeUp));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.compose.down', docker_compose_1.composeDown));
    ctx.subscriptions.push(vscode.commands.registerCommand('vscode-docker.system.prune', system_prune_1.systemPrune));
    exports.diagnosticCollection = vscode.languages.createDiagnosticCollection('docker-diagnostics');
    ctx.subscriptions.push(exports.diagnosticCollection);
    vscode.workspace.onDidChangeTextDocument((e) => dockerLinting_1.scheduleValidate(e.document), ctx.subscriptions);
    vscode.workspace.textDocuments.forEach((doc) => dockerLinting_1.scheduleValidate(doc));
    vscode.workspace.onDidOpenTextDocument((doc) => dockerLinting_1.scheduleValidate(doc), ctx.subscriptions);
    vscode.workspace.onDidCloseTextDocument((doc) => exports.diagnosticCollection.delete(doc.uri), ctx.subscriptions);
}
exports.activate = activate;
//# sourceMappingURL=dockerExtension.js.map