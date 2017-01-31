/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const diffUtils_1 = require("../src/diffUtils");
const goInstallTools_1 = require("./goInstallTools");
class GoRenameProvider {
    provideRenameEdits(document, position, newName, token) {
        return vscode.workspace.saveAll(false).then(() => {
            return this.doRename(document, position, newName, token);
        });
    }
    doRename(document, position, newName, token) {
        return new Promise((resolve, reject) => {
            let filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            let range = document.getWordRangeAtPosition(position);
            let pos = range ? range.start : position;
            let offset = util_1.byteOffsetAt(document, pos);
            let gorename = util_1.getBinPath('gorename');
            let buildTags = '"' + vscode.workspace.getConfiguration('go')['buildTags'] + '"';
            let gorenameArgs = ['-offset', filename + ':#' + offset, '-to', newName, '-tags', buildTags];
            let canRenameToolUseDiff = diffUtils_1.isDiffToolAvailable();
            if (canRenameToolUseDiff) {
                gorenameArgs.push('-d');
            }
            cp.execFile(gorename, gorenameArgs, {}, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('gorename');
                        return resolve(null);
                    }
                    if (err)
                        return reject('Cannot rename due to errors: ' + stderr);
                    let result = new vscode.WorkspaceEdit();
                    if (canRenameToolUseDiff) {
                        let filePatches = diffUtils_1.getEditsFromUnifiedDiffStr(stdout);
                        filePatches.forEach((filePatch) => {
                            let fileUri = vscode.Uri.file(filePatch.fileName);
                            filePatch.edits.forEach((edit) => {
                                edit.applyUsingWorkspaceEdit(result, fileUri);
                            });
                        });
                    }
                    return resolve(result);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.GoRenameProvider = GoRenameProvider;
//# sourceMappingURL=goRename.js.map