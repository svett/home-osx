/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const abstractProvider_1 = require("./abstractProvider");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const serverUtils = require("../omnisharp/utils");
class OmnisharpCodeActionProvider extends abstractProvider_1.default {
    constructor(server) {
        super(server);
        this._commandId = 'omnisharp.runCodeAction';
        this._updateEnablement();
        let d1 = vscode_1.workspace.onDidChangeConfiguration(this._updateEnablement, this);
        let d2 = vscode_1.commands.registerCommand(this._commandId, this._runCodeAction, this);
        this._disposables.push(d1, d2);
    }
    _updateEnablement() {
        let value = vscode_1.workspace.getConfiguration().get('csharp.disableCodeActions', false);
        this._disabled = value;
    }
    provideCodeActions(document, range, context, token) {
        if (this._disabled) {
            return;
        }
        let req = {
            Filename: document.fileName,
            Selection: OmnisharpCodeActionProvider._asRange(range)
        };
        return serverUtils.getCodeActions(this._server, req, token).then(response => {
            return response.CodeActions.map(codeAction => {
                return {
                    title: codeAction.Name,
                    command: this._commandId,
                    arguments: [{
                            Filename: document.fileName,
                            Selection: OmnisharpCodeActionProvider._asRange(range),
                            Identifier: codeAction.Identifier,
                            WantsTextChanges: true
                        }]
                };
            });
        }, (error) => {
            return Promise.reject(`Problem invoking 'GetCodeActions' on OmniSharp server: ${error}`);
        });
    }
    _runCodeAction(req) {
        return serverUtils.runCodeAction(this._server, req).then(response => {
            if (response && Array.isArray(response.Changes)) {
                let edit = new vscode_1.WorkspaceEdit();
                for (let change of response.Changes) {
                    let uri = vscode_1.Uri.file(change.FileName);
                    let edits = [];
                    for (let textChange of change.Changes) {
                        edits.push(vscode_1.TextEdit.replace(typeConvertion_1.toRange2(textChange), textChange.NewText));
                    }
                    edit.set(uri, edits);
                }
                return vscode_1.workspace.applyEdit(edit);
            }
        }, (error) => {
            return Promise.reject('Problem invoking \'RunCodeAction\' on OmniSharp server: ' + error);
        });
    }
    static _asRange(range) {
        let { start, end } = range;
        return {
            Start: { Line: start.line + 1, Column: start.character + 1 },
            End: { Line: end.line + 1, Column: end.character + 1 }
        };
    }
}
exports.default = OmnisharpCodeActionProvider;
//# sourceMappingURL=codeActionProvider.js.map