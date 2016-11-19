/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
var diffUtils_1 = require('../src/diffUtils');
var goInstallTools_1 = require('./goInstallTools');
var GoRenameProvider = (function () {
    function GoRenameProvider() {
    }
    GoRenameProvider.prototype.provideRenameEdits = function (document, position, newName, token) {
        var _this = this;
        return vscode.workspace.saveAll(false).then(function () {
            return _this.doRename(document, position, newName, token);
        });
    };
    GoRenameProvider.prototype.doRename = function (document, position, newName, token) {
        return new Promise(function (resolve, reject) {
            var filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            var range = document.getWordRangeAtPosition(position);
            var pos = range ? range.start : position;
            var offset = util_1.byteOffsetAt(document, pos);
            var gorename = goPath_1.getBinPath('gorename');
            var buildTags = '"' + vscode.workspace.getConfiguration('go')['buildTags'] + '"';
            var gorenameArgs = ['-offset', filename + ':#' + offset, '-to', newName, '-tags', buildTags];
            var canRenameToolUseDiff = diffUtils_1.isDiffToolAvailable();
            if (canRenameToolUseDiff) {
                gorenameArgs.push('-d');
            }
            cp.execFile(gorename, gorenameArgs, {}, function (err, stdout, stderr) {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('gorename');
                        return resolve(null);
                    }
                    if (err)
                        return reject('Cannot rename due to errors: ' + stderr);
                    var result_1 = new vscode.WorkspaceEdit();
                    if (canRenameToolUseDiff) {
                        var filePatches = diffUtils_1.getEditsFromUnifiedDiffStr(stdout);
                        filePatches.forEach(function (filePatch) {
                            var fileUri = vscode.Uri.file(filePatch.fileName);
                            filePatch.edits.forEach(function (edit) {
                                edit.applyUsingWorkspaceEdit(result_1, fileUri);
                            });
                        });
                    }
                    return resolve(result_1);
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    };
    return GoRenameProvider;
}());
exports.GoRenameProvider = GoRenameProvider;
//# sourceMappingURL=goRename.js.map