/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
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
        let root = vscode.workspace.rootPath;
        if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
            root = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath;
        }
        if (!root) {
            vscode.window.showInformationMessage('No workspace is open to find symbols.');
            return;
        }
        return getWorkspaceSymbols(root, query).then(results => {
            let symbols = [];
            convertToCodeSymbols(results, symbols);
            return symbols;
        });
    }
}
exports.GoWorkspaceSymbolProvider = GoWorkspaceSymbolProvider;
function getWorkspaceSymbols(workspacePath, query, goConfig, ignoreFolderFeatureOn = true) {
    if (!goConfig) {
        goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
    }
    let gotoSymbolConfig = goConfig['gotoSymbol'];
    let ignoreFolders = gotoSymbolConfig ? gotoSymbolConfig['ignoreFolders'] : [];
    let args = (ignoreFolderFeatureOn && ignoreFolders && ignoreFolders.length > 0) ? ['-ignore', ignoreFolders.join(',')] : [];
    args.push(workspacePath);
    args.push(query);
    let gosyms = util_1.getBinPath('go-symbols');
    let env = util_1.getToolsEnvVars();
    return new Promise((resolve, reject) => {
        let p = cp.execFile(gosyms, args, { maxBuffer: 1024 * 1024, env }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('go-symbols');
                }
                if (err && stderr && stderr.startsWith('flag provided but not defined: -ignore')) {
                    goInstallTools_1.promptForUpdatingTool('go-symbols');
                    return getWorkspaceSymbols(workspacePath, query, goConfig, false).then(results => {
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
exports.getWorkspaceSymbols = getWorkspaceSymbols;
//# sourceMappingURL=goSymbol.js.map