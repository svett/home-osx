'use strict';
const vscode = require('vscode');
const proxy = require('./jediProxy');
const telemetryContracts = require('../common/telemetryContracts');
const jediHelpers_1 = require('./jediHelpers');
const os_1 = require('os');
const configSettings_1 = require('../common/configSettings');
const pythonSettings = configSettings_1.PythonSettings.getInstance();
class PythonCompletionItemProvider {
    constructor(context, jediProxy = null) {
        this.jediProxyHandler = new proxy.JediProxyHandler(context, jediProxy);
    }
    static parseData(data) {
        if (data && data.items.length > 0) {
            return data.items.map(item => {
                const sigAndDocs = jediHelpers_1.extractSignatureAndDocumentation(item);
                let completionItem = new vscode.CompletionItem(item.text);
                completionItem.kind = item.type;
                completionItem.documentation = sigAndDocs[1].length === 0 ? item.description : sigAndDocs[1];
                completionItem.detail = sigAndDocs[0].split(os_1.EOL).join('');
                if (pythonSettings.autoComplete.addBrackets === true &&
                    (item.kind === vscode.SymbolKind.Function || item.kind === vscode.SymbolKind.Method)) {
                    completionItem.insertText = item.text + '({{}})';
                }
                // ensure the built in memebers are at the bottom
                completionItem.sortText = (completionItem.label.startsWith('__') ? 'z' : (completionItem.label.startsWith('_') ? 'y' : '__')) + completionItem.label;
                return completionItem;
            });
        }
        return [];
    }
    provideCompletionItems(document, position, token) {
        const filename = document.fileName;
        if (document.lineAt(position.line).text.match(/^\s*\/\//)) {
            return Promise.resolve([]);
        }
        if (position.character <= 0) {
            return Promise.resolve([]);
        }
        const type = proxy.CommandType.Completions;
        const columnIndex = position.character;
        const source = document.getText();
        const cmd = {
            telemetryEvent: telemetryContracts.IDE.Completion,
            command: type,
            fileName: filename,
            columnIndex: columnIndex,
            lineIndex: position.line,
            source: source
        };
        return this.jediProxyHandler.sendCommand(cmd, token).then(data => {
            return PythonCompletionItemProvider.parseData(data);
        });
    }
}
exports.PythonCompletionItemProvider = PythonCompletionItemProvider;
//# sourceMappingURL=completionProvider.js.map