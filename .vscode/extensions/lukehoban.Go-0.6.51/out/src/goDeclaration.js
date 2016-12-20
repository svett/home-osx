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
var util_2 = require('./util');
function definitionLocation(document, position, toolForDocs, includeDocs) {
    if (includeDocs === void 0) { includeDocs = true; }
    return util_2.getGoVersion().then(function (ver) {
        // If no Go version can be parsed, it means it's a non-tagged one.
        // Assume it's > Go 1.5
        if (toolForDocs === 'godoc' || (ver && (ver.major < 1 || (ver.major === 1 && ver.minor < 6)))) {
            return definitionLocation_godef(document, position, includeDocs);
        }
        return definitionLocation_gogetdoc(document, position);
    });
}
exports.definitionLocation = definitionLocation;
function definitionLocation_godef(document, position, includeDocs) {
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
                    return reject();
                }
                if (err) {
                    return reject(err);
                }
                ;
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
                    column: +col - 1,
                    declarationlines: lines.splice(1),
                    toolUsed: 'godef',
                    doc: null,
                    name: null
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
function definitionLocation_gogetdoc(document, position) {
    return new Promise(function (resolve, reject) {
        var wordAtPosition = document.getWordRangeAtPosition(position);
        var offset = util_1.byteOffsetAt(document, position);
        var gogetdoc = goPath_1.getBinPath('gogetdoc');
        var p = cp.execFile(gogetdoc, ['-u', '-json', '-modified', '-pos', document.fileName + ':#' + offset.toString()], {}, function (err, stdout, stderr) {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('gogetdoc');
                    return reject();
                }
                if (err) {
                    return reject(err);
                }
                ;
                var goGetDocOutput = JSON.parse(stdout.toString());
                var match = /(.*):(\d+):(\d+)/.exec(goGetDocOutput.pos);
                var definitionInfo = {
                    file: null,
                    line: 0,
                    column: 0,
                    toolUsed: 'gogetdoc',
                    declarationlines: goGetDocOutput.decl.split('\n'),
                    doc: goGetDocOutput.doc,
                    name: goGetDocOutput.name
                };
                if (!match) {
                    return resolve(definitionInfo);
                }
                var _2 = match[0], file = match[1], line = match[2], col = match[3];
                definitionInfo.file = match[1];
                definitionInfo.line = +match[2] - 1;
                definitionInfo.column = +match[3] - 1;
                return resolve(definitionInfo);
            }
            catch (e) {
                reject(e);
            }
        });
        var documentText = document.getText();
        var documentArchive = document.fileName + '\n';
        documentArchive = documentArchive + Buffer.byteLength(documentText) + '\n';
        documentArchive = documentArchive + documentText;
        p.stdin.end(documentArchive);
    });
}
var GoDefinitionProvider = (function () {
    function GoDefinitionProvider(toolForDocs) {
        this.toolForDocs = 'godoc';
        this.toolForDocs = toolForDocs;
    }
    GoDefinitionProvider.prototype.provideDefinition = function (document, position, token) {
        return definitionLocation(document, position, this.toolForDocs, false).then(function (definitionInfo) {
            if (definitionInfo == null || definitionInfo.file == null)
                return null;
            var definitionResource = vscode.Uri.file(definitionInfo.file);
            var pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
            return new vscode.Location(definitionResource, pos);
        }, function (err) {
            if (err) {
                console.log(err);
            }
            return Promise.resolve(null);
        });
    };
    return GoDefinitionProvider;
}());
exports.GoDefinitionProvider = GoDefinitionProvider;
//# sourceMappingURL=goDeclaration.js.map