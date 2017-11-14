"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class DefinitionMetadataDocumentProvider {
    constructor() {
        this.scheme = "omnisharp-metadata";
        this._documents = new Map();
        this._documentClosedSubscription = vscode_1.workspace.onDidCloseTextDocument(this.onTextDocumentClosed, this);
    }
    onTextDocumentClosed(document) {
        this._documents.delete(document.uri.toString());
    }
    dispose() {
        this._registration.dispose();
        this._documentClosedSubscription.dispose();
        this._documents.clear();
    }
    addMetadataResponse(metadataResponse) {
        const uri = this.createUri(metadataResponse.SourceName);
        this._documents.set(uri.toString(), metadataResponse);
        return uri;
    }
    getExistingMetadataResponseUri(sourceName) {
        return this.createUri(sourceName);
    }
    register() {
        this._registration = vscode_1.workspace.registerTextDocumentContentProvider(this.scheme, this);
    }
    provideTextDocumentContent(uri) {
        return this._documents.get(uri.toString()).Source;
    }
    createUri(sourceName) {
        return vscode_1.Uri.parse(this.scheme + "://" +
            sourceName.replace(/\\/g, "/").replace(/(.*)\/(.*)/g, "$1/[metadata] $2"));
    }
}
exports.default = DefinitionMetadataDocumentProvider;
//# sourceMappingURL=definitionMetadataDocumentProvider.js.map