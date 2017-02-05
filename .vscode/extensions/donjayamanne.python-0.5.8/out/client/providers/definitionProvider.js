'use strict';
const vscode = require('vscode');
const proxy = require('./jediProxy');
class PythonDefinitionProvider {
    constructor(context) {
        this.jediProxyHandler = new proxy.JediProxyHandler(context);
    }
    get JediProxy() {
        return this.jediProxyHandler.JediProxy;
    }
    static parseData(data) {
        if (data && data.definition) {
            const definition = data.definition;
            const definitionResource = vscode.Uri.file(definition.fileName);
            const range = new vscode.Range(definition.range.startLine, definition.range.startColumn, definition.range.endLine, definition.range.endColumn);
            return new vscode.Location(definitionResource, range);
        }
        return null;
    }
    provideDefinition(document, position, token) {
        var filename = document.fileName;
        if (document.lineAt(position.line).text.match(/^\s*\/\//)) {
            return Promise.resolve(null);
        }
        if (position.character <= 0) {
            return Promise.resolve(null);
        }
        var range = document.getWordRangeAtPosition(position);
        var columnIndex = range.isEmpty ? position.character : range.end.character;
        var cmd = {
            command: proxy.CommandType.Definitions,
            fileName: filename,
            columnIndex: columnIndex,
            lineIndex: position.line
        };
        if (document.isDirty) {
            cmd.source = document.getText();
        }
        return this.jediProxyHandler.sendCommand(cmd, token).then(data => {
            return PythonDefinitionProvider.parseData(data);
        });
    }
}
exports.PythonDefinitionProvider = PythonDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map