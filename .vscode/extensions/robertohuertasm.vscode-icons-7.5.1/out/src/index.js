"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const settings_1 = require("./settings");
const init = require("./init");
const commands = require("./commands");
const vscode_extensions_1 = require("./utils/vscode-extensions");
const utils_1 = require("./utils");
const i18n_1 = require("./i18n");
let vscodeDirExisted;
let userSettingsExisted;
function initialize(context) {
    const config = vscode_extensions_1.getConfig().vsicons;
    const settingsManager = new settings_1.SettingsManager(vscode);
    vscodeDirExisted = fs.existsSync(`${vscode.workspace.rootPath}/.vscode`);
    userSettingsExisted = fs.existsSync(`${vscode.workspace.rootPath}/.vscode/settings.json`);
    commands.registerCommands(context);
    init.manageWelcomeMessage(settingsManager);
    init.manageAutoApplyCustomizations(settingsManager.isNewVersion(), config, commands.applyCustomizationCommand);
    init.detectProject(vscode_extensions_1.findFiles, config)
        .then((results) => {
        if (results && results.length && !vscode_extensions_1.asRelativePath(results[0].fsPath).includes('/')) {
            detectAngular(config, results);
        }
    });
}
function detectAngular(config, results) {
    let isNgProject;
    for (const result of results) {
        const content = fs.readFileSync(result.fsPath, "utf8");
        const projectJson = utils_1.parseJSON(content);
        isNgProject = projectJson && init.isProject(projectJson, 'ng');
        if (isNgProject) {
            break;
        }
    }
    const i18nManager = new i18n_1.LanguageResourceManager(vscode.env.language);
    const toggle = init.checkForAngularProject(config.presets.angular, init.iconsDisabled('ng'), isNgProject, i18nManager);
    if (!toggle.apply) {
        return;
    }
    const presetText = 'angular';
    const { defaultValue, workspaceValue } = vscode_extensions_1.getConfig().inspect(`vsicons.presets.${presetText}`);
    init.applyDetection(i18nManager, toggle.message, presetText, toggle.value, workspaceValue, defaultValue, config.projectDetection.autoReload, commands.updatePreset, commands.applyCustomization, commands.showCustomizationMessage, commands.reload, commands.cancel, handleVSCodeDir);
}
function handleVSCodeDir() {
    const vscodeDirPath = `${vscode.workspace.rootPath}/.vscode`;
    const userSettingsPath = `${vscodeDirPath}/settings.json`;
    // In case we created the 'settings.json' file remove it
    if (!userSettingsExisted && fs.existsSync(userSettingsPath)) {
        fs.unlinkSync(userSettingsPath);
    }
    // In case we created the '.vscode' directory remove it
    if (!vscodeDirExisted && fs.existsSync(vscodeDirPath)) {
        fs.rmdirSync(vscodeDirPath);
    }
}
exports.handleVSCodeDir = handleVSCodeDir;
function activate(context) {
    initialize(context);
    // tslint:disable-next-line no-console
    console.info('vscode-icons is active!');
}
exports.activate = activate;
// this method is called when your vscode is closed
function deactivate() {
    // no code here at the moment
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map