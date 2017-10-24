"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_1 = require("vscode");
var child_process_1 = require("child_process");
var dash_1 = require("./dash");
var os_1 = require("os");
var OS = os_1.platform();
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.specific', function () {
        searchSpecific();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.all', function () {
        searchAll();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.emptySyntax', function () {
        searchEmptySyntax();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('extension.dash.customSyntax', function () {
        searchCustomWithSyntax();
    }));
}
exports.activate = activate;
/**
 * Search in dash for selection syntax documentation
 */
function searchSpecific() {
    var editor = getEditor();
    var query = getSelectedText(editor);
    var languageId = editor.document.languageId;
    var docsets = getDocsets(languageId);
    var dash = new dash_1.Dash(OS);
    child_process_1.exec(dash.getCommand(query, docsets));
}
/**
 * Search in dash for all documentation
 */
function searchAll() {
    var editor = getEditor();
    var query = getSelectedText(editor);
    var dash = new dash_1.Dash(OS);
    child_process_1.exec(dash.getCommand(query));
}
/**
 * Search in dash for editor syntax documentation
 */
function searchEmptySyntax() {
    var editor = getEditor();
    var query = '';
    var languageId = editor.document.languageId;
    var docsets = getDocsets(languageId);
    var dash = new dash_1.Dash(OS);
    child_process_1.exec(dash.getCommand(query, docsets));
}
/**
 * Search in dash for editor syntax documentation with a custom query
 */
function searchCustomWithSyntax() {
    var editor = getEditor();
    var languageId = editor.document.languageId;
    var docsets = getDocsets(languageId);
    var dash = new dash_1.Dash(OS);
    var inputOptions = {
        placeHolder: 'Something to search in Dash.',
        prompt: 'Enter something to search for in Dash.',
    };
    vscode_1.window.showInputBox(inputOptions).then(function (query) {
        if (query) {
            // If they actually input code
            child_process_1.exec(dash.getCommand(query, docsets)); // Open it in dash
        }
    });
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