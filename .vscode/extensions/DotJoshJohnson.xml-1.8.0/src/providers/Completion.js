'use strict';
const vsc = require('vscode');
const XQueryCompleter_1 = require('../services/XQueryCompleter');
class XQueryCompletionItemProvider {
    provideCompletionItems(document, position) {
        let items = new Array();
        let completer = new XQueryCompleter_1.XQueryCompleter(document.getText());
        let completions = completer.getCompletions(position.line, position.character);
        completions.forEach((completion) => {
            let item = new vsc.CompletionItem(completion.name);
            item.insertText = completion.value;
            switch (completion.meta) {
                case 'function':
                    item.kind = vsc.CompletionItemKind.Function;
                    let funcStart = (completion.value.indexOf(':') + 1);
                    let funcEnd = completion.value.indexOf('(');
                    item.insertText = completion.value.substring(funcStart, funcEnd);
                    break;
                case 'Let binding':
                case 'Local variable':
                case 'Window variable':
                case 'Function parameter':
                    item.kind = vsc.CompletionItemKind.Variable;
                    item.insertText = completion.value.substring(1);
                    break;
                default: item.kind = vsc.CompletionItemKind.Text;
            }
            items.push(item);
        });
        return items;
    }
}
exports.XQueryCompletionItemProvider = XQueryCompletionItemProvider;
