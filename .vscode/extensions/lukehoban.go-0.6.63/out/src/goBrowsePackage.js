/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const goPath_1 = require("./goPath");
const path = require("path");
const goPackages_1 = require("./goPackages");
function browsePackages() {
    let selectedText = '';
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        let selection = editor.selection;
        if (!selection.isEmpty) {
            // get selected text
            selectedText = editor.document.getText(selection);
        }
        else {
            // if selection is empty, then get the whole line the cursor is currently on.
            selectedText = editor.document.lineAt(selection.active.line).text;
        }
        selectedText = getImportPath(selectedText);
    }
    if (goPackages_1.isGoListComplete()) {
        return showPackages(selectedText);
    }
    // `go list all` has not completed. Wait for a second which is an acceptable duration of delay.
    setTimeout(() => {
        // `go list all` still not complete. It takes a long time on slower machines or when there are way too many folders in GOPATH
        if (!goPackages_1.isGoListComplete()) {
            vscode.window.showInformationMessage('Finding packages... Try after sometime.');
            return;
        }
        showPackages(selectedText);
    }, 1000);
}
exports.browsePackages = browsePackages;
function showPackages(selectedText) {
    const goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        return;
    }
    goPackages_1.goListAll().then(pkgMap => {
        const pkgs = Array.from(pkgMap.keys());
        if (!pkgs || pkgs.length === 0) {
            return;
        }
        let selectPkgPromise = Promise.resolve(selectedText);
        if (!selectedText || pkgs.indexOf(selectedText) === -1) {
            selectPkgPromise = vscode.window.showQuickPick(pkgs, { placeHolder: 'Select a package to browse' });
        }
        selectPkgPromise.then(pkg => {
            cp.execFile(goRuntimePath, ['list', '-f', '{{.Dir}}:{{.GoFiles}}:{{.TestGoFiles}}:{{.XTestGoFiles}}', pkg], (err, stdout, stderr) => {
                if (!stdout || stdout.indexOf(':') === -1) {
                    return;
                }
                let matches = stdout.match(/(.*):\[(.*)\]:\[(.*)\]:\[(.*)\]/);
                if (matches) {
                    let dir = matches[1];
                    let files = matches[2] ? matches[2].split(' ') : [];
                    let testfiles = matches[3] ? matches[3].split(' ') : [];
                    let xtestfiles = matches[4] ? matches[4].split(' ') : [];
                    files = files.concat(testfiles);
                    files = files.concat(xtestfiles);
                    vscode.window.showQuickPick(files, { placeHolder: `Below are Go files from ${pkg}` }).then(file => {
                        // if user abandoned list, file will be null and path.join will error out.
                        // therefore return.
                        if (!file)
                            return;
                        vscode.workspace.openTextDocument(path.join(dir, file)).then(document => {
                            vscode.window.showTextDocument(document);
                        });
                    });
                }
            });
        });
    });
}
function getImportPath(text) {
    // Catch cases like `import alias "importpath"` and `import "importpath"`
    let singleLineImportMatches = text.match(/^\s*import\s+([a-z,A-Z,_,\.]\w*\s+)?\"([^\"]+)\"/);
    if (singleLineImportMatches) {
        return singleLineImportMatches[2];
    }
    // Catch cases like `alias "importpath"` and "importpath"
    let groupImportMatches = text.match(/^\s*([a-z,A-Z,_,\.]\w*\s+)?\"([^\"]+)\"/);
    if (groupImportMatches) {
        return groupImportMatches[2];
    }
    return text.trim();
}
//# sourceMappingURL=goBrowsePackage.js.map