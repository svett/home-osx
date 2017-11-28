"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const settings_1 = require("./settings");
const init = require("./init");
const projectAutoDetection_1 = require("./init/projectAutoDetection");
const icon_manifest_1 = require("./icon-manifest");
const commands = require("./commands");
const vscode_extensions_1 = require("./utils/vscode-extensions");
const i18n_1 = require("./i18n");
const models_1 = require("./models");
const constants_1 = require("./constants");
function initialize(context) {
    const config = vscode_extensions_1.getVsiconsConfig();
    const settingsManager = new settings_1.SettingsManager(vscode);
    commands.registerCommands(context);
    init.manageWelcomeMessage(settingsManager);
    init.manageAutoApplyCustomizations(settingsManager.isNewVersion(), config, commands.applyCustomizationCommand);
    projectAutoDetection_1.ProjectAutoDetection.detectProject(vscode_extensions_1.findFiles, config).then(results => detectAngular(config, results));
    // Update the version in settings
    if (settingsManager.isNewVersion()) {
        settingsManager.updateStatus();
    }
}
function detectAngular(config, results) {
    if (!config || !results) {
        return;
    }
    const projectInfo = projectAutoDetection_1.ProjectAutoDetection.getProjectInfo(results, models_1.Projects.angular);
    const i18nManager = new i18n_1.LanguageResourceManager(vscode.env.language);
    const presetValue = vscode_extensions_1.getConfig().inspect(`vsicons.presets.angular`).workspaceValue;
    const detectionResult = projectAutoDetection_1.ProjectAutoDetection.checkForAngularProject(presetValue, icon_manifest_1.ManifestReader.iconsDisabled(models_1.Projects.angular), !!projectInfo, i18nManager);
    if (!detectionResult.apply) {
        return;
    }
    projectAutoDetection_1.ProjectAutoDetection.applyDetection(i18nManager, detectionResult, config.projectDetection.autoReload, commands.applyCustomization, commands.showCustomizationMessage, commands.reload);
}
function activate(context) {
    initialize(context);
    // tslint:disable-next-line no-console
    console.info(`${constants_1.constants.extensionName} is active!`);
    exports.initialized = true;
}
exports.activate = activate;
// this method is called when your vscode is closed
function deactivate() {
    // no code here at the moment
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map