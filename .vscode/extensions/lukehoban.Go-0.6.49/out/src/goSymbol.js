/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var goPath_1 = require('./goPath');
var goInstallTools_1 = require('./goInstallTools');
var GoWorkspaceSymbolProvider = (function () {
    function GoWorkspaceSymbolProvider() {
        this.goKindToCodeKind = {
            'package': vscode.SymbolKind.Package,
            'import': vscode.SymbolKind.Namespace,
            'var': vscode.SymbolKind.Variable,
            'type': vscode.SymbolKind.Interface,
            'func': vscode.SymbolKind.Function,
            'const': vscode.SymbolKind.Constant,
        };
    }
    GoWorkspaceSymbolProvider.prototype.provideWorkspaceSymbols = function (query, token) {
        var _this = this;
        var convertToCodeSymbols = function (decls, symbols) {
            decls.forEach(function (decl) {
                var kind;
                if (decl.kind !== '') {
                    kind = _this.goKindToCodeKind[decl.kind];
                }
                var pos = new vscode.Position(decl.line, decl.character);
                var symbolInfo = new vscode.SymbolInformation(decl.name, kind, new vscode.Range(pos, pos), vscode.Uri.file(decl.path), '');
                symbols.push(symbolInfo);
            });
        };
        var symArgs = vscode.workspace.getConfiguration('go')['symbols'];
        var args = [vscode.workspace.rootPath, query];
        if (symArgs !== undefined && symArgs !== '') {
            args.unshift(symArgs);
        }
        var gosyms = goPath_1.getBinPath('go-symbols');
        return new Promise(function (resolve, reject) {
            var p = cp.execFile(gosyms, args, { maxBuffer: 1024 * 1024 }, function (err, stdout, stderr) {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('go-symbols');
                    }
                    if (err)
                        return resolve(null);
                    var result = stdout.toString();
                    var decls = JSON.parse(result);
                    var symbols = [];
                    convertToCodeSymbols(decls, symbols);
                    return resolve(symbols);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    };
    return GoWorkspaceSymbolProvider;
}());
exports.GoWorkspaceSymbolProvider = GoWorkspaceSymbolProvider;
//# sourceMappingURL=goSymbol.js.map