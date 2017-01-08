/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");
const goPath_1 = require("./goPath");
const rl = require("readline");
let coveredHighLight = vscode.window.createTextEditorDecorationType({
    // Green
    backgroundColor: 'rgba(64,128,64,0.5)',
    isWholeLine: false
});
let uncoveredHighLight = vscode.window.createTextEditorDecorationType({
    // Red
    backgroundColor: 'rgba(128,64,64,0.5)',
    isWholeLine: false
});
let coverageFiles = {};
function clearCoverage() {
    applyCoverage(true);
    coverageFiles = {};
}
function removeCodeCoverage(e) {
    let editor = vscode.window.visibleTextEditors.find((value, index, obj) => {
        return value.document === e.document;
    });
    if (!editor) {
        return;
    }
    for (let filename in coverageFiles) {
        if (editor.document.uri.fsPath.endsWith(filename)) {
            highlightCoverage(editor, coverageFiles[filename], true);
            delete coverageFiles[filename];
        }
    }
}
exports.removeCodeCoverage = removeCodeCoverage;
function coverageCurrentPackage() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    getCoverage(editor.document.uri.fsPath);
}
exports.coverageCurrentPackage = coverageCurrentPackage;
function getCodeCoverage(editor) {
    if (!editor) {
        return;
    }
    for (let filename in coverageFiles) {
        if (editor.document.uri.fsPath.endsWith(filename)) {
            highlightCoverage(editor, coverageFiles[filename], false);
        }
    }
}
exports.getCodeCoverage = getCodeCoverage;
function applyCoverage(remove = false) {
    Object.keys(coverageFiles).forEach(filename => {
        let file = coverageFiles[filename];
        // Highlight lines in current editor.
        let editor = vscode.window.visibleTextEditors.find((value, index, obj) => {
            return value.document.fileName.endsWith(filename);
        });
        if (editor) {
            highlightCoverage(editor, file, remove);
        }
    });
}
function highlightCoverage(editor, file, remove) {
    editor.setDecorations(uncoveredHighLight, remove ? [] : file.uncoveredRange);
    editor.setDecorations(coveredHighLight, remove ? [] : file.coveredRange);
}
function getCoverage(filename) {
    return new Promise((resolve, reject) => {
        let tmppath = path.normalize(path.join(os.tmpdir(), 'go-code-cover'));
        let cwd = path.dirname(filename);
        let args = ['test', '-coverprofile=' + tmppath];
        let goRuntimePath = goPath_1.getGoRuntimePath();
        if (!goRuntimePath) {
            vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
            return Promise.resolve([]);
        }
        // make sure tmppath exists
        fs.closeSync(fs.openSync(tmppath, 'a'));
        cp.execFile(goRuntimePath, args, { cwd: cwd }, (err, stdout, stderr) => {
            try {
                // Clear existing coverage files
                clearCoverage();
                if (err && err.code === 'ENOENT') {
                    vscode.window.showInformationMessage('Could not generate coverage report.  Install Go from http://golang.org/dl/.');
                    return resolve([]);
                }
                let lines = rl.createInterface({
                    input: fs.createReadStream(tmppath),
                    output: undefined
                });
                lines.on('line', function (data) {
                    // go test coverageprofile generates output:
                    //    filename:StartLine.StartColumn,EndLine.EndColumn Hits IsCovered
                    // The first line will be "mode: set" which will be ignored
                    let fileRange = data.match(/([^:]+)\:([\d]+)\.([\d]+)\,([\d]+)\.([\d]+)\s([\d]+)\s([\d]+)/);
                    if (!fileRange)
                        return;
                    let coverage = coverageFiles[fileRange[1]] || { coveredRange: [], uncoveredRange: [] };
                    let range = new vscode.Range(
                    // Start Line converted to zero based
                    parseInt(fileRange[2]) - 1, 
                    // Start Column converted to zero based
                    parseInt(fileRange[3]) - 1, 
                    // End Line converted to zero based
                    parseInt(fileRange[4]) - 1, 
                    // End Column converted to zero based
                    parseInt(fileRange[5]) - 1);
                    // If is Covered
                    if (parseInt(fileRange[7]) === 1) {
                        coverage.coveredRange.push({ range });
                    }
                    else {
                        coverage.uncoveredRange.push({ range });
                    }
                    coverageFiles[fileRange[1]] = coverage;
                });
                lines.on('close', function (data) {
                    applyCoverage();
                    resolve([]);
                });
            }
            catch (e) {
                vscode.window.showInformationMessage(e.msg);
                reject(e);
            }
        });
    });
}
exports.getCoverage = getCoverage;
//# sourceMappingURL=goCover.js.map