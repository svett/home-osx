/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var path = require('path');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
var goInstallTools_1 = require('./goInstallTools');
var GoReferenceProvider = (function () {
    function GoReferenceProvider() {
    }
    GoReferenceProvider.prototype.provideReferences = function (document, position, options, token) {
        var _this = this;
        return vscode.workspace.saveAll(false).then(function () {
            return _this.doFindReferences(document, position, options, token);
        });
    };
    GoReferenceProvider.prototype.doFindReferences = function (document, position, options, token) {
        return new Promise(function (resolve, reject) {
            var filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
            var cwd = path.dirname(filename);
            // get current word
            var wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return resolve([]);
            }
            var offset = util_1.byteOffsetAt(document, position);
            var goGuru = goPath_1.getBinPath('guru');
            var buildTags = '"' + vscode.workspace.getConfiguration('go')['buildTags'] + '"';
            var process = cp.execFile(goGuru, ['-tags', buildTags, 'referrers', (filename + ":#" + offset.toString())], {}, function (err, stdout, stderr) {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return resolve(null);
                    }
                    var lines = stdout.toString().split('\n');
                    var results = [];
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i];
                        var match = /^(.*):(\d+)\.(\d+)-(\d+)\.(\d+):/.exec(lines[i]);
                        if (!match)
                            continue;
                        var _1 = match[0], file = match[1], lineStartStr = match[2], colStartStr = match[3], lineEndStr = match[4], colEndStr = match[5];
                        var referenceResource = vscode.Uri.file(path.resolve(cwd, file));
                        var range = new vscode.Range(+lineStartStr - 1, +colStartStr - 1, +lineEndStr - 1, +colEndStr);
                        results.push(new vscode.Location(referenceResource, range));
                    }
                    resolve(results);
                }
                catch (e) {
                    reject(e);
                }
            });
            token.onCancellationRequested(function () {
                return process.kill();
            });
        });
    };
    return GoReferenceProvider;
}());
exports.GoReferenceProvider = GoReferenceProvider;
//# sourceMappingURL=goReferences.js.map