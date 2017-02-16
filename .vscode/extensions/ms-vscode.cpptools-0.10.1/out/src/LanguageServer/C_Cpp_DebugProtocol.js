'use strict';
var vscode = require('vscode');
var DebugProtocol_type = { get method() { return 'C_CPP/DebugProtocol'; } };
function setupDebugProtocolHandler(client) {
    var consoleChannel = vscode.window.createOutputChannel("C/CPP Debug Protocol");
    client.onNotification(DebugProtocol_type, function (output) {
        var outputEditorExist = vscode.window.visibleTextEditors.some(function (editor) {
            return editor.document.languageId == 'Log';
        });
        if (!outputEditorExist) {
            consoleChannel.show();
        }
        consoleChannel.appendLine("");
        consoleChannel.appendLine("************************************************************************************************************************");
        consoleChannel.append("" + output);
    });
}
exports.setupDebugProtocolHandler = setupDebugProtocolHandler;
//# sourceMappingURL=C_Cpp_DebugProtocol.js.map