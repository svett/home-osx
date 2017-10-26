"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const elegantSpinner = require("elegant-spinner");
const appGlobals_1 = require("./appGlobals");
// The bottom status bar
const statusBarCommand = `${appGlobals_1.extensionName}.show-output`;
const statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
statusBarItem.show();
statusBarItem.command = statusBarCommand;
const statusKey = 'Jest:';
const frame = elegantSpinner();
let statusBarSpinner;
function registerStatusBar(channel) {
    return vscode_1.commands.registerCommand(statusBarCommand, () => channel.show());
}
exports.registerStatusBar = registerStatusBar;
function initial() {
    updateStatus('...');
}
exports.initial = initial;
function running(details) {
    clearInterval(statusBarSpinner);
    statusBarSpinner = setInterval(() => {
        statusBarItem.text = `${statusKey} ${frame()} ${details || ''}`;
    }, 100);
}
exports.running = running;
function success(details) {
    updateStatus('$(check)', details);
}
exports.success = success;
function failed(details) {
    updateStatus('$(alert)', details);
}
exports.failed = failed;
function stopped(details) {
    updateStatus('stopped', details);
}
exports.stopped = stopped;
function updateStatus(message, details) {
    clearInterval(statusBarSpinner);
    statusBarItem.text = `${statusKey} ${message} ${details || ''}`;
}
//# sourceMappingURL=statusBar.js.map