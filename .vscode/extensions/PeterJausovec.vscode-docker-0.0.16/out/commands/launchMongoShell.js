"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function launchMongoShell() {
    let terminal = vscode.window.createTerminal("Mongo", "/usr/local/bin/mongo");
    terminal.show();
}
exports.launchMongoShell = launchMongoShell;
//# sourceMappingURL=launchMongoShell.js.map