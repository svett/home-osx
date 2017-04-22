/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const vscode_1 = require("vscode");
class OmnisharpDocumentHighlightProvider extends abstractProvider_1.default {
    provideDocumentHighlights(resource, position, token) {
        let req = typeConvertion_1.createRequest(resource, position);
        req.OnlyThisFile = true;
        req.ExcludeDefinition = false;
        return serverUtils.findUsages(this._server, req, token).then(res => {
            if (res && Array.isArray(res.QuickFixes)) {
                return res.QuickFixes.map(OmnisharpDocumentHighlightProvider._asDocumentHighlight);
            }
        });
    }
    static _asDocumentHighlight(quickFix) {
        return new vscode_1.DocumentHighlight(typeConvertion_1.toRange(quickFix), vscode_1.DocumentHighlightKind.Read);
    }
}
exports.default = OmnisharpDocumentHighlightProvider;
//# sourceMappingURL=documentHighlightProvider.js.map