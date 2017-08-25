"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const RuboCop_1 = require("./RuboCop");
class RubyDocumentFormattingEditProvider {
    constructor() {
        this.autoCorrect = new RuboCop_1.AutoCorrect(vscode.workspace.getConfiguration("ruby").get("lint.rubocop") || {});
    }
    register(ctx) {
        this.autoCorrect.test().then(() => ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('ruby', this)), () => console.log("Rubocop not installed"));
    }
    provideDocumentFormattingEdits(document, options, token) {
        let opts = vscode.workspace.getConfiguration("ruby.lint.rubocop");
        if (!opts || opts === true) {
            opts = {};
        }
        const root = document.fileName ? path.dirname(document.fileName) : vscode.workspace.rootPath;
        const input = document.getText();
        return this.autoCorrect.correct(input, root, opts)
            .then(result => {
            return [new vscode.TextEdit(document.validateRange(new vscode.Range(0, 0, Infinity, Infinity)), result)];
        }, err => {
            console.log("Failed to format:", err);
            return [];
        });
    }
}
exports.RubyDocumentFormattingEditProvider = RubyDocumentFormattingEditProvider;
//# sourceMappingURL=rubyFormat.js.map