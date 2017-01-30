"use strict";
const vscode = require("vscode");
const fs = require("fs");
const settings_1 = require("./settings");
const init_1 = require("./init");
const commands_1 = require("./commands");
const vscode_extensions_1 = require("./utils/vscode-extensions");
const utils_1 = require("./utils");
function initialize(context) {
    const config = vscode_extensions_1.getConfig().vsicons;
    const settingsManager = new settings_1.SettingsManager(vscode);
    commands_1.registerCommands(context);
    init_1.manageWelcomeMessage(settingsManager);
    init_1.detectProject(vscode_extensions_1.findFiles, config)
        .then((results) => {
        if (results != null && results.length) {
            const isInRootFolder = !vscode_extensions_1.asRelativePath(results[0].fsPath).includes('/');
            if (isInRootFolder) {
                const ngIconsDisabled = init_1.iconsDisabled('ng');
                let isNgProject;
                for (const result of results) {
                    const content = fs.readFileSync(result.fsPath, "utf8");
                    const projectJson = utils_1.parseJSON(content);
                    isNgProject = projectJson && init_1.isProject(projectJson, 'ng');
                    if (isNgProject) {
                        break;
                    }
                }
                const toggle = init_1.checkForAngularProject(config.presets.angular, ngIconsDisabled, isNgProject);
                if (toggle.apply) {
                    init_1.applyDetection(toggle.message, 'angular', toggle.value, config.projectDetection.autoReload, commands_1.togglePreset, commands_1.applyCustomization, commands_1.reload, commands_1.cancel, commands_1.showCustomizationMessage);
                }
                return;
            }
        }
        init_1.manageAutoApplyCustomizations(settingsManager.isNewVersion(), config, commands_1.applyCustomizationCommand);
    });
}
function activate(context) {
    initialize(context);
    // tslint:disable-next-line no-console
    console.log('vscode-icons is active!');
}
exports.activate = activate;
// this method is called when your vscode is closed
function deactivate() {
    // no code here at the moment
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map