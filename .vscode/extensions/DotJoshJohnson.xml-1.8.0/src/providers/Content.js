'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vsc = require('vscode');
const XmlTreeService_1 = require('../services/XmlTreeService');
class XmlTreeDocumentContentProvider {
    static get SCHEME() {
        return "xmltree";
    }
    static buildUri(sourceUri) {
        let uriStr = `xmltree://${encodeURIComponent(sourceUri.toString())}`;
        let uri = vsc.Uri.parse(uriStr);
        return uri;
    }
    provideTextDocumentContent(uri) {
        return __awaiter(this, void 0, Promise, function* () {
            let sourceUri = vsc.Uri.parse(decodeURIComponent(uri.toString().substr(10)));
            let document = yield vsc.workspace.openTextDocument(sourceUri);
            let html = XmlTreeService_1.XmlTreeService.getXmlTreeHtml(document.getText());
            return Promise.resolve(html);
        });
    }
}
exports.XmlTreeDocumentContentProvider = XmlTreeDocumentContentProvider;
