'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const baseLinter = require("./baseLinter");
const installer_1 = require("../common/installer");
class Linter extends baseLinter.BaseLinter {
    constructor(outputChannel, workspaceRootPath) {
        super('pep8', installer_1.Product.pep8, outputChannel, workspaceRootPath);
    }
    parseMessagesCodeSeverity(error) {
        let category_letter = error[0];
        switch (category_letter) {
            case 'E':
                return baseLinter.LintMessageSeverity.Error;
            case 'W':
                return baseLinter.LintMessageSeverity.Warning;
            default:
                return baseLinter.LintMessageSeverity.Information;
        }
    }
    isEnabled() {
        return this.pythonSettings.linting.pep8Enabled;
    }
    runLinter(document, cancellation) {
        if (!this.pythonSettings.linting.pep8Enabled) {
            return Promise.resolve([]);
        }
        let pep8Path = this.pythonSettings.linting.pep8Path;
        let pep8Args = Array.isArray(this.pythonSettings.linting.pep8Args) ? this.pythonSettings.linting.pep8Args : [];
        return new Promise(resolve => {
            this.run(pep8Path, pep8Args.concat(['--format=%(row)d,%(col)d,%(code)s,%(code)s:%(text)s', document.uri.fsPath]), document, this.workspaceRootPath, cancellation).then(messages => {
                messages.forEach(msg => {
                    msg.severity = this.parseMessagesCodeSeverity(msg.type);
                });
                resolve(messages);
            });
        });
    }
}
exports.Linter = Linter;
//# sourceMappingURL=pep8Linter.js.map