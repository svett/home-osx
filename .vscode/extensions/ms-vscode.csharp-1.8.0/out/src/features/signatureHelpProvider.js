/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const documentation_1 = require("./documentation");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const vscode_1 = require("vscode");
class OmniSharpSignatureHelpProvider extends abstractProvider_1.default {
    provideSignatureHelp(document, position, token) {
        let req = typeConvertion_1.createRequest(document, position);
        return serverUtils.signatureHelp(this._server, req, token).then(res => {
            if (!res) {
                return undefined;
            }
            let ret = new vscode_1.SignatureHelp();
            ret.activeSignature = res.ActiveSignature;
            ret.activeParameter = res.ActiveParameter;
            for (let signature of res.Signatures) {
                let signatureInfo = new vscode_1.SignatureInformation(signature.Label, documentation_1.extractSummaryText(signature.Documentation));
                ret.signatures.push(signatureInfo);
                for (let parameter of signature.Parameters) {
                    let parameterInfo = new vscode_1.ParameterInformation(parameter.Label, documentation_1.extractSummaryText(parameter.Documentation));
                    signatureInfo.parameters.push(parameterInfo);
                }
            }
            return ret;
        });
    }
}
exports.default = OmniSharpSignatureHelpProvider;
//# sourceMappingURL=signatureHelpProvider.js.map