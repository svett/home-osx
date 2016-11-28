"use strict";
var vscode_1 = require('vscode');
var DefinitionMetadataDocumentProvider = (function () {
    function DefinitionMetadataDocumentProvider() {
        this._scheme = "omnisharp-metadata";
        this._documents = new Map();
        this._documentClosedSubscription = vscode_1.workspace.onDidCloseTextDocument(this.onTextDocumentClosed, this);
    }
    DefinitionMetadataDocumentProvider.prototype.onTextDocumentClosed = function (document) {
        this._documents.delete(document.uri.toString());
    };
    DefinitionMetadataDocumentProvider.prototype.dispose = function () {
        this._registration.dispose();
        this._documentClosedSubscription.dispose();
        this._documents.clear();
    };
    DefinitionMetadataDocumentProvider.prototype.addMetadataResponse = function (metadataResponse) {
        var uri = this.createUri(metadataResponse);
        this._documents.set(uri.toString(), metadataResponse);
        return uri;
    };
    DefinitionMetadataDocumentProvider.prototype.register = function () {
        this._registration = vscode_1.workspace.registerTextDocumentContentProvider(this._scheme, this);
    };
    DefinitionMetadataDocumentProvider.prototype.provideTextDocumentContent = function (uri) {
        return this._documents.get(uri.toString()).Source;
    };
    DefinitionMetadataDocumentProvider.prototype.createUri = function (metadataResponse) {
        return vscode_1.Uri.parse(this._scheme + "://" +
            metadataResponse.SourceName.replace(/\\/g, "/")
                .replace(/(.*)\/(.*)/g, "$1/[metadata] $2"));
    };
    return DefinitionMetadataDocumentProvider;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DefinitionMetadataDocumentProvider;
//# sourceMappingURL=definitionMetadataDocumentProvider.js.map