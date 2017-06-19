'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
let XQLint = require('xqlint').XQLint;
class XQueryLinter {
    static lint(text) {
        let linter = new XQLint(text);
        let diagnostics = new Array();
        linter.getErrors().forEach((error) => {
            diagnostics.push(new XQueryDiagnostic(XQueryLinter.SEVERITY_ERROR, error.message, error.pos.sl, error.pos.sc, error.pos.el, error.pos.ec));
        });
        linter.getWarnings().forEach((warning) => {
            diagnostics.push(new XQueryDiagnostic(XQueryLinter.SEVERITY_WARNING, warning.message, warning.pos.sl, warning.pos.sc, warning.pos.el, warning.pos.ec));
        });
        return diagnostics;
    }
}
XQueryLinter.SEVERITY_WARNING = 1;
XQueryLinter.SEVERITY_ERROR = 2;
exports.XQueryLinter = XQueryLinter;
class XQueryDiagnostic {
    constructor(severity, message, startLine, startColumn, endLine, endColumn) {
        this.severity = severity;
        this.message = message;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.endLine = endLine;
        this.endColumn = endColumn;
    }
}
exports.XQueryDiagnostic = XQueryDiagnostic;
