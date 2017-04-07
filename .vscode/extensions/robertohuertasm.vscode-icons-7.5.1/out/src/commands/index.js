"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_extensions_1 = require("../utils/vscode-extensions");
const i18n_1 = require("../i18n");
const iconManifest = require("../icon-manifest");
const supportedExtensions_1 = require("../icon-manifest/supportedExtensions");
const supportedFolders_1 = require("../icon-manifest/supportedFolders");
const models_1 = require("../models");
const settings_1 = require("../settings");
const _1 = require("../");
const i18nManager = new i18n_1.LanguageResourceManager(vscode.env.language);
function registerCommands(context) {
    registerCommand(context, 'regenerateIcons', applyCustomizationCommand);
    registerCommand(context, 'restoreIcons', restoreDefaultManifestCommand);
    registerCommand(context, 'resetProjectDetectionDefaults', resetProjectDetectionDefaultsCommand);
    registerCommand(context, 'ngPreset', toggleAngularPresetCommand);
    registerCommand(context, 'jsPreset', toggleJsPresetCommand);
    registerCommand(context, 'tsPreset', toggleTsPresetCommand);
    registerCommand(context, 'jsonPreset', toggleJsonPresetCommand);
    registerCommand(context, 'hideFoldersPreset', toggleHideFoldersPresetCommand);
    registerCommand(context, 'foldersAllDefaultIconPreset', toggleFoldersAllDefaultIconPresetCommand);
}
exports.registerCommands = registerCommands;
function registerCommand(context, name, callback) {
    const command = vscode.commands.registerCommand(`vscode-icons.${name}`, callback);
    context.subscriptions.push(command);
    return command;
}
function applyCustomizationCommand() {
    const message = i18nManager.getMessage(models_1.LangResourceKeys.iconCustomization, ' ', models_1.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], applyCustomization);
}
exports.applyCustomizationCommand = applyCustomizationCommand;
function restoreDefaultManifestCommand() {
    const message = i18nManager.getMessage(models_1.LangResourceKeys.iconRestore, ' ', models_1.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], restoreManifest);
}
function resetProjectDetectionDefaultsCommand() {
    const message = i18nManager.getMessage(models_1.LangResourceKeys.projectDetecticonReset, ' ', models_1.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], resetProjectDetectionDefaults);
}
function togglePreset(preset, presetKey, reverseAction = false, global = true) {
    const value = getToggleValue(preset);
    const action = reverseAction
        ? value
            ? 'Disabled'
            : 'Enabled'
        : value
            ? 'Enabled'
            : 'Disabled';
    if (!Reflect.has(models_1.LangResourceKeys, `${presetKey}${action}`)) {
        throw Error(`${presetKey}${action} is not valid`);
    }
    const message = `${i18nManager.getMessage(models_1.LangResourceKeys[`${presetKey}${action}`], ' ', models_1.LangResourceKeys.restart)}`;
    const { defaultValue, globalValue, workspaceValue } = vscode_extensions_1.getConfig().inspect(`vsicons.presets.${preset}`);
    const initValue = (global ? globalValue : workspaceValue);
    updatePreset(preset, value, defaultValue, global);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], applyCustomization, cancel, preset, !value, initValue, global, _1.handleVSCodeDir);
}
function toggleAngularPresetCommand() {
    togglePreset('angular', 'ngPreset', false, false);
}
function toggleJsPresetCommand() {
    togglePreset('jsOfficial', 'jsOfficialPreset');
}
function toggleTsPresetCommand() {
    togglePreset('tsOfficial', 'tsOfficialPreset');
}
function toggleJsonPresetCommand() {
    togglePreset('jsonOfficial', 'jsonOfficialPreset');
}
function toggleHideFoldersPresetCommand() {
    togglePreset('hideFolders', 'hideFoldersPreset', true);
}
function toggleFoldersAllDefaultIconPresetCommand() {
    togglePreset('foldersAllDefaultIcon', 'foldersAllDefaultIconPreset', true);
}
function getToggleValue(preset) {
    return !vscode_extensions_1.getConfig().vsicons.presets[preset];
}
function updatePreset(preset, newValue, initValue, global = true) {
    return vscode_extensions_1.getConfig().update(`vsicons.presets.${preset}`, initValue === undefined ? initValue : newValue, global);
}
exports.updatePreset = updatePreset;
function showCustomizationMessage(message, items, callback, cancel, ...args) {
    vscode.window.showInformationMessage(message, ...items)
        .then(btn => {
        if (!btn) {
            if (cancel) {
                cancel(...args);
            }
            return;
        }
        if (btn.title === i18nManager.getMessage(models_1.LangResourceKeys.disableDetect)) {
            vscode_extensions_1.getConfig().update('vsicons.projectDetection.disableDetect', true, true);
            return;
        }
        if (btn.title === i18nManager.getMessage(models_1.LangResourceKeys.autoReload)) {
            vscode_extensions_1.getConfig().update('vsicons.projectDetection.autoReload', true, true);
        }
        if (callback) {
            callback();
        }
        reload();
    }, (reason) => {
        // tslint:disable-next-line:no-console
        console.info('Rejected because: ', reason);
        return;
    });
}
exports.showCustomizationMessage = showCustomizationMessage;
function reload() {
    vscode.commands.executeCommand('workbench.action.reloadWindow');
}
exports.reload = reload;
function cancel(preset, value, initValue, global = true, callback) {
    updatePreset(preset, value, initValue, global)
        .then(() => {
        if (callback) {
            callback();
        }
    });
}
exports.cancel = cancel;
function applyCustomization() {
    const associations = vscode_extensions_1.getConfig().vsicons.associations;
    const customFiles = {
        default: associations.fileDefault,
        supported: associations.files,
    };
    const customFolders = {
        default: associations.folderDefault,
        supported: associations.folders,
    };
    generateManifest(customFiles, customFolders);
}
exports.applyCustomization = applyCustomization;
function generateManifest(customFiles, customFolders) {
    const iconGenerator = new iconManifest.IconGenerator(vscode, iconManifest.schema);
    const presets = vscode_extensions_1.getConfig().vsicons.presets;
    let workingCustomFiles = customFiles;
    let workingCustomFolders = customFolders;
    if (customFiles) {
        // check presets...
        workingCustomFiles = iconManifest.toggleAngularPreset(!presets.angular, customFiles);
        workingCustomFiles = iconManifest.toggleOfficialIconsPreset(!presets.jsOfficial, workingCustomFiles, ['js_official'], ['js']);
        workingCustomFiles = iconManifest.toggleOfficialIconsPreset(!presets.tsOfficial, workingCustomFiles, ['typescript_official', 'typescriptdef_official'], ['typescript', 'typescriptdef']);
        workingCustomFiles = iconManifest.toggleOfficialIconsPreset(!presets.jsonOfficial, workingCustomFiles, ['json_official'], ['json']);
    }
    if (customFolders) {
        workingCustomFolders = iconManifest.toggleFoldersAllDefaultIconPreset(presets.foldersAllDefaultIcon, customFolders);
        workingCustomFolders = iconManifest.toggleHideFoldersPreset(presets.hideFolders, workingCustomFolders);
    }
    // presets affecting default icons
    const workingFiles = iconManifest.toggleAngularPreset(!presets.angular, supportedExtensions_1.extensions);
    let workingFolders = iconManifest.toggleFoldersAllDefaultIconPreset(presets.foldersAllDefaultIcon, supportedFolders_1.extensions);
    workingFolders = iconManifest.toggleHideFoldersPreset(presets.hideFolders, workingFolders);
    const json = iconManifest.mergeConfig(workingCustomFiles, workingFiles, workingCustomFolders, workingFolders, iconGenerator);
    iconGenerator.persist(settings_1.extensionSettings.iconJsonFileName, json);
}
function restoreManifest() {
    const iconGenerator = new iconManifest.IconGenerator(vscode, iconManifest.schema, true);
    const json = iconManifest.mergeConfig(null, supportedExtensions_1.extensions, null, supportedFolders_1.extensions, iconGenerator);
    iconGenerator.persist(settings_1.extensionSettings.iconJsonFileName, json);
}
function resetProjectDetectionDefaults() {
    const conf = vscode_extensions_1.getConfig();
    if (conf.vsicons.projectDetection.autoReload) {
        conf.update('vsicons.projectDetection.autoReload', false, true);
    }
    if (conf.vsicons.projectDetection.disableDetect) {
        conf.update('vsicons.projectDetection.disableDetect', false, true);
    }
}
//# sourceMappingURL=index.js.map