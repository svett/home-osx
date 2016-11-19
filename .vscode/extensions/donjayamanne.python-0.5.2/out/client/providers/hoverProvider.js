'use strict';
const proxy = require('./jediProxy');
const telemetryContracts = require("../common/telemetryContracts");
const jediHelpers_1 = require('./jediHelpers');
class PythonHoverProvider {
    constructor(context) {
        this.jediProxyHandler = new proxy.JediProxyHandler(context);
    }
    provideHover(document, position, token) {
        var filename = document.fileName;
        if (document.lineAt(position.line).text.match(/^\s*\/\//)) {
            return Promise.resolve();
        }
        if (position.character <= 0) {
            return Promise.resolve();
        }
        var range = document.getWordRangeAtPosition(position);
        if (!range || range.isEmpty) {
            return Promise.resolve();
        }
        var columnIndex = range.start.character < range.end.character ? range.start.character + 2 : range.end.character;
        var cmd = {
            telemetryEvent: telemetryContracts.IDE.HoverDefinition,
            command: proxy.CommandType.Completions,
            fileName: filename,
            columnIndex: columnIndex,
            lineIndex: position.line
        };
        if (document.isDirty) {
            cmd.source = document.getText();
        }
        return this.jediProxyHandler.sendCommand(cmd, token).then(data => {
            if (!data || !Array.isArray(data.items) || data.items.length === 0) {
                return;
            }
            // Find the right items
            const wordUnderCursor = document.getText(range);
            const completionItem = data.items.filter(item => item.text === wordUnderCursor);
            if (completionItem.length === 0) {
                return;
            }
            var definition = completionItem[0];
            var txt = definition.description || definition.text;
            if (typeof txt !== 'string' || txt.length === 0) {
                return;
            }
            if (wordUnderCursor === txt) {
                return;
            }
            return jediHelpers_1.extractHoverInfo(definition);
        });
    }
}
exports.PythonHoverProvider = PythonHoverProvider;
//# sourceMappingURL=hoverProvider.js.map