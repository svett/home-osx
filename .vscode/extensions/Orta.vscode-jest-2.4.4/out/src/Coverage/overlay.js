"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const appGlobals_1 = require("../appGlobals");
const toggleCoverageCommand = `${appGlobals_1.extensionName}.coverage.toggle`;
let showCoverage = false;
function registerToggleCoverageOverlay() {
    return vscode.commands.registerCommand(toggleCoverageCommand, () => (showCoverage = !showCoverage));
}
exports.registerToggleCoverageOverlay = registerToggleCoverageOverlay;
function showCoverageOverlay(editor, allCoverage) {
    if (!showCoverage) {
        return;
    }
    const atEmptyScreen = !editor;
    if (atEmptyScreen) {
        return;
    }
    const inSettings = !editor.document;
    if (inSettings) {
        return;
    }
    const coverage = allCoverage.getCoverageForFile(editor.document.uri.fsPath);
    if (coverage) {
        const hitBranches = [];
        const missedBranches = [];
        Object.keys(coverage.b).forEach(branchIndex => {
            coverage.b[branchIndex].forEach((_, locationIndex) => {
                const branch = coverage.branchMap[branchIndex].locations[locationIndex];
                if (branch.start.line < 0 || branch.end.line < 0 || branch.start.line === null || branch.end.line === null) {
                    return;
                }
                if (coverage.b[branchIndex][locationIndex]) {
                    hitBranches.push(branch);
                }
                else {
                    missedBranches.push(branch);
                }
            });
        });
        const toRange = (loc) => new vscode.Range(loc.start.line - 1, loc.start.column, loc.end.line - 1, loc.end.column);
        const lines = coverage.getUncoveredLines().map(line => ({
            end: {
                line: Number(line),
                column: 0,
            },
            start: {
                line: Number(line),
                column: 0,
            },
        }));
        editor.setDecorations(missingLine, lines.map(toRange));
        editor.setDecorations(uncoveredBranch, missedBranches.map(toRange));
    }
}
exports.showCoverageOverlay = showCoverageOverlay;
const missingLine = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: 'rgba(216,134,123,0.4)',
    overviewRulerColor: 'rgba(216,134,123,0.8)',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
});
const uncoveredBranch = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(216,134,123,0.4)',
    overviewRulerColor: 'rgba(216,134,123,0.8)',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
});
//# sourceMappingURL=overlay.js.map