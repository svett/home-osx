/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const vscode_1 = require("vscode");
const testUtils_1 = require("./testUtils");
const goOutline_1 = require("./goOutline");
const util_1 = require("./util");
const goBaseCodelens_1 = require("./goBaseCodelens");
class GoRunTestCodeLensProvider extends goBaseCodelens_1.GoBaseCodeLensProvider {
    constructor() {
        super(...arguments);
        this.debugConfig = {
            'name': 'Launch',
            'type': 'go',
            'request': 'launch',
            'mode': 'test',
            'env': {
                'GOPATH': util_1.getCurrentGoPath() // Passing current GOPATH to Delve as it runs in another process
            }
        };
    }
    provideCodeLenses(document, token) {
        if (!this.enabled) {
            return [];
        }
        let config = vscode.workspace.getConfiguration('go', document.uri);
        let codeLensConfig = config.get('enableCodeLens');
        let codelensEnabled = codeLensConfig ? codeLensConfig['runtest'] : false;
        if (!codelensEnabled || !document.fileName.endsWith('_test.go')) {
            return;
        }
        return Promise.all([
            this.getCodeLensForPackage(document),
            this.getCodeLensForFunctions(config, document)
        ]).then(res => {
            return res[0].concat(res[1]);
        });
    }
    getCodeLensForPackage(document) {
        let documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
        return documentSymbolProvider.provideDocumentSymbols(document, null)
            .then(symbols => symbols.find(sym => sym.kind === vscode.SymbolKind.Package && !!sym.name))
            .then(pkg => {
            if (pkg) {
                const range = pkg.location.range;
                return [
                    new vscode_1.CodeLens(range, {
                        title: 'run package tests',
                        command: 'go.test.package'
                    }),
                    new vscode_1.CodeLens(range, {
                        title: 'run file tests',
                        command: 'go.test.file'
                    })
                ];
            }
        });
    }
    getCodeLensForFunctions(vsConfig, document) {
        return testUtils_1.getTestFunctions(document).then(testFunctions => {
            let codelens = [];
            testFunctions.forEach(func => {
                let runTestCmd = {
                    title: 'run test',
                    command: 'go.test.cursor',
                    arguments: [{ functionName: func.name }]
                };
                const args = ['-test.run', func.name];
                const program = path.dirname(document.fileName);
                const env = Object.assign({}, this.debugConfig.env, vsConfig['testEnvVars']);
                const envFile = vsConfig['testEnvFile'];
                let buildFlags = testUtils_1.getTestFlags(vsConfig, null);
                if (vsConfig['buildTags'] && buildFlags.indexOf('-tags') === -1) {
                    buildFlags.push('-tags');
                    buildFlags.push(`${vsConfig['buildTags']}`);
                }
                let config = Object.assign({}, this.debugConfig, { args, program, env, envFile, buildFlags: buildFlags.map(x => `'${x}'`).join(' ') });
                let debugTestCmd = {
                    title: 'debug test',
                    command: 'vscode.startDebug',
                    arguments: [config]
                };
                codelens.push(new vscode_1.CodeLens(func.location.range, runTestCmd));
                codelens.push(new vscode_1.CodeLens(func.location.range, debugTestCmd));
            });
            return codelens;
        });
    }
}
exports.GoRunTestCodeLensProvider = GoRunTestCodeLensProvider;
//# sourceMappingURL=goRunTestCodelens.js.map