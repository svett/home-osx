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
class CSharpDefinitionProvider extends abstractProvider_1.default {
    constructor(server, definitionMetadataDocumentProvider) {
        super(server);
        this._definitionMetadataDocumentProvider = definitionMetadataDocumentProvider;
    }
    provideDefinition(document, position, token) {
        let req = typeConvertion_1.createRequest(document, position);
        req.WantMetadata = true;
        return serverUtils.goToDefinition(this._server, req, token).then(gotoDefinitionResponse => {
            if (gotoDefinitionResponse && gotoDefinitionResponse.FileName) {
                return typeConvertion_1.toLocation(gotoDefinitionResponse);
            }
            else if (gotoDefinitionResponse.MetadataSource) {
                const metadataSource = gotoDefinitionResponse.MetadataSource;
                return serverUtils.getMetadata(this._server, {
                    Timeout: 5000,
                    AssemblyName: metadataSource.AssemblyName,
                    VersionNumber: metadataSource.VersionNumber,
                    ProjectName: metadataSource.ProjectName,
                    Language: metadataSource.Language,
                    TypeName: metadataSource.TypeName
                }).then(metadataResponse => {
                    if (!metadataResponse || !metadataResponse.Source || !metadataResponse.SourceName) {
                        return;
                    }
                    const uri = this._definitionMetadataDocumentProvider.addMetadataResponse(metadataResponse);
                    return new vscode_1.Location(uri, new vscode_1.Position(gotoDefinitionResponse.Line - 1, gotoDefinitionResponse.Column - 1));
                });
            }
        });
    }
}
exports.default = CSharpDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map