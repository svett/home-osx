'use strict';
const baseLinter = require('./baseLinter');
const installer_1 = require('../common/installer');
const REGEX = '(?<file>.py):(?<line>\\d+):(?<column>\\d+): \\[(?<type>\\w+)\\] (?<code>\\w\\d+):? (?<message>.*)\\r?(\\n|$)';
class Linter extends baseLinter.BaseLinter {
    constructor(outputChannel, workspaceRootPath) {
        super('pylama', installer_1.Product.pylama, outputChannel, workspaceRootPath);
    }
    isEnabled() {
        return this.pythonSettings.linting.pylamaEnabled;
    }
    runLinter(filePath, txtDocumentLines) {
        if (!this.pythonSettings.linting.pylamaEnabled) {
            return Promise.resolve([]);
        }
        let pylamaPath = this.pythonSettings.linting.pylamaPath;
        let pylamaArgs = Array.isArray(this.pythonSettings.linting.pylamaArgs) ? this.pythonSettings.linting.pylamaArgs : [];
        return new Promise(resolve => {
            this.run(pylamaPath, pylamaArgs.concat(['--format=parsable', filePath]), filePath, txtDocumentLines, this.workspaceRootPath, REGEX).then(messages => {
                // All messages in pylama are treated as warnings for now
                messages.forEach(msg => {
                    msg.severity = baseLinter.LintMessageSeverity.Information;
                });
                resolve(messages);
            });
        });
    }
}
exports.Linter = Linter;
//# sourceMappingURL=pylama.js.map