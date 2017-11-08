/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const vscode_1 = require("vscode");
class OmnisharpRenameProvider extends abstractProvider_1.default {
    provideRenameEdits(document, position, newName, token) {
        let req = typeConvertion_1.createRequest(document, position);
        req.WantsTextChanges = true;
        req.RenameTo = newName;
        return serverUtils.rename(this._server, req, token).then(response => {
            if (!response) {
                return;
            }
            const edit = new vscode_1.WorkspaceEdit();
            response.Changes.forEach(change => {
                const uri = vscode_1.Uri.file(change.FileName);
                change.Changes.forEach(change => {
                    edit.replace(uri, new vscode_1.Range(change.StartLine - 1, change.StartColumn - 1, change.EndLine - 1, change.EndColumn - 1), change.NewText);
                });
            });
            return edit;
        });
    }
}
exports.default = OmnisharpRenameProvider;
//# sourceMappingURL=renameProvider.js.map