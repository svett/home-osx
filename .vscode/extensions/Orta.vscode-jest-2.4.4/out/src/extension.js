"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const jest_editor_support_1 = require("jest-editor-support");
const path = require("path");
const appGlobals_1 = require("./appGlobals");
const helpers_1 = require("./helpers");
const JestExt_1 = require("./JestExt");
const statusBar_1 = require("./statusBar");
const fileChangeWatchers_1 = require("./fileChangeWatchers");
const Coverage_1 = require("./Coverage");
let extensionInstance;
function activate(context) {
    // To make us VS Code agnostic outside of this file
    const workspaceConfig = vscode.workspace.getConfiguration('jest');
    const pluginSettings = {
        autoEnable: workspaceConfig.get('autoEnable'),
        pathToConfig: workspaceConfig.get('pathToConfig'),
        pathToJest: workspaceConfig.get('pathToJest'),
        enableInlineErrorMessages: workspaceConfig.get('enableInlineErrorMessages'),
        enableSnapshotUpdateMessages: workspaceConfig.get('enableSnapshotUpdateMessages'),
        rootPath: path.join(vscode.workspace.rootPath, workspaceConfig.get('rootPath')),
    };
    const jestPath = helpers_1.pathToJest(pluginSettings);
    const configPath = helpers_1.pathToConfig(pluginSettings);
    const currentJestVersion = 20;
    const workspace = new jest_editor_support_1.ProjectWorkspace(pluginSettings.rootPath, jestPath, configPath, currentJestVersion);
    // Create our own console
    const channel = vscode.window.createOutputChannel('Jest');
    // We need a singleton to represent the extension
    extensionInstance = new JestExt_1.JestExt(workspace, channel, pluginSettings);
    context.subscriptions.push(statusBar_1.registerStatusBar(channel), vscode.commands.registerTextEditorCommand(`${appGlobals_1.extensionName}.start`, () => {
        vscode.window.showInformationMessage('Started Jest, press escape to hide this message.');
        extensionInstance.startProcess();
    }), vscode.commands.registerTextEditorCommand(`${appGlobals_1.extensionName}.stop`, () => extensionInstance.stopProcess()), vscode.commands.registerTextEditorCommand('io.orta.jest.show-channel', () => {
        channel.show();
    }), ...fileChangeWatchers_1.registerFileChangeWatchers(extensionInstance), ...Coverage_1.registerCoverageCodeLens(extensionInstance), Coverage_1.registerToggleCoverageOverlay());
}
exports.activate = activate;
function deactivate() {
    extensionInstance.deactivate();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map