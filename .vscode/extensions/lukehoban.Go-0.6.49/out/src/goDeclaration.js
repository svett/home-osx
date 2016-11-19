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
function definitionLocation(document, position, includeDocs) {
    if (includeDocs === void 0) { includeDocs = true; }
    return new Promise(function (resolve, reject) {
        var wordAtPosition = document.getWordRangeAtPosition(position);
        var offset = util_1.byteOffsetAt(document, position);
        var godef = goPath_1.getBinPath('godef');
        // Spawn `godef` process
        var p = cp.execFile(godef, ['-t', '-i', '-f', document.fileName, '-o', offset.toString()], {}, function (err, stdout, stderr) {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('godef');
                }
                if (err)
                    return resolve(null);
                var result = stdout.toString();
                var lines = result.split('\n');
                var match = /(.*):(\d+):(\d+)/.exec(lines[0]);
                if (!match) {
                    // TODO: Gotodef on pkg name:
                    // /usr/local/go/src/html/template\n
                    return resolve(null);
                }
                var _1 = match[0], file = match[1], line = match[2], col = match[3];
                var signature_1 = lines[1];
                var godoc = goPath_1.getBinPath('godoc');
                var pkgPath = path.dirname(file);
                var definitionInformation_1 = {
                    file: file,
                    line: +line - 1,
                    col: +col - 1,
                    lines: lines,
                    doc: undefined
                };
                if (!includeDocs) {
                    return resolve(definitionInformation_1);
                }
                cp.execFile(godoc, [pkgPath], {}, function (err, stdout, stderr) {
                    if (err && err.code === 'ENOENT') {
                        vscode.window.showInformationMessage('The "godoc" command is not available.');
                    }
                    var godocLines = stdout.toString().split('\n');
                    var doc = '';
                    var sigName = signature_1.substring(0, signature_1.indexOf(' '));
                    var sigParams = signature_1.substring(signature_1.indexOf(' func') + 5);
                    var searchSignature = 'func ' + sigName + sigParams;
                    for (var i = 0; i < godocLines.length; i++) {
                        if (godocLines[i] === searchSignature) {
                            while (godocLines[++i].startsWith('    ')) {
                                doc += godocLines[i].substring(4) + '\n';
                            }
                            break;
                        }
                    }
                    if (doc !== '') {
                        definitionInformation_1.doc = doc;
                    }
                    return resolve(definitionInformation_1);
                });
            }
            catch (e) {
                reject(e);
            }
        });
        p.stdin.end(document.getText());
    });
}
exports.definitionLocation = definitionLocation;
var GoDefinitionProvider = (function () {
    function GoDefinitionProvider() {
    }
    GoDefinitionProvider.prototype.provideDefinition = function (document, position, token) {
        return definitionLocation(document, position, false).then(function (definitionInfo) {
            if (definitionInfo == null)
                return null;
            var definitionResource = vscode.Uri.file(definitionInfo.file);
            var pos = new vscode.Position(definitionInfo.line, definitionInfo.col);
            return new vscode.Location(definitionResource, pos);
        });
    };
    return GoDefinitionProvider;
}());
exports.GoDefinitionProvider = GoDefinitionProvider;
//# sourceMappingURL=goDeclaration.js.map