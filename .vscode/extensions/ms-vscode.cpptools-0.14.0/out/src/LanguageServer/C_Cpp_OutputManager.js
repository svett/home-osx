'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vsutil = require("../common_vscode");
const DebugProtocol_type = {
    get method() { return "cpptools/debugProtocol"; }
};
const DebugLog_type = {
    get method() { return "cpptools/debugLog"; }
};
function setupOutputHandlers(client) {
    var consoleChannel = vscode.window.createOutputChannel("C/C++ Debug Protocol");
    client.onNotification(DebugProtocol_type, (output) => {
        var outputEditorExist = vscode.window.visibleTextEditors.some((editor) => {
            return editor.document.languageId == 'Log';
        });
        if (!outputEditorExist) {
            consoleChannel.show();
        }
        consoleChannel.appendLine("");
        consoleChannel.appendLine("************************************************************************************************************************");
        consoleChannel.append(`${output}`);
    });
    client.onNotification(DebugLog_type, (output) => {
        vsutil.getOutputChannel().appendLine(`${output}`);
    });
}
exports.setupOutputHandlers = setupOutputHandlers;
//# sourceMappingURL=C_Cpp_OutputManager.js.map