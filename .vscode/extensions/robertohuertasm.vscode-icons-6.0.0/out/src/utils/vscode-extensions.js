"use strict";
const vscode = require("vscode");
function getConfig() {
    return vscode.workspace.getConfiguration();
}
exports.getConfig = getConfig;
//# sourceMappingURL=vscode-extensions.js.map