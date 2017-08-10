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
const util_2 = require("./util");
const missingToolMsg = 'Missing tool: ';
function definitionLocation(document, position, goConfig, includeDocs = true) {
    let wordRange = document.getWordRangeAtPosition(position);
    let lineText = document.lineAt(position.line).text;
    let word = wordRange ? document.getText(wordRange) : '';
    if (!wordRange || lineText.startsWith('//') || util_2.isPositionInString(document, position) || word.match(/^\d+.?\d+$/) || util_2.goKeywords.indexOf(word) > 0) {
        return Promise.resolve(null);
    }
    if (!goConfig) {
        goConfig = vscode.workspace.getConfiguration('go');
    }
    let toolForDocs = goConfig['docsTool'] || 'godoc';
    let offset = util_1.byteOffsetAt(document, position);
    let env = util_2.getToolsEnvVars();
    return util_2.getGoVersion().then((ver) => {
        // If no Go version can be parsed, it means it's a non-tagged one.
        // Assume it's > Go 1.5
        if (toolForDocs === 'godoc' || (ver && (ver.major < 1 || (ver.major === 1 && ver.minor < 6)))) {
            return definitionLocation_godef(document, position, offset, includeDocs, env);
        }
        else if (toolForDocs === 'guru') {
            return definitionLocation_guru(document, position, offset, env);
        }
        return definitionLocation_gogetdoc(document, position, offset, env);
    });
}
exports.definitionLocation = definitionLocation;
function definitionLocation_godef(document, position, offset, includeDocs, env) {
    return new Promise((resolve, reject) => {
        let godef = util_1.getBinPath('godef');
        // Spawn `godef` process
        let p = cp.execFile(godef, ['-t', '-i', '-f', document.fileName, '-o', offset.toString()], { env }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + 'godef');
                }
                if (err) {
                    return reject(err);
                }
                ;
                let result = stdout.toString();
                let lines = result.split('\n');
                let match = /(.*):(\d+):(\d+)/.exec(lines[0]);
                if (!match) {
                    // TODO: Gotodef on pkg name:
                    // /usr/local/go/src/html/template\n
                    return resolve(null);
                }
                let [_, file, line, col] = match;
                let signature = lines[1];
                let godoc = util_1.getBinPath('godoc');
                let pkgPath = path.dirname(file);
                let definitionInformation = {
                    file: file,
                    line: +line - 1,
                    column: +col - 1,
                    declarationlines: lines.splice(1),
                    toolUsed: 'godef',
                    doc: null,
                    name: null
                };
                if (!includeDocs) {
                    return resolve(definitionInformation);
                }
                cp.execFile(godoc, [pkgPath], { env }, (err, stdout, stderr) => {
                    if (err && err.code === 'ENOENT') {
                        vscode.window.showInformationMessage('The "godoc" command is not available.');
                    }
                    let godocLines = stdout.toString().split('\n');
                    let doc = '';
                    let sigName = signature.substring(0, signature.indexOf(' '));
                    let sigParams = signature.substring(signature.indexOf(' func') + 5);
                    let searchSignature = 'func ' + sigName + sigParams;
                    for (let i = 0; i < godocLines.length; i++) {
                        if (godocLines[i] === searchSignature) {
                            while (godocLines[++i].startsWith('    ')) {
                                doc += godocLines[i].substring(4) + '\n';
                            }
                            break;
                        }
                    }
                    if (doc !== '') {
                        definitionInformation.doc = doc;
                    }
                    return resolve(definitionInformation);
                });
            }
            catch (e) {
                reject(e);
            }
        });
        p.stdin.end(document.getText());
    });
}
function definitionLocation_gogetdoc(document, position, offset, env, useTags = true) {
    return new Promise((resolve, reject) => {
        let gogetdoc = util_1.getBinPath('gogetdoc');
        let gogetdocFlagsWithoutTags = ['-u', '-json', '-modified', '-pos', document.fileName + ':#' + offset.toString()];
        let buildTags = vscode.workspace.getConfiguration('go')['buildTags'];
        let gogetdocFlags = (buildTags && useTags) ? [...gogetdocFlagsWithoutTags, '-tags', '"' + buildTags + '"'] : gogetdocFlagsWithoutTags;
        let p = cp.execFile(gogetdoc, gogetdocFlags, { env }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + 'gogetdoc');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: -tags')) {
                    return definitionLocation_gogetdoc(document, position, offset, env, false);
                }
                if (err) {
                    return reject(err);
                }
                ;
                let goGetDocOutput = JSON.parse(stdout.toString());
                let match = /(.*):(\d+):(\d+)/.exec(goGetDocOutput.pos);
                let definitionInfo = {
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
                let [_, file, line, col] = match;
                definitionInfo.file = match[1];
                definitionInfo.line = +match[2] - 1;
                definitionInfo.column = +match[3] - 1;
                return resolve(definitionInfo);
            }
            catch (e) {
                reject(e);
            }
        });
        p.stdin.end(util_2.getFileArchive(document));
    });
}
function definitionLocation_guru(document, position, offset, env) {
    return new Promise((resolve, reject) => {
        let guru = util_1.getBinPath('guru');
        let p = cp.execFile(guru, ['-json', '-modified', 'definition', document.fileName + ':#' + offset.toString()], { env }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + 'guru');
                }
                if (err) {
                    return reject(err);
                }
                ;
                let guruOutput = JSON.parse(stdout.toString());
                let match = /(.*):(\d+):(\d+)/.exec(guruOutput.objpos);
                let definitionInfo = {
                    file: null,
                    line: 0,
                    column: 0,
                    toolUsed: 'guru',
                    declarationlines: [guruOutput.desc],
                    doc: null,
                    name: null,
                };
                if (!match) {
                    return resolve(definitionInfo);
                }
                let [_, file, line, col] = match;
                definitionInfo.file = match[1];
                definitionInfo.line = +match[2] - 1;
                definitionInfo.column = +match[3] - 1;
                return resolve(definitionInfo);
            }
            catch (e) {
                reject(e);
            }
        });
        p.stdin.end(util_2.getFileArchive(document));
    });
}
class GoDefinitionProvider {
    constructor(goConfig) {
        this.goConfig = null;
        this.goConfig = goConfig;
    }
    provideDefinition(document, position, token) {
        return definitionLocation(document, position, this.goConfig, false).then(definitionInfo => {
            if (definitionInfo == null || definitionInfo.file == null)
                return null;
            let definitionResource = vscode.Uri.file(definitionInfo.file);
            let pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
            return new vscode.Location(definitionResource, pos);
        }, err => {
            if (err) {
                // Prompt for missing tool is located here so that the
                // prompts dont show up on hover or signature help
                if (typeof err === 'string' && err.startsWith(missingToolMsg)) {
                    goInstallTools_1.promptForMissingTool(err.substr(missingToolMsg.length));
                }
                else {
                    console.log(err);
                }
            }
            return Promise.resolve(null);
        });
    }
}
exports.GoDefinitionProvider = GoDefinitionProvider;
//# sourceMappingURL=goDeclaration.js.map