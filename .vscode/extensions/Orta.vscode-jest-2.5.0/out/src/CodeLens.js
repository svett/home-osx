"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const appGlobals_1 = require("./appGlobals");
const path_1 = require("path");
class CodeLens extends vscode.CodeLens {
    constructor(range, fileName, identifier) {
        super(range);
        this.fileName = fileName;
        this.identifier = identifier;
    }
}
class CodeLensProvider {
    constructor() {
        this.didChangeCodeLenses = new vscode.EventEmitter();
    }
    get onDidChangeCodeLenses() {
        return this.didChangeCodeLenses.event;
    }
    provideCodeLenses(document, _token) {
        return (this.decorations || []).map(o => {
            const range = new vscode.Range(o.range.start.line, o.range.start.character, o.range.start.line, o.range.start.character + 5 // lenses all have text 'Debug'
            );
            return new CodeLens(range, path_1.basename(document.fileName), o.identifier);
        });
    }
    resolveCodeLens(codeLens, _token) {
        if (codeLens instanceof CodeLens) {
            codeLens.command = {
                arguments: [codeLens.fileName, codeLens.identifier],
                command: `${appGlobals_1.extensionName}.run-test`,
                title: 'Debug',
            };
        }
        return codeLens;
    }
    updateLenses(decorations) {
        this.decorations = decorations;
        this.didChangeCodeLenses.fire();
    }
}
exports.CodeLensProvider = CodeLensProvider;
//# sourceMappingURL=CodeLens.js.map