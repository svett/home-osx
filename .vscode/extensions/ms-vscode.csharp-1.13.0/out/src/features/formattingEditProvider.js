/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const vscode_1 = require("vscode");
class FormattingSupport extends abstractProvider_1.default {
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        let request = {
            FileName: document.fileName,
            Line: range.start.line + 1,
            Column: range.start.character + 1,
            EndLine: range.end.line + 1,
            EndColumn: range.end.character + 1
        };
        return serverUtils.formatRange(this._server, request, token).then(res => {
            if (res && Array.isArray(res.Changes)) {
                return res.Changes.map(FormattingSupport._asEditOptionation);
            }
        });
    }
    provideOnTypeFormattingEdits(document, position, ch, options, token) {
        let request = {
            FileName: document.fileName,
            Line: position.line + 1,
            Column: position.character + 1,
            Character: ch
        };
        return serverUtils.formatAfterKeystroke(this._server, request, token).then(res => {
            if (res && Array.isArray(res.Changes)) {
                return res.Changes.map(FormattingSupport._asEditOptionation);
            }
        });
    }
    static _asEditOptionation(change) {
        return new vscode_1.TextEdit(new vscode_1.Range(change.StartLine - 1, change.StartColumn - 1, change.EndLine - 1, change.EndColumn - 1), change.NewText);
    }
}
exports.default = FormattingSupport;
//# sourceMappingURL=formattingEditProvider.js.map