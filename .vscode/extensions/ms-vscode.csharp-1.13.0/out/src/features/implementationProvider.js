/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
class CSharpImplementationProvider extends abstractProvider_1.default {
    provideImplementation(document, position, token) {
        const request = typeConvertion_1.createRequest(document, position);
        return serverUtils.findImplementations(this._server, request, token).then(response => {
            if (!response || !response.QuickFixes) {
                return;
            }
            return response.QuickFixes.map(fix => typeConvertion_1.toLocation(fix));
        });
    }
}
exports.default = CSharpImplementationProvider;
//# sourceMappingURL=implementationProvider.js.map