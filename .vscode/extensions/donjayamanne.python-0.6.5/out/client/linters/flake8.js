'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const baseLinter = require("./baseLinter");
const installer_1 = require("../common/installer");
class Linter extends baseLinter.BaseLinter {
    constructor(outputChannel, workspaceRootPath) {
        super('flake8', installer_1.Product.flake8, outputChannel, workspaceRootPath);
    }
    parseMessagesCodeSeverity(error) {
        let category_letter = error[0];
        switch (category_letter) {
            case 'F':
            case 'E':
                return baseLinter.LintMessageSeverity.Error;
            case 'W':
                return baseLinter.LintMessageSeverity.Warning;
            default:
                return baseLinter.LintMessageSeverity.Information;
        }
    }
    isEnabled() {
        return this.pythonSettings.linting.flake8Enabled;
    }
    runLinter(document, cancellation) {
        if (!this.pythonSettings.linting.flake8Enabled) {
            return Promise.resolve([]);
        }
        let flake8Path = this.pythonSettings.linting.flake8Path;
        let flake8Args = Array.isArray(this.pythonSettings.linting.flake8Args) ? this.pythonSettings.linting.flake8Args : [];
        return new Promise((resolve, reject) => {
            this.run(flake8Path, flake8Args.concat(['--format=%(row)d,%(col)d,%(code)s,%(code)s:%(text)s', document.uri.fsPath]), document, this.workspaceRootPath, cancellation).then(messages => {
                messages.forEach(msg => {
                    msg.severity = this.parseMessagesCodeSeverity(msg.type);
                });
                resolve(messages);
            }, reject);
        });
    }
}
exports.Linter = Linter;
//# sourceMappingURL=flake8.js.map