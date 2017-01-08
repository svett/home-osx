"use strict";
const vscode = require("vscode");
const settings_1 = require("./settings");
const welcome_1 = require("./welcome");
const commands_1 = require("./commands");
function Initialize(context) {
    commands_1.registerCommands(context);
    welcome_1.manageWelcomeMessage(new settings_1.SettingsManager(vscode));
}
function activate(context) {
    // tslint:disable-next-line no-console
    console.log('vscode-icons is active!');
    Initialize(context);
}
exports.activate = activate;
// this method is called when your vscode is closed
function deactivate() {
    // no code here at the moment
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map