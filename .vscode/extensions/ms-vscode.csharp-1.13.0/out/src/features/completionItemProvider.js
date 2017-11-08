/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const documentation_1 = require("./documentation");
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const vscode_1 = require("vscode");
class OmniSharpCompletionItemProvider extends abstractProvider_1.default {
    provideCompletionItems(document, position, token, context) {
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
        if (context.triggerKind == vscode_1.CompletionTriggerKind.TriggerCharacter) {
            req.TriggerCharacter = context.triggerCharacter;
        }
        return serverUtils.autoComplete(this._server, req).then(responses => {
            if (!responses) {
                return;
            }
            let result = [];
            let completions = Object.create(null);
            // transform AutoCompleteResponse to CompletionItem and
            // group by code snippet
            for (let response of responses) {
                let completion = new vscode_1.CompletionItem(response.CompletionText);
                completion.detail = response.ReturnType
                    ? `${response.ReturnType} ${response.DisplayText}`
                    : response.DisplayText;
                completion.documentation = documentation_1.extractSummaryText(response.Description);
                completion.kind = _kinds[response.Kind] || vscode_1.CompletionItemKind.Property;
                completion.insertText = response.CompletionText.replace(/<>/g, '');
                completion.commitCharacters = response.IsSuggestionMode
                    ? OmniSharpCompletionItemProvider.CommitCharactersWithoutSpace
                    : OmniSharpCompletionItemProvider.AllCommitCharacters;
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
            // for short completions (up to 1 character), treat the list as incomplete
            // because the server has likely witheld some matches due to performance constraints
            return new vscode_1.CompletionList(result, wordToComplete.length > 1 ? false : true);
        });
    }
}
// copied from Roslyn here: https://github.com/dotnet/roslyn/blob/6e8f6d600b6c4bc0b92bc3d782a9e0b07e1c9f8e/src/Features/Core/Portable/Completion/CompletionRules.cs#L166-L169
OmniSharpCompletionItemProvider.AllCommitCharacters = [
    ' ', '{', '}', '[', ']', '(', ')', '.', ',', ':',
    ';', '+', '-', '*', '/', '%', '&', '|', '^', '!',
    '~', '=', '<', '>', '?', '@', '#', '\'', '\"', '\\'
];
OmniSharpCompletionItemProvider.CommitCharactersWithoutSpace = [
    '{', '}', '[', ']', '(', ')', '.', ',', ':',
    ';', '+', '-', '*', '/', '%', '&', '|', '^', '!',
    '~', '=', '<', '>', '?', '@', '#', '\'', '\"', '\\'
];
exports.default = OmniSharpCompletionItemProvider;
const _kinds = Object.create(null);
// types
_kinds['Class'] = vscode_1.CompletionItemKind.Class;
_kinds['Delegate'] = vscode_1.CompletionItemKind.Class; // need a better option for this.
_kinds['Enum'] = vscode_1.CompletionItemKind.Enum;
_kinds['Interface'] = vscode_1.CompletionItemKind.Interface;
_kinds['Struct'] = vscode_1.CompletionItemKind.Struct;
// variables
_kinds['Local'] = vscode_1.CompletionItemKind.Variable;
_kinds['Parameter'] = vscode_1.CompletionItemKind.Variable;
_kinds['RangeVariable'] = vscode_1.CompletionItemKind.Variable;
// members
_kinds['Const'] = vscode_1.CompletionItemKind.Constant;
_kinds['EnumMember'] = vscode_1.CompletionItemKind.EnumMember;
_kinds['Event'] = vscode_1.CompletionItemKind.Event;
_kinds['Field'] = vscode_1.CompletionItemKind.Field;
_kinds['Method'] = vscode_1.CompletionItemKind.Method;
_kinds['Property'] = vscode_1.CompletionItemKind.Property;
// other stuff
_kinds['Label'] = vscode_1.CompletionItemKind.Unit; // need a better option for this.
_kinds['Keyword'] = vscode_1.CompletionItemKind.Keyword;
_kinds['Namespace'] = vscode_1.CompletionItemKind.Module;
//# sourceMappingURL=completionItemProvider.js.map