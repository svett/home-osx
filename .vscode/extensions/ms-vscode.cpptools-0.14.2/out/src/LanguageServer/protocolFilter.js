'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
function createProtocolFilter(me, clients) {
    let defaultHandler = (data, callback) => { if (clients.ActiveClient === me)
        callback(data); };
    let invoke1 = (a, callback) => { if (clients.ActiveClient === me) {
        return callback(a);
    } return null; };
    let invoke2 = (a, b, callback) => { if (clients.ActiveClient === me) {
        return callback(a, b);
    } return null; };
    let invoke3 = (a, b, c, callback) => { if (clients.ActiveClient === me) {
        return callback(a, b, c);
    } return null; };
    let invoke4 = (a, b, c, d, callback) => { if (clients.ActiveClient === me) {
        return callback(a, b, c, d);
    } return null; };
    let invoke5 = (a, b, c, d, e, callback) => { if (clients.ActiveClient === me) {
        return callback(a, b, c, d, e);
    } return null; };
    return {
        didOpen: (document, sendMessage) => {
            if (clients.checkOwnership(me, document)) {
                me.TrackedDocuments.add(document);
                sendMessage(document);
            }
        },
        didChange: defaultHandler,
        willSave: defaultHandler,
        willSaveWaitUntil: (event, sendMessage) => {
            if (clients.ActiveClient === me) {
                return sendMessage(event);
            }
            return Promise.resolve([]);
        },
        didSave: defaultHandler,
        didClose: (document, sendMessage) => {
            if (clients.ActiveClient === me) {
                console.assert(me.TrackedDocuments.has(document));
                me.TrackedDocuments.delete(document);
                sendMessage(document);
            }
        },
        provideCompletionItem: invoke3,
        resolveCompletionItem: invoke2,
        provideHover: invoke3,
        provideSignatureHelp: invoke3,
        provideDefinition: invoke3,
        provideReferences: invoke4,
        provideDocumentHighlights: invoke3,
        provideDocumentSymbols: invoke2,
        provideWorkspaceSymbols: invoke2,
        provideCodeActions: invoke4,
        provideCodeLenses: invoke2,
        resolveCodeLens: invoke2,
        provideDocumentFormattingEdits: invoke3,
        provideDocumentRangeFormattingEdits: invoke4,
        provideOnTypeFormattingEdits: invoke5,
        provideRenameEdits: invoke4,
        provideDocumentLinks: invoke2,
        resolveDocumentLink: invoke2,
    };
}
exports.createProtocolFilter = createProtocolFilter;
//# sourceMappingURL=protocolFilter.js.map