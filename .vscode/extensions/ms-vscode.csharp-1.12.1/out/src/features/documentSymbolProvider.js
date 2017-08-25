/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
class OmnisharpDocumentSymbolProvider extends abstractProvider_1.default {
    provideDocumentSymbols(document, token) {
        return serverUtils.currentFileMembersAsTree(this._server, { FileName: document.fileName }, token).then(tree => {
            let ret = [];
            for (let node of tree.TopLevelTypeDefinitions) {
                typeConvertion_1.toDocumentSymbol(ret, node);
            }
            return ret;
        });
    }
}
exports.default = OmnisharpDocumentSymbolProvider;
//# sourceMappingURL=documentSymbolProvider.js.map