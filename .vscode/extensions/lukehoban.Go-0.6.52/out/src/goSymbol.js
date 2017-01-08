/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
const vscode = require("vscode");
const cp = require("child_process");
const goPath_1 = require("./goPath");
const goInstallTools_1 = require("./goInstallTools");
class GoWorkspaceSymbolProvider {
    constructor() {
        this.goKindToCodeKind = {
            'package': vscode.SymbolKind.Package,
            'import': vscode.SymbolKind.Namespace,
            'var': vscode.SymbolKind.Variable,
            'type': vscode.SymbolKind.Interface,
            'func': vscode.SymbolKind.Function,
            'const': vscode.SymbolKind.Constant,
        };
    }
    provideWorkspaceSymbols(query, token) {
        let convertToCodeSymbols = (decls, symbols) => {
            decls.forEach(decl => {
                let kind;
                if (decl.kind !== '') {
                    kind = this.goKindToCodeKind[decl.kind];
                }
                let pos = new vscode.Position(decl.line, decl.character);
                let symbolInfo = new vscode.SymbolInformation(decl.name, kind, new vscode.Range(pos, pos), vscode.Uri.file(decl.path), '');
                symbols.push(symbolInfo);
            });
        };
        let symArgs = vscode.workspace.getConfiguration('go')['symbols'];
        let args = [vscode.workspace.rootPath, query];
        if (symArgs !== undefined && symArgs !== '') {
            args.unshift(symArgs);
        }
        let gosyms = goPath_1.getBinPath('go-symbols');
        return new Promise((resolve, reject) => {
            let p = cp.execFile(gosyms, args, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('go-symbols');
                    }
                    if (err)
                        return resolve(null);
                    let result = stdout.toString();
                    let decls = JSON.parse(result);
                    let symbols = [];
                    convertToCodeSymbols(decls, symbols);
                    return resolve(symbols);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.GoWorkspaceSymbolProvider = GoWorkspaceSymbolProvider;
//# sourceMappingURL=goSymbol.js.map