/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var goPath_1 = require('./goPath');
var goInstallTools_1 = require('./goInstallTools');
function documentSymbols(options) {
    return new Promise(function (resolve, reject) {
        var gooutline = goPath_1.getBinPath('go-outline');
        var gooutlineFlags = ['-f', options.fileName];
        if (options.importsOnly) {
            gooutlineFlags.push('-imports-only');
        }
        // Spawn `go-outline` process
        var p = cp.execFile(gooutline, gooutlineFlags, {}, function (err, stdout, stderr) {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('go-outline');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: -imports-only')) {
                    goInstallTools_1.promptForUpdatingTool('go-outline');
                    options.importsOnly = false;
                    return documentSymbols(options).then(function (results) {
                        return resolve(results);
                    });
                }
                if (err)
                    return resolve(null);
                var result = stdout.toString();
                var decls = JSON.parse(result);
                return resolve(decls);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.documentSymbols = documentSymbols;
var GoDocumentSymbolProvider = (function () {
    function GoDocumentSymbolProvider() {
        this.goKindToCodeKind = {
            'package': vscode.SymbolKind.Package,
            'import': vscode.SymbolKind.Namespace,
            'variable': vscode.SymbolKind.Variable,
            'type': vscode.SymbolKind.Interface,
            'function': vscode.SymbolKind.Function
        };
    }
    GoDocumentSymbolProvider.prototype.convertToCodeSymbols = function (document, decls, symbols, containerName) {
        var _this = this;
        decls.forEach(function (decl) {
            var label = decl.label;
            if (decl.receiverType) {
                label = '(' + decl.receiverType + ').' + label;
            }
            var symbolInfo = new vscode.SymbolInformation(label, _this.goKindToCodeKind[decl.type], new vscode.Range(document.positionAt(decl.start), document.positionAt(decl.end - 1)), undefined, containerName);
            symbols.push(symbolInfo);
            if (decl.children) {
                _this.convertToCodeSymbols(document, decl.children, symbols, decl.label);
            }
        });
    };
    GoDocumentSymbolProvider.prototype.provideDocumentSymbols = function (document, token) {
        var _this = this;
        var options = { fileName: document.fileName };
        return documentSymbols(options).then(function (decls) {
            var symbols = [];
            _this.convertToCodeSymbols(document, decls, symbols, '');
            return symbols;
        });
    };
    return GoDocumentSymbolProvider;
}());
exports.GoDocumentSymbolProvider = GoDocumentSymbolProvider;
//# sourceMappingURL=goOutline.js.map