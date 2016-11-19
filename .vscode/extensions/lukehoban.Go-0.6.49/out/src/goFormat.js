/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var diffUtils_1 = require('../src/diffUtils');
var goPath_1 = require('./goPath');
var goInstallTools_1 = require('./goInstallTools');
var Formatter = (function () {
    function Formatter() {
        this.formatCommand = 'goreturns';
        var formatTool = vscode.workspace.getConfiguration('go')['formatTool'];
        if (formatTool) {
            this.formatCommand = formatTool;
        }
    }
    Formatter.prototype.formatDocument = function (document) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var filename = document.fileName;
            var formatCommandBinPath = goPath_1.getBinPath(_this.formatCommand);
            var formatFlags = vscode.workspace.getConfiguration('go')['formatFlags'] || [];
            var canFormatToolUseDiff = vscode.workspace.getConfiguration('go')['useDiffForFormatting'] && diffUtils_1.isDiffToolAvailable();
            if (canFormatToolUseDiff) {
                formatFlags.push('-d');
            }
            var childProcess = cp.execFile(formatCommandBinPath, formatFlags.slice(), {}, function (err, stdout, stderr) {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool(_this.formatCommand);
                        return resolve(null);
                    }
                    if (err)
                        return reject('Cannot format due to syntax errors.');
                    var textEdits_1 = [];
                    var filePatch = canFormatToolUseDiff ? diffUtils_1.getEditsFromUnifiedDiffStr(stdout)[0] : diffUtils_1.getEdits(filename, document.getText(), stdout);
                    filePatch.edits.forEach(function (edit) {
                        textEdits_1.push(edit.apply());
                    });
                    return resolve(textEdits_1);
                }
                catch (e) {
                    reject('Internal issues while getting diff from formatted content');
                }
            });
            childProcess.stdin.end(document.getText());
        });
    };
    return Formatter;
}());
exports.Formatter = Formatter;
var GoDocumentFormattingEditProvider = (function () {
    function GoDocumentFormattingEditProvider() {
        this.formatter = new Formatter();
    }
    GoDocumentFormattingEditProvider.prototype.provideDocumentFormattingEdits = function (document, options, token) {
        return this.formatter.formatDocument(document);
    };
    return GoDocumentFormattingEditProvider;
}());
exports.GoDocumentFormattingEditProvider = GoDocumentFormattingEditProvider;
//# sourceMappingURL=goFormat.js.map