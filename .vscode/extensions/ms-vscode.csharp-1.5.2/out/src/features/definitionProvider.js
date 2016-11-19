/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstractProvider_1 = require('./abstractProvider');
var serverUtils = require('../omnisharp/utils');
var typeConvertion_1 = require('../omnisharp/typeConvertion');
var vscode_1 = require('vscode');
var CSharpDefinitionProvider = (function (_super) {
    __extends(CSharpDefinitionProvider, _super);
    function CSharpDefinitionProvider(server, definitionMetadataDocumentProvider) {
        _super.call(this, server);
        this._definitionMetadataDocumentProvider = definitionMetadataDocumentProvider;
    }
    CSharpDefinitionProvider.prototype.provideDefinition = function (document, position, token) {
        var _this = this;
        var req = typeConvertion_1.createRequest(document, position);
        req.WantMetadata = true;
        return serverUtils.goToDefinition(this._server, req, token).then(function (gotoDefinitionResponse) {
            if (gotoDefinitionResponse && gotoDefinitionResponse.FileName) {
                return typeConvertion_1.toLocation(gotoDefinitionResponse);
            }
            else if (gotoDefinitionResponse.MetadataSource) {
                var metadataSource = gotoDefinitionResponse.MetadataSource;
                return serverUtils.getMetadata(_this._server, {
                    Timeout: 5000,
                    AssemblyName: metadataSource.AssemblyName,
                    VersionNumber: metadataSource.VersionNumber,
                    ProjectName: metadataSource.ProjectName,
                    Language: metadataSource.Language,
                    TypeName: metadataSource.TypeName
                }).then(function (metadataResponse) {
                    if (!metadataResponse || !metadataResponse.Source || !metadataResponse.SourceName) {
                        return;
                    }
                    var uri = _this._definitionMetadataDocumentProvider.addMetadataResponse(metadataResponse);
                    return new vscode_1.Location(uri, new vscode_1.Position(gotoDefinitionResponse.Line - 1, gotoDefinitionResponse.Column - 1));
                });
            }
        });
    };
    return CSharpDefinitionProvider;
}(abstractProvider_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CSharpDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map