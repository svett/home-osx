var vscode_1 = require('vscode');
var child_process_1 = require('child_process');
var dash_1 = require('./dash');
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.specific', function () {
        searchSpecific();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.all', function () {
        searchAll();
    }));
}
exports.activate = activate;
/**
 * Search in dash for specific syntax documentation
 */
function searchSpecific() {
    var editor = getEditor();
    var query = getSelectedText(editor);
    var languageId = editor.document.languageId;
    var docsets = getDocsets(languageId);
    var dash = new dash_1.Dash();
    child_process_1.exec(dash.getCommand(query, docsets));
}
/**
 * Search in dash for all documentation
 */
function searchAll() {
    var editor = getEditor();
    var query = getSelectedText(editor);
    var dash = new dash_1.Dash();
    child_process_1.exec(dash.getCommand(query));
}
/**
 * Get vscode active editor
 *
 * @return {TextEditor}
 */
function getEditor() {
    var editor = vscode_1.window.activeTextEditor;
    if (!editor) {
        return;
    }
    return editor;
}
/**
 * Get selected text by selection or by cursor position
 *
 * @param {TextEditor} active editor
 * @return {string}
 */
function getSelectedText(editor) {
    var selection = editor.selection;
    var text = editor.document.getText(selection);
    if (!text) {
        var range = editor.document.getWordRangeAtPosition(selection.active);
        text = editor.document.getText(range);
    }
    return text;
}
/**
 * Get docset configuration
 *
 * @param {string} languageId e.g javascript, ruby
 * @return {Array<string>}
 */
function getDocsets(languageId) {
    var config = vscode_1.workspace.getConfiguration('dash.docset');
    if (config[languageId]) {
        return config[languageId];
    }
    return [];
}
//# sourceMappingURL=extension.js.map