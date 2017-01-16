'use strict';
const baseFormatter_1 = require('./baseFormatter');
const installer_1 = require('../common/installer');
class YapfFormatter extends baseFormatter_1.BaseFormatter {
    constructor(outputChannel, pythonSettings, workspaceRootPath) {
        super('yapf', installer_1.Product.yapf, outputChannel, pythonSettings, workspaceRootPath);
    }
    formatDocument(document, options, token, range) {
        let yapfPath = this.pythonSettings.formatting.yapfPath;
        let yapfArgs = Array.isArray(this.pythonSettings.formatting.yapfArgs) ? this.pythonSettings.formatting.yapfArgs : [];
        yapfArgs = yapfArgs.concat(['--diff']);
        if (range && !range.isEmpty) {
            yapfArgs = yapfArgs.concat(['--lines', `${range.start.line + 1}-${range.end.line + 1}`]);
        }
        return super.provideDocumentFormattingEdits(document, options, token, yapfPath, yapfArgs);
    }
}
exports.YapfFormatter = YapfFormatter;
//# sourceMappingURL=yapfFormatter.js.map