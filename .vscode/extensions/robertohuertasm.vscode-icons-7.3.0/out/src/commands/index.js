"use strict";
const vscode = require("vscode");
const vscode_extensions_1 = require("../utils/vscode-extensions");
const i18n_1 = require("../i18n");
const icon_manifest_1 = require("../icon-manifest");
const supportedExtensions_1 = require("../icon-manifest/supportedExtensions");
const supportedFolders_1 = require("../icon-manifest/supportedFolders");
const models_1 = require("../models");
const settings_1 = require("../settings");
const i18nManager = new i18n_1.LanguageResourceManager(vscode.env.language);
function registerCommands(context) {
    registerCommand(context, 'regenerateIcons', applyCustomizationCommand);
    registerCommand(context, 'restoreIcons', restoreDefaultManifestCommand);
    registerCommand(context, 'resetProjectDetectionDefaults', resetProjectDetectionDefaultsCommand);
    registerCommand(context, 'ngPreset', toggleAngularPresetCommand);
    registerCommand(context, 'jsPreset', toggleJsPresetCommand);
    registerCommand(context, 'tsPreset', toggleTsPresetCommand);
    registerCommand(context, 'jsonPreset', toggleJsonPresetCommand);
    registerCommand(context, 'hideFoldersPreset', toggleHideFoldersCommand);
}
exports.registerCommands = registerCommands;
function registerCommand(context, name, callback) {
    const command = vscode.commands.registerCommand(`extension.${name}`, callback);
    context.subscriptions.push(command);
    return command;
}
function applyCustomizationCommand() {
    const message = i18nManager.getMessage(models_1.LangResourceKeys.iconCustomizationMessage, models_1.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], applyCustomization);
}
exports.applyCustomizationCommand = applyCustomizationCommand;
function restoreDefaultManifestCommand() {
    const message = i18nManager.getMessage(models_1.LangResourceKeys.iconRestoreMessage, models_1.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], restoreManifest);
}
function resetProjectDetectionDefaultsCommand() {
    const message = i18nManager.getMessage(models_1.LangResourceKeys.projectDetecticonResetMessage, models_1.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], resetProjectDetectionDefaults);
}
function togglePreset(preset, presetMessage, reverseAction = false, global = true) {
    const value = getToggleValue(preset);
    let actionMessage;
    if (reverseAction) {
        actionMessage = value
            ? i18nManager.getMessage(models_1.LangResourceKeys.disabled)
            : i18nManager.getMessage(models_1.LangResourceKeys.enabled);
    }
    else {
        actionMessage = value
            ? i18nManager.getMessage(models_1.LangResourceKeys.enabled)
            : i18nManager.getMessage(models_1.LangResourceKeys.disabled);
    }
    const message = `${presetMessage} ${actionMessage}. ${i18nManager.getMessage(models_1.LangResourceKeys.restart)}`;
    const { defaultValue, globalValue, workspaceValue } = vscode_extensions_1.getConfig().inspect(`vsicons.presets.${preset}`);
    const initValue = (global ? globalValue : workspaceValue);
    updatePreset(preset, value, defaultValue, global);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models_1.LangResourceKeys.reload) }], applyCustomization, cancel, preset, !value, initValue, global);
}
function toggleAngularPresetCommand() {
    togglePreset('angular', i18nManager.getMessage(models_1.LangResourceKeys.ngPresetMessage), false, false);
}
function toggleJsPresetCommand() {
    togglePreset('jsOfficial', i18nManager.getMessage(models_1.LangResourceKeys.jsOfficialPresetMessage));
}
function toggleTsPresetCommand() {
    togglePreset('tsOfficial', i18nManager.getMessage(models_1.LangResourceKeys.tsOfficialPresetMessage));
}
function toggleJsonPresetCommand() {
    togglePreset('jsonOfficial', i18nManager.getMessage(models_1.LangResourceKeys.jsonOfficialPresetMessage));
}
function toggleHideFoldersCommand() {
    togglePreset('hideFolders', i18nManager.getMessage(models_1.LangResourceKeys.hideFoldersPresetMessage), true);
}
function getToggleValue(preset) {
    return !vscode_extensions_1.getConfig().vsicons.presets[preset];
}
function updatePreset(preset, newvalue, initValue, global = true) {
    return vscode_extensions_1.getConfig().update(`vsicons.presets.${preset}`, initValue === undefined ? initValue : newvalue, global);
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
            callback(...args);
        }
        reload();
    }, (reason) => {
        // tslint:disable-next-line:no-console
        console.log('Rejected because: ', reason);
        return;
    });
}
exports.showCustomizationMessage = showCustomizationMessage;
function reload() {
    vscode.commands.executeCommand('workbench.action.reloadWindow');
}
exports.reload = reload;
function cancel(preset, value, initValue, global = true) {
    updatePreset(preset, value, initValue, global);
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
    const iconGenerator = new icon_manifest_1.IconGenerator(vscode, icon_manifest_1.schema);
    const presets = vscode_extensions_1.getConfig().vsicons.presets;
    let workingCustomFiles = customFiles;
    let workingCustomFolders = customFolders;
    if (customFiles) {
        // check presets...
        workingCustomFiles = icon_manifest_1.toggleAngularPreset(!presets.angular, customFiles);
        workingCustomFiles = icon_manifest_1.toggleOfficialIconsPreset(!presets.jsOfficial, workingCustomFiles, ['js_official'], ['js']);
        workingCustomFiles = icon_manifest_1.toggleOfficialIconsPreset(!presets.tsOfficial, workingCustomFiles, ['typescript_official', 'typescriptdef_official'], ['typescript', 'typescriptdef']);
        workingCustomFiles = icon_manifest_1.toggleOfficialIconsPreset(!presets.jsonOfficial, workingCustomFiles, ['json_official'], ['json']);
    }
    if (customFolders) {
        workingCustomFolders = icon_manifest_1.toggleHideFoldersPreset(presets.hideFolders, workingCustomFolders);
    }
    // presets affecting default icons
    const workingFiles = icon_manifest_1.toggleAngularPreset(!presets.angular, supportedExtensions_1.extensions);
    const workingFolders = icon_manifest_1.toggleHideFoldersPreset(presets.hideFolders, supportedFolders_1.extensions);
    const json = icon_manifest_1.mergeConfig(workingCustomFiles, workingFiles, workingCustomFolders, workingFolders, iconGenerator);
    iconGenerator.persist(settings_1.extensionSettings.iconJsonFileName, json);
}
function restoreManifest() {
    const iconGenerator = new icon_manifest_1.IconGenerator(vscode, icon_manifest_1.schema, true);
    const json = icon_manifest_1.mergeConfig(null, supportedExtensions_1.extensions, null, supportedFolders_1.extensions, iconGenerator);
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