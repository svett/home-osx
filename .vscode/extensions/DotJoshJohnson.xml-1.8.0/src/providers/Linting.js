'use strict';
const vsc = require('vscode');
const XQueryLinter_1 = require('../services/XQueryLinter');
class XQueryLintingFeatureProvider {
    static get coreDiagnostics() {
        if (!XQueryLintingFeatureProvider._coreDiagnostics) {
            XQueryLintingFeatureProvider._coreDiagnostics = vsc.languages.createDiagnosticCollection('XQueryDiagnostics');
        }
        return XQueryLintingFeatureProvider._coreDiagnostics;
    }
    static provideXQueryDiagnostics(editor) {
        let diagnostics = new Array();
        let xqDiagnostics = XQueryLinter_1.XQueryLinter.lint(editor.document.getText());
        xqDiagnostics.forEach((xqd) => {
            let vSeverity = (xqd.severity == 1) ? vsc.DiagnosticSeverity.Warning : vsc.DiagnosticSeverity.Error;
            let startPos = new vsc.Position(xqd.startLine, xqd.startColumn);
            let endPos = new vsc.Position(xqd.endLine, xqd.endColumn);
            let range = new vsc.Range(startPos, endPos);
            let diagnostic = new vsc.Diagnostic(range, xqd.message, vSeverity);
            diagnostics.push(diagnostic);
        });
        XQueryLintingFeatureProvider.coreDiagnostics.set(editor.document.uri, diagnostics);
    }
}
exports.XQueryLintingFeatureProvider = XQueryLintingFeatureProvider;
