/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const os = require("os");
const fs = require("fs");
const testUtils_1 = require("./testUtils");
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
function initGoCover(ctx) {
    exports.coveredGutter = vscode.window.createTextEditorDecorationType({
        // Gutter green
        gutterIconPath: ctx.asAbsolutePath('images/gutter-green.svg')
    });
    exports.uncoveredGutter = vscode.window.createTextEditorDecorationType({
        // Gutter red
        gutterIconPath: ctx.asAbsolutePath('images/gutter-red.svg')
    });
}
exports.initGoCover = initGoCover;
function removeCodeCoverage(e) {
    let editor = vscode.window.visibleTextEditors.find((value, index, obj) => {
        return value.document === e.document;
    });
    if (!editor) {
        return;
    }
    for (let filename in coverageFiles) {
        let found = editor.document.uri.fsPath.endsWith(filename);
        // Check for file again if outside the $GOPATH.
        if (!found && filename.startsWith('_')) {
            found = editor.document.uri.fsPath.endsWith(filename.slice(1));
        }
        if (found) {
            highlightCoverage(editor, coverageFiles[filename], true);
            delete coverageFiles[filename];
        }
    }
}
exports.removeCodeCoverage = removeCodeCoverage;
function toggleCoverageCurrentPackage() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    // If current file has highlights, then remove coverage, else add coverage
    for (let filename in coverageFiles) {
        let found = editor.document.uri.fsPath.endsWith(filename);
        // Check for file again if outside the $GOPATH.
        if (!found && filename.startsWith('_')) {
            found = editor.document.uri.fsPath.endsWith(filename.slice(1));
        }
        if (found) {
            clearCoverage();
            return;
        }
    }
    let goConfig = vscode.workspace.getConfiguration('go', editor.document.uri);
    let cwd = path.dirname(editor.document.uri.fsPath);
    let buildFlags = goConfig['testFlags'] || goConfig['buildFlags'] || [];
    let tmpCoverPath = path.normalize(path.join(os.tmpdir(), 'go-code-cover'));
    let args = ['-coverprofile=' + tmpCoverPath, ...buildFlags];
    return testUtils_1.goTest({
        goConfig: goConfig,
        dir: cwd,
        flags: args,
        background: true
    }).then(success => {
        if (!success) {
            testUtils_1.showTestOutput();
            return [];
        }
        return getCoverage(tmpCoverPath, true);
    });
}
exports.toggleCoverageCurrentPackage = toggleCoverageCurrentPackage;
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
            let found = value.document.fileName.endsWith(filename);
            // Check for file again if outside the $GOPATH.
            if (!found && filename.startsWith('_')) {
                found = value.document.fileName.endsWith(filename.slice(1));
            }
            return found;
        });
        if (editor) {
            highlightCoverage(editor, file, remove);
        }
    });
}
function highlightCoverage(editor, file, remove) {
    let cfg = vscode.workspace.getConfiguration('go', editor.document.uri);
    let coverageOptions = cfg['coverageOptions'];
    let coverageDecorator = cfg['coverageDecorator'];
    editor.setDecorations(exports.coveredGutter, []);
    editor.setDecorations(coveredHighLight, []);
    editor.setDecorations(exports.uncoveredGutter, []);
    editor.setDecorations(uncoveredHighLight, []);
    if (remove) {
        return;
    }
    if (coverageOptions === 'showCoveredCodeOnly' || coverageOptions === 'showBothCoveredAndUncoveredCode') {
        editor.setDecorations(coverageDecorator === 'gutter' ? exports.coveredGutter : coveredHighLight, file.coveredRange);
    }
    if (coverageOptions === 'showUncoveredCodeOnly' || coverageOptions === 'showBothCoveredAndUncoveredCode') {
        editor.setDecorations(coverageDecorator === 'gutter' ? exports.uncoveredGutter : uncoveredHighLight, file.uncoveredRange);
    }
}
function getCoverage(coverProfilePath, showErrOutput = false) {
    return new Promise((resolve, reject) => {
        try {
            // Clear existing coverage files
            clearCoverage();
            let lines = rl.createInterface({
                input: fs.createReadStream(coverProfilePath),
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
}
exports.getCoverage = getCoverage;
//# sourceMappingURL=goCover.js.map