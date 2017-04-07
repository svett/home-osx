/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
class GoReferenceProvider {
    provideReferences(document, position, options, token) {
        return vscode.workspace.saveAll(false).then(() => {
            return this.doFindReferences(document, position, options, token);
        });
    }
    doFindReferences(document, position, options, token) {
        return new Promise((resolve, reject) => {
            let filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            let cwd = path.dirname(filename);
            // get current word
            let wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return resolve([]);
            }
            let offset = util_1.byteOffsetAt(document, position);
            let goGuru = util_1.getBinPath('guru');
            let buildTags = '"' + vscode.workspace.getConfiguration('go')['buildTags'] + '"';
            let process = cp.execFile(goGuru, ['-tags', buildTags, 'referrers', `${filename}:#${offset.toString()}`], {}, (err, stdout, stderr) => {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return resolve(null);
                    }
                    if (err) {
                        console.log(err);
                        return resolve(null);
                    }
                    let lines = stdout.toString().split('\n');
                    let results = [];
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        let match = /^(.*):(\d+)\.(\d+)-(\d+)\.(\d+):/.exec(lines[i]);
                        if (!match)
                            continue;
                        let [_, file, lineStartStr, colStartStr, lineEndStr, colEndStr] = match;
                        let referenceResource = vscode.Uri.file(path.resolve(cwd, file));
                        let range = new vscode.Range(+lineStartStr - 1, +colStartStr - 1, +lineEndStr - 1, +colEndStr);
                        results.push(new vscode.Location(referenceResource, range));
                    }
                    resolve(results);
                }
                catch (e) {
                    reject(e);
                }
            });
            token.onCancellationRequested(() => process.kill());
        });
    }
}
exports.GoReferenceProvider = GoReferenceProvider;
//# sourceMappingURL=goReferences.js.map