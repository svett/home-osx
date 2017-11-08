/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const jsonc_parser_1 = require("jsonc-parser");
const projectJSONContribution_1 = require("./projectJSONContribution");
const request_light_1 = require("request-light");
const vscode_1 = require("vscode");
function addJSONProviders() {
    let subscriptions = [];
    // configure the XHR library with the latest proxy settings
    function configureHttpRequest() {
        let httpSettings = vscode_1.workspace.getConfiguration('http');
        request_light_1.configure(httpSettings.get('proxy'), httpSettings.get('proxyStrictSSL'));
    }
    configureHttpRequest();
    subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(e => configureHttpRequest()));
    // register completion and hove providers for JSON setting file(s)
    let contributions = [new projectJSONContribution_1.ProjectJSONContribution(request_light_1.xhr)];
    contributions.forEach(contribution => {
        let selector = contribution.getDocumentSelector();
        let triggerCharacters = ['"', ':', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        subscriptions.push(vscode_1.languages.registerCompletionItemProvider(selector, new JSONCompletionItemProvider(contribution), ...triggerCharacters));
        subscriptions.push(vscode_1.languages.registerHoverProvider(selector, new JSONHoverProvider(contribution)));
    });
    return vscode_1.Disposable.from(...subscriptions);
}
exports.addJSONProviders = addJSONProviders;
class JSONHoverProvider {
    constructor(jsonContribution) {
        this.jsonContribution = jsonContribution;
    }
    provideHover(document, position, token) {
        let offset = document.offsetAt(position);
        let location = jsonc_parser_1.getLocation(document.getText(), offset);
        let node = location.previousNode;
        if (node && node.offset <= offset && offset <= node.offset + node.length) {
            let promise = this.jsonContribution.getInfoContribution(document.fileName, location);
            if (promise) {
                return promise.then(htmlContent => {
                    let range = new vscode_1.Range(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
                    let result = {
                        contents: htmlContent,
                        range: range
                    };
                    return result;
                });
            }
        }
        return null;
    }
}
exports.JSONHoverProvider = JSONHoverProvider;
class JSONCompletionItemProvider {
    constructor(jsonContribution) {
        this.jsonContribution = jsonContribution;
    }
    resolveCompletionItem(item, token) {
        if (this.jsonContribution.resolveSuggestion) {
            let resolver = this.jsonContribution.resolveSuggestion(item);
            if (resolver) {
                return resolver;
            }
        }
        return Promise.resolve(item);
    }
    provideCompletionItems(document, position, token) {
        let currentWord = this.getCurrentWord(document, position);
        let overwriteRange = null;
        let items = [];
        let isIncomplete = false;
        let offset = document.offsetAt(position);
        let location = jsonc_parser_1.getLocation(document.getText(), offset);
        let node = location.previousNode;
        if (node && node.offset <= offset && offset <= node.offset + node.length && (node.type === 'property' || node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
            overwriteRange = new vscode_1.Range(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
        }
        else {
            overwriteRange = new vscode_1.Range(document.positionAt(offset - currentWord.length), position);
        }
        let proposed = {};
        let collector = {
            add: (suggestion) => {
                if (!proposed[suggestion.label]) {
                    proposed[suggestion.label] = true;
                    if (overwriteRange) {
                        suggestion.textEdit = vscode_1.TextEdit.replace(overwriteRange, suggestion.insertText);
                    }
                    items.push(suggestion);
                }
            },
            setAsIncomplete: () => isIncomplete = true,
            error: (message) => console.error(message),
            log: (message) => console.log(message)
        };
        let collectPromise = null;
        if (location.isAtPropertyKey) {
            let addValue = !location.previousNode || !location.previousNode.columnOffset && (offset == (location.previousNode.offset + location.previousNode.length));
            let scanner = jsonc_parser_1.createScanner(document.getText(), true);
            scanner.setPosition(offset);
            scanner.scan();
            let isLast = scanner.getToken() === jsonc_parser_1.SyntaxKind.CloseBraceToken || scanner.getToken() === jsonc_parser_1.SyntaxKind.EOF;
            collectPromise = this.jsonContribution.collectPropertySuggestions(document.fileName, location, currentWord, addValue, isLast, collector);
        }
        else {
            if (location.path.length === 0) {
                collectPromise = this.jsonContribution.collectDefaultSuggestions(document.fileName, collector);
            }
            else {
                collectPromise = this.jsonContribution.collectValueSuggestions(document.fileName, location, collector);
            }
        }
        if (collectPromise) {
            return collectPromise.then(() => {
                if (items.length > 0) {
                    return new vscode_1.CompletionList(items, isIncomplete);
                }
                return null;
            });
        }
        return null;
    }
    getCurrentWord(document, position) {
        let i = position.character - 1;
        let text = document.lineAt(position.line).text;
        while (i >= 0 && ' \t\n\r\v":{[,'.indexOf(text.charAt(i)) === -1) {
            i--;
        }
        return text.substring(i + 1, position.character);
    }
}
exports.JSONCompletionItemProvider = JSONCompletionItemProvider;
//# sourceMappingURL=jsonContributions.js.map