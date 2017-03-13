/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const abstractProvider_1 = require("./abstractProvider");
const dotnetTest_1 = require("./dotnetTest");
const serverUtils = require("../omnisharp/utils");
class OmniSharpCodeLens extends vscode_1.CodeLens {
    constructor(fileName, range) {
        super(range);
        this.fileName = fileName;
    }
}
class OmniSharpCodeLensProvider extends abstractProvider_1.default {
    provideCodeLenses(document, token) {
        return serverUtils.currentFileMembersAsTree(this._server, { Filename: document.fileName }, token).then(tree => {
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
        bucket.push(lens);
        for (let child of node.ChildNodes) {
            this._convertQuickFix(bucket, fileName, child);
        }
        dotnetTest_1.updateCodeLensForTest(bucket, fileName, node, this._server.isDebugEnable());
    }
    resolveCodeLens(codeLens, token) {
        if (codeLens instanceof OmniSharpCodeLens) {
            let req = {
                Filename: codeLens.fileName,
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
                    arguments: [vscode_1.Uri.file(req.Filename), codeLens.range.start, res.QuickFixes.map(typeConvertion_1.toLocation)]
                };
                return codeLens;
            });
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