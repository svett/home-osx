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
            if (canFormatToolUseDiff && formatFlags.indexOf('-d') === -1) {
                formatFlags.push('-d');
            }
            // We ignore the -w flag that updates file on disk because that would break undo feature
            if (formatFlags.indexOf('-w') > -1) {
                formatFlags.splice(formatFlags.indexOf('-w'), 1);
            }
            cp.execFile(formatCommandBinPath, formatFlags.concat([filename]), {}, function (err, stdout, stderr) {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool(_this.formatCommand);
                        return resolve(null);
                    }
                    if (err) {
                        console.log(err);
                        return reject('Cannot format due to syntax errors.');
                    }
                    ;
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
        var _this = this;
        return document.save().then(function () {
            return _this.formatter.formatDocument(document);
        });
    };
    return GoDocumentFormattingEditProvider;
}());
exports.GoDocumentFormattingEditProvider = GoDocumentFormattingEditProvider;
// package main; import \"fmt\"; func main() {fmt.Print(\"Hello\")}
// package main; import \"fmt\"; import \"math\"; func main() {fmt.Print(\"Hello\")}
// package main; import \"fmt\"; import \"gopkg.in/Shopify/sarama.v1\"; func main() {fmt.Print(sarama.V0_10_0_0)}
//# sourceMappingURL=goFormat.js.map