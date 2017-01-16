"use strict";
const vscode = require("vscode");
const settings_1 = require("./settings");
const init_1 = require("./init");
const commands_1 = require("./commands");
const vscode_extensions_1 = require("./utils/vscode-extensions");
function Initialize(context) {
    commands_1.registerCommands(context);
    const settingsManager = new settings_1.SettingsManager(vscode);
    init_1.manageWelcomeMessage(settingsManager);
    init_1.manageAutoApplyCustomizations(settingsManager.isNewVersion(), vscode_extensions_1.getConfig().vsicons, commands_1.applyCustomizationCommand);
}
function activate(context) {
    Initialize(context);
    // tslint:disable-next-line no-console
    console.log('vscode-icons is active!');
}
exports.activate = activate;
// this method is called when your vscode is closed
function deactivate() {
    // no code here at the moment
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map