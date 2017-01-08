/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
class OmnisharpReferenceProvider extends abstractProvider_1.default {
    provideReferences(document, position, options, token) {
        let req = typeConvertion_1.createRequest(document, position);
        req.OnlyThisFile = false;
        req.ExcludeDefinition = false;
        return serverUtils.findUsages(this._server, req, token).then(res => {
            if (res && Array.isArray(res.QuickFixes)) {
                return res.QuickFixes.map(typeConvertion_1.toLocation);
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OmnisharpReferenceProvider;
//# sourceMappingURL=referenceProvider.js.map