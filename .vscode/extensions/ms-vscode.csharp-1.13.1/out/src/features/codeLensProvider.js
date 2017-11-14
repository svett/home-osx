/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const options_1 = require("../omnisharp/options");
class OmniSharpCodeLens extends vscode.CodeLens {
    constructor(fileName, range) {
        super(range);
        this.fileName = fileName;
    }
}
class OmniSharpCodeLensProvider extends abstractProvider_1.default {
    constructor(server, reporter, testManager) {
        super(server, reporter);
        this._testManager = testManager;
        this._resetCachedOptions();
        let configChangedDisposable = vscode.workspace.onDidChangeConfiguration(this._resetCachedOptions, this);
        this.addDisposables(configChangedDisposable);
    }
    _resetCachedOptions() {
        this._options = options_1.Options.Read();
    }
    provideCodeLenses(document, token) {
        if (!this._options.showReferencesCodeLens && !this._options.showTestsCodeLens) {
            return [];
        }
        return serverUtils.currentFileMembersAsTree(this._server, { FileName: document.fileName }, token).then(tree => {
            let ret = [];
            tree.TopLevelTypeDefinitions.forEach(node => this._convertQuickFix(ret, document.fileName, node));
            return ret;
        });
    }
    _convertQuickFix(bucket, fileName, node) {
        if (node.Kind === 'MethodDeclaration' && OmniSharpCodeLensProvider.filteredSymbolNames[node.Location.Text]) {
            return;
        }
        let lens = new OmniSharpCodeLens(fileName, typeConvertion_1.toRange(node.Location));
        if (this._options.showReferencesCodeLens) {
            bucket.push(lens);
        }
        for (let child of node.ChildNodes) {
            this._convertQuickFix(bucket, fileName, child);
        }
        if (this._options.showTestsCodeLens) {
            this._updateCodeLensForTest(bucket, fileName, node);
        }
    }
    resolveCodeLens(codeLens, token) {
        if (codeLens instanceof OmniSharpCodeLens) {
            let req = {
                FileName: codeLens.fileName,
                Line: codeLens.range.start.line + 1,
                Column: codeLens.range.start.character + 1,
                OnlyThisFile: false,
                ExcludeDefinition: true
            };
            return serverUtils.findUsages(this._server, req, token).then(res => {
                if (!res || !Array.isArray(res.QuickFixes)) {
                    return;
                }
                let len = res.QuickFixes.length;
                codeLens.command = {
                    title: len === 1 ? '1 reference' : `${len} references`,
                    command: 'editor.action.showReferences',
                    arguments: [vscode.Uri.file(req.FileName), codeLens.range.start, res.QuickFixes.map(typeConvertion_1.toLocation)]
                };
                return codeLens;
            });
        }
    }
    _updateCodeLensForTest(bucket, fileName, node) {
        // backward compatible check: Features property doesn't present on older version OmniSharp
        if (node.Features === undefined) {
            return;
        }
        let testFeature = node.Features.find(value => (value.Name == 'XunitTestMethod' || value.Name == 'NUnitTestMethod' || value.Name == 'MSTestMethod'));
        if (testFeature) {
            // this test method has a test feature
            let testFrameworkName = 'xunit';
            if (testFeature.Name == 'NUnitTestMethod') {
                testFrameworkName = 'nunit';
            }
            else if (testFeature.Name == 'MSTestMethod') {
                testFrameworkName = 'mstest';
            }
            bucket.push(new vscode.CodeLens(typeConvertion_1.toRange(node.Location), { title: "run test", command: 'dotnet.test.run', arguments: [testFeature.Data, fileName, testFrameworkName] }));
            bucket.push(new vscode.CodeLens(typeConvertion_1.toRange(node.Location), { title: "debug test", command: 'dotnet.test.debug', arguments: [testFeature.Data, fileName, testFrameworkName] }));
        }
    }
}
OmniSharpCodeLensProvider.filteredSymbolNames = {
    'Equals': true,
    'Finalize': true,
    'GetHashCode': true,
    'ToString': true
};
exports.default = OmniSharpCodeLensProvider;
//# sourceMappingURL=codeLensProvider.js.map