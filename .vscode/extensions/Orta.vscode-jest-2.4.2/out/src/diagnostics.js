"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * this module contains functions to show jest test results in
 * vscode inspector via the DiagnosticsCollection.
 */
const vscode = require("vscode");
const TestReconciliationState_1 = require("./TestReconciliationState");
function updateDiagnostics(testResults, diagnostics) {
    function addTestFileError(result, uri) {
        const diag = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), result.message || 'test file error', vscode.DiagnosticSeverity.Error);
        diag.source = 'Jest';
        diagnostics.set(uri, [diag]);
    }
    function addTestsError(result, uri) {
        const asserts = result.assertions.filter(a => a.status === TestReconciliationState_1.TestReconciliationState.KnownFail);
        diagnostics.set(uri, asserts.map(assertion => {
            const start = 0;
            const diag = new vscode.Diagnostic(new vscode.Range(assertion.line - 1, start, assertion.line - 1, start + 6), assertion.terseMessage || assertion.shortMessage || assertion.message, vscode.DiagnosticSeverity.Error);
            diag.source = 'Jest';
            return diag;
        }));
    }
    testResults.forEach(result => {
        const uri = vscode.Uri.file(result.file);
        switch (result.status) {
            case TestReconciliationState_1.TestReconciliationState.KnownFail:
                if (result.assertions.length <= 0) {
                    addTestFileError(result, uri);
                }
                else {
                    addTestsError(result, uri);
                }
                break;
            default:
                diagnostics.delete(uri);
                break;
        }
    });
}
exports.updateDiagnostics = updateDiagnostics;
function resetDiagnostics(diagnostics) {
    diagnostics.clear();
}
exports.resetDiagnostics = resetDiagnostics;
function failedSuiteCount(diagnostics) {
    let sum = 0;
    diagnostics.forEach(() => sum++);
    return sum;
}
exports.failedSuiteCount = failedSuiteCount;
//# sourceMappingURL=diagnostics.js.map