"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function registerFileChangeWatchers(jestExt) {
    let activeEditor = vscode.window.activeTextEditor;
    return [
        vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            jestExt.triggerUpdateDecorations(activeEditor);
        }),
        vscode.workspace.onDidSaveTextDocument(document => {
            if (document) {
                jestExt.triggerUpdateDecorations(activeEditor);
            }
        }),
        vscode.workspace.onDidChangeTextDocument(({ document }) => {
            if (activeEditor && document === activeEditor.document) {
                jestExt.triggerUpdateDecorations(activeEditor);
            }
        }),
    ];
}
exports.registerFileChangeWatchers = registerFileChangeWatchers;
//# sourceMappingURL=fileChangeWatchers.js.map