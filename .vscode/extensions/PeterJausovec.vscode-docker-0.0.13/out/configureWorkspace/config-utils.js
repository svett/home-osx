"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function promptForPort() {
    var opt = {
        placeHolder: '3000',
        prompt: 'What port does your app listen on?',
        value: '3000'
    };
    return vscode.window.showInputBox(opt);
}
exports.promptForPort = promptForPort;
function quickPickPlatform() {
    var opt = {
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: 'Select Application Platform'
    };
    var items = [];
    items.push('Go');
    items.push('.NET Core');
    items.push('Node.js');
    items.push('Other');
    return vscode.window.showQuickPick(items, opt);
}
exports.quickPickPlatform = quickPickPlatform;
//# sourceMappingURL=config-utils.js.map