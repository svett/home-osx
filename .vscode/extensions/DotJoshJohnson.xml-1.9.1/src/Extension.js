'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vsc = require("vscode");
const Commands_1 = require("./Commands");
const Formatting_1 = require("./providers/Formatting");
const Linting_1 = require("./providers/Linting");
const Completion_1 = require("./providers/Completion");
const XmlTreeView_1 = require("./providers/XmlTreeView");
const LANG_XML = 'xml';
const LANG_XSL = 'xsl';
const LANG_XQUERY = 'xquery;';
const MEM_QUERY_HISTORY = 'xpathQueryHistory';
function activate(ctx) {
    console.log('activate extension');
    exports.GlobalState = ctx.globalState;
    exports.WorkspaceState = ctx.workspaceState;
    ctx.subscriptions.push(vsc.commands.registerTextEditorCommand('xmlTools.minifyXml', Commands_1.TextEditorCommands.minifyXml), vsc.commands.registerTextEditorCommand('xmlTools.evaluateXPath', Commands_1.TextEditorCommands.evaluateXPath), vsc.commands.registerTextEditorCommand('xmlTools.executeXQuery', Commands_1.TextEditorCommands.executeXQuery), vsc.commands.registerTextEditorCommand('xmlTools.formatAsXml', Commands_1.TextEditorCommands.formatAsXml));
    ctx.subscriptions.push(vsc.languages.registerDocumentFormattingEditProvider([LANG_XML, LANG_XSL], new Formatting_1.XmlFormattingEditProvider()), vsc.languages.registerDocumentRangeFormattingEditProvider([LANG_XML, LANG_XSL], new Formatting_1.XmlFormattingEditProvider()), vsc.languages.registerCompletionItemProvider(LANG_XQUERY, new Completion_1.XQueryCompletionItemProvider(), ':', '$'));
    ctx.subscriptions.push(vsc.window.onDidChangeActiveTextEditor(_handleChangeActiveTextEditor), vsc.window.onDidChangeTextEditorSelection(_handleChangeTextEditorSelection));
    ctx.subscriptions.push(vsc.window.registerTreeDataProvider("xmlTreeView", new XmlTreeView_1.XmlTreeViewDataProvider(ctx)));
}
exports.activate = activate;
function deactivate() {
    let memento = exports.WorkspaceState || exports.GlobalState;
    let history = memento.get(MEM_QUERY_HISTORY, []);
    history.splice(0);
    memento.update(MEM_QUERY_HISTORY, history);
}
exports.deactivate = deactivate;
function _handleContextChange(editor) {
    if (!editor || !editor.document) {
        return;
    }
    switch (editor.document.languageId) {
        case 'xquery':
            Linting_1.XQueryLintingFeatureProvider.provideXQueryDiagnostics(editor);
            break;
    }
}
function _handleChangeActiveTextEditor(editor) {
    _handleContextChange(editor);
}
function _handleChangeTextEditorSelection(e) {
    _handleContextChange(e.textEditor);
}
