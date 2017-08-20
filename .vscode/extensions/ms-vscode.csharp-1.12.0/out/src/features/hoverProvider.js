/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const documentation_1 = require("./documentation");
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const vscode_1 = require("vscode");
class OmniSharpHoverProvider extends abstractProvider_1.default {
    provideHover(document, position, token) {
        let req = typeConvertion_1.createRequest(document, position);
        req.IncludeDocumentation = true;
        return serverUtils.typeLookup(this._server, req, token).then(value => {
            if (value && value.Type) {
                let contents = [documentation_1.extractSummaryText(value.Documentation), { language: 'csharp', value: value.Type }];
                return new vscode_1.Hover(contents);
            }
        });
    }
}
exports.default = OmniSharpHoverProvider;
//# sourceMappingURL=hoverProvider.js.map