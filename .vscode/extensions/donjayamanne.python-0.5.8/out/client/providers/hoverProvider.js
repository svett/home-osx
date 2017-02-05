'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode = require('vscode');
const proxy = require('./jediProxy');
const jediHelpers_1 = require('./jediHelpers');
class PythonHoverProvider {
    constructor(context, jediProxy = null) {
        this.jediProxyHandler = new proxy.JediProxyHandler(context, jediProxy);
    }
    static parseData(data) {
        let results = [];
        data.items.forEach(item => {
            let { description, signature } = item;
            switch (item.kind) {
                case vscode.SymbolKind.Constructor:
                case vscode.SymbolKind.Function:
                case vscode.SymbolKind.Method: {
                    signature = 'def ' + signature;
                    break;
                }
                case vscode.SymbolKind.Class: {
                    signature = 'class ' + signature;
                    break;
                }
            }
            results.push({ language: 'python', value: signature });
            if (item.description) {
                var descriptionWithHighlightedCode = jediHelpers_1.highlightCode(item.description);
                results.push(descriptionWithHighlightedCode);
            }
        });
        return new vscode.Hover(results);
    }
    provideHover(document, position, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var filename = document.fileName;
            if (document.lineAt(position.line).text.match(/^\s*\/\//)) {
                return null;
            }
            if (position.character <= 0) {
                return null;
            }
            var range = document.getWordRangeAtPosition(position);
            if (!range || range.isEmpty) {
                return null;
            }
            var cmd = {
                command: proxy.CommandType.Hover,
                fileName: filename,
                columnIndex: range.end.character,
                lineIndex: position.line
            };
            if (document.isDirty) {
                cmd.source = document.getText();
            }
            const data = yield this.jediProxyHandler.sendCommand(cmd, token);
            if (!data || !data.items.length) {
                return;
            }
            return PythonHoverProvider.parseData(data);
        });
    }
}
exports.PythonHoverProvider = PythonHoverProvider;
//# sourceMappingURL=hoverProvider.js.map