'use strict';
const baseLinter = require('./baseLinter');
const installer_1 = require('../common/installer');
class Linter extends baseLinter.BaseLinter {
    constructor(outputChannel, workspaceRootPath) {
        super('pylint', installer_1.Product.pylint, outputChannel, workspaceRootPath);
    }
    parseMessagesSeverity(category) {
        if (this.pythonSettings.linting.pylintCategorySeverity[category]) {
            let severityName = this.pythonSettings.linting.pylintCategorySeverity[category];
            switch (severityName) {
                case 'Error':
                    return baseLinter.LintMessageSeverity.Error;
                case 'Hint':
                    return baseLinter.LintMessageSeverity.Hint;
                case 'Information':
                    return baseLinter.LintMessageSeverity.Information;
                case 'Warning':
                    return baseLinter.LintMessageSeverity.Warning;
                default: {
                    if (baseLinter.LintMessageSeverity[severityName]) {
                        return baseLinter.LintMessageSeverity[severityName];
                    }
                }
            }
        }
        return baseLinter.LintMessageSeverity.Information;
    }
    isEnabled() {
        return this.pythonSettings.linting.pylintEnabled;
    }
    runLinter(document) {
        if (!this.pythonSettings.linting.pylintEnabled) {
            return Promise.resolve([]);
        }
        let pylintPath = this.pythonSettings.linting.pylintPath;
        let pylintArgs = Array.isArray(this.pythonSettings.linting.pylintArgs) ? this.pythonSettings.linting.pylintArgs : [];
        return new Promise((resolve, reject) => {
            this.run(pylintPath, pylintArgs.concat(['--msg-template=\'{line},{column},{category},{msg_id}:{msg}\'', '--reports=n', '--output-format=text', document.uri.fsPath]), document, this.workspaceRootPath).then(messages => {
                messages.forEach(msg => {
                    msg.severity = this.parseMessagesSeverity(msg.type);
                });
                resolve(messages);
            }, reject);
        });
    }
}
exports.Linter = Linter;
//# sourceMappingURL=pylint.js.map