/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const diffUtils_1 = require("./diffUtils");
const goInstallTools_1 = require("./goInstallTools");
const util_1 = require("./util");
class Formatter {
    formatDocument(document) {
        return new Promise((resolve, reject) => {
            let filename = document.fileName;
            let formatTool = vscode.workspace.getConfiguration('go')['formatTool'] || 'goreturns';
            let formatCommandBinPath = util_1.getBinPath(formatTool);
            let formatFlags = vscode.workspace.getConfiguration('go')['formatFlags'] || [];
            let canFormatToolUseDiff = vscode.workspace.getConfiguration('go')['useDiffForFormatting'] && diffUtils_1.isDiffToolAvailable();
            if (canFormatToolUseDiff && formatFlags.indexOf('-d') === -1) {
                formatFlags.push('-d');
            }
            // We ignore the -w flag that updates file on disk because that would break undo feature
            if (formatFlags.indexOf('-w') > -1) {
                formatFlags.splice(formatFlags.indexOf('-w'), 1);
            }
            let t0 = Date.now();
            let env = util_1.getToolsEnvVars();
            cp.execFile(formatCommandBinPath, [...formatFlags, filename], { env }, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool(formatTool);
                        return resolve(null);
                    }
                    if (err) {
                        console.log(err);
                        return reject('Cannot format due to syntax errors.');
                    }
                    ;
                    let textEdits = [];
                    let filePatch = canFormatToolUseDiff ? diffUtils_1.getEditsFromUnifiedDiffStr(stdout)[0] : diffUtils_1.getEdits(filename, document.getText(), stdout);
                    filePatch.edits.forEach((edit) => {
                        textEdits.push(edit.apply());
                    });
                    let timeTaken = Date.now() - t0;
                    util_1.sendTelemetryEvent('format', { tool: formatTool }, { timeTaken });
                    return resolve(textEdits);
                }
                catch (e) {
                    reject('Internal issues while getting diff from formatted content');
                }
            });
        });
    }
}
exports.Formatter = Formatter;
class GoDocumentFormattingEditProvider {
    constructor() {
        this.formatter = new Formatter();
    }
    provideDocumentFormattingEdits(document, options, token) {
        return document.save().then(() => {
            return this.formatter.formatDocument(document);
        });
    }
}
exports.GoDocumentFormattingEditProvider = GoDocumentFormattingEditProvider;
//# sourceMappingURL=goFormat.js.map