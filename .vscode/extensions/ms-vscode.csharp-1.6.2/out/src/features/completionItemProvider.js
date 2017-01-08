/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
const documentation_1 = require("./documentation");
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const vscode_1 = require("vscode");
class OmniSharpCompletionItemProvider extends abstractProvider_1.default {
    provideCompletionItems(document, position, token) {
        let wordToComplete = '';
        let range = document.getWordRangeAtPosition(position);
        if (range) {
            wordToComplete = document.getText(new vscode_1.Range(range.start, position));
        }
        let req = typeConvertion_1.createRequest(document, position);
        req.WordToComplete = wordToComplete;
        req.WantDocumentationForEveryCompletionResult = true;
        req.WantKind = true;
        req.WantReturnType = true;
        return serverUtils.autoComplete(this._server, req).then(values => {
            if (!values) {
                return;
            }
            let result = [];
            let completions = Object.create(null);
            // transform AutoCompleteResponse to CompletionItem and
            // group by code snippet
            for (let value of values) {
                let completion = new vscode_1.CompletionItem(value.CompletionText.replace(/\(|\)|<|>/g, ''));
                completion.detail = value.ReturnType ? `${value.ReturnType} ${value.DisplayText}` : value.DisplayText;
                completion.documentation = documentation_1.extractSummaryText(value.Description);
                completion.kind = _kinds[value.Kind] || vscode_1.CompletionItemKind.Property;
                let array = completions[completion.label];
                if (!array) {
                    completions[completion.label] = [completion];
                }
                else {
                    array.push(completion);
                }
            }
            // per suggestion group, select on and indicate overloads
            for (let key in completions) {
                let suggestion = completions[key][0], overloadCount = completions[key].length - 1;
                if (overloadCount === 0) {
                    // remove non overloaded items
                    delete completions[key];
                }
                else {
                    // indicate that there is more
                    suggestion.detail = `${suggestion.detail} (+ ${overloadCount} overload(s))`;
                }
                result.push(suggestion);
            }
            return result;
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OmniSharpCompletionItemProvider;
const _kinds = Object.create(null);
_kinds['Variable'] = vscode_1.CompletionItemKind.Variable;
_kinds['Struct'] = vscode_1.CompletionItemKind.Interface;
_kinds['Interface'] = vscode_1.CompletionItemKind.Interface;
_kinds['Enum'] = vscode_1.CompletionItemKind.Enum;
_kinds['EnumMember'] = vscode_1.CompletionItemKind.Property;
_kinds['Property'] = vscode_1.CompletionItemKind.Property;
_kinds['Class'] = vscode_1.CompletionItemKind.Class;
_kinds['Field'] = vscode_1.CompletionItemKind.Field;
_kinds['EventField'] = vscode_1.CompletionItemKind.File;
_kinds['Method'] = vscode_1.CompletionItemKind.Method;
//# sourceMappingURL=completionItemProvider.js.map