'use strict';
const baseLinter = require('./baseLinter');
const installer_1 = require('../common/installer');
class Linter extends baseLinter.BaseLinter {
    constructor(outputChannel, workspaceRootPath) {
        super('flake8', installer_1.Product.flake8, outputChannel, workspaceRootPath);
    }
    isEnabled() {
        return this.pythonSettings.linting.flake8Enabled;
    }
    runLinter(document) {
        if (!this.pythonSettings.linting.flake8Enabled) {
            return Promise.resolve([]);
        }
        let flake8Path = this.pythonSettings.linting.flake8Path;
        let flake8Args = Array.isArray(this.pythonSettings.linting.flake8Args) ? this.pythonSettings.linting.flake8Args : [];
        return new Promise((resolve, reject) => {
            this.run(flake8Path, flake8Args.concat(['--format=%(row)d,%(col)d,%(code)s,%(code)s:%(text)s', document.uri.fsPath]), document, this.workspaceRootPath).then(messages => {
                // All messages in pep8 are treated as warnings for now
                messages.forEach(msg => {
                    msg.severity = baseLinter.LintMessageSeverity.Information;
                });
                resolve(messages);
            }, reject);
        });
    }
}
exports.Linter = Linter;
//# sourceMappingURL=flake8.js.map