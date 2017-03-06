/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
function documentSymbols(options) {
    return new Promise((resolve, reject) => {
        let gooutline = util_1.getBinPath('go-outline');
        let gooutlineFlags = ['-f', options.fileName];
        if (options.importsOnly) {
            gooutlineFlags.push('-imports-only');
        }
        // Spawn `go-outline` process
        let p = cp.execFile(gooutline, gooutlineFlags, {}, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('go-outline');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: -imports-only')) {
                    goInstallTools_1.promptForUpdatingTool('go-outline');
                    options.importsOnly = false;
                    return documentSymbols(options).then(results => {
                        return resolve(results);
                    });
                }
                if (err)
                    return resolve(null);
                let result = stdout.toString();
                let decls = JSON.parse(result);
                return resolve(decls);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.documentSymbols = documentSymbols;
class GoDocumentSymbolProvider {
    constructor() {
        this.goKindToCodeKind = {
            'package': vscode.SymbolKind.Package,
            'import': vscode.SymbolKind.Namespace,
            'variable': vscode.SymbolKind.Variable,
            'type': vscode.SymbolKind.Interface,
            'function': vscode.SymbolKind.Function
        };
    }
    convertToCodeSymbols(document, decls, symbols, containerName) {
        let gotoSymbolConfig = vscode.workspace.getConfiguration('go')['gotoSymbol'];
        let includeImports = gotoSymbolConfig ? gotoSymbolConfig['includeImports'] : false;
        util_1.sendTelemetryEvent('file-symbols', { includeImports });
        decls.forEach(decl => {
            if (!includeImports && decl.type === 'import')
                return;
            let label = decl.label;
            if (decl.receiverType) {
                label = '(' + decl.receiverType + ').' + label;
            }
            let codeBuf = new Buffer(document.getText());
            let start = codeBuf.slice(0, decl.start - 1).toString().length;
            let end = codeBuf.slice(0, decl.end - 1).toString().length;
            let symbolInfo = new vscode.SymbolInformation(label, this.goKindToCodeKind[decl.type], new vscode.Range(document.positionAt(start), document.positionAt(end)), undefined, containerName);
            symbols.push(symbolInfo);
            if (decl.children) {
                this.convertToCodeSymbols(document, decl.children, symbols, decl.label);
            }
        });
    }
    provideDocumentSymbols(document, token) {
        let options = { fileName: document.fileName };
        return documentSymbols(options).then(decls => {
            let symbols = [];
            this.convertToCodeSymbols(document, decls, symbols, '');
            return symbols;
        });
    }
}
exports.GoDocumentSymbolProvider = GoDocumentSymbolProvider;
//# sourceMappingURL=goOutline.js.map