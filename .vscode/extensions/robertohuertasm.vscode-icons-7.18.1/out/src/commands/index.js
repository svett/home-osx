"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_extensions_1 = require("../utils/vscode-extensions");
const i18n_1 = require("../i18n");
const iconManifest = require("../icon-manifest");
const supportedExtensions_1 = require("../icon-manifest/supportedExtensions");
const supportedFolders_1 = require("../icon-manifest/supportedFolders");
const manifestReader_1 = require("../icon-manifest/manifestReader");
const models = require("../models");
const settings_1 = require("../settings");
const init_1 = require("../init");
const helper = require("./helper");
const _1 = require("../");
const constants_1 = require("../constants");
const i18nManager = new i18n_1.LanguageResourceManager(vscode.env.language);
const settingsManager = new settings_1.SettingsManager(vscode);
const initVSIconsConfig = vscode_extensions_1.getVsiconsConfig();
let doReload;
let customMsgShown;
let cb;
let argms;
vscode.workspace.onDidChangeConfiguration(didChangeConfigurationListener);
function didChangeConfigurationListener() {
    if (!_1.initialized) {
        return;
    }
    // Update the status in settings
    const status = vscode_extensions_1.getConfig().inspect(constants_1.constants.vscode.iconThemeSetting).globalValue === constants_1.constants.extensionName
        ? models.ExtensionStatus.enabled
        : models.ExtensionStatus.notActivated;
    if (settingsManager.getState().status !== status) {
        settingsManager.updateStatus(status);
    }
    if (doReload) {
        doReload = false;
        // 'vscode' team still hasn't fixed this: In case the 'user settings' file has just been created
        // a delay needs to be introduced in order for the preset change to get persisted on disk.
        setTimeout(() => {
            executeAndReload(cb, ...argms);
        }, 500);
    }
    else if (!customMsgShown) {
        init_1.manageApplyCustomizations(initVSIconsConfig, vscode_extensions_1.getVsiconsConfig(), applyCustomizationCommand, [{ title: i18nManager.getMessage(models.LangResourceKeys.dontShowThis) }]);
    }
}
function registerCommands(context) {
    registerCommand(context, 'activateIcons', activationCommand);
    registerCommand(context, 'regenerateIcons', applyCustomizationCommand);
    registerCommand(context, 'restoreIcons', restoreDefaultManifestCommand);
    registerCommand(context, 'resetProjectDetectionDefaults', resetProjectDetectionDefaultsCommand);
    registerCommand(context, 'ngPreset', toggleAngularPresetCommand);
    registerCommand(context, 'jsPreset', toggleJsPresetCommand);
    registerCommand(context, 'tsPreset', toggleTsPresetCommand);
    registerCommand(context, 'jsonPreset', toggleJsonPresetCommand);
    registerCommand(context, 'hideFoldersPreset', toggleHideFoldersPresetCommand);
    registerCommand(context, 'foldersAllDefaultIconPreset', toggleFoldersAllDefaultIconPresetCommand);
    registerCommand(context, 'hideExplorerArrowsPreset', toggleHideExplorerArrowsPresetCommand);
}
exports.registerCommands = registerCommands;
function registerCommand(context, name, callback) {
    const command = vscode.commands.registerCommand(`${constants_1.constants.extensionName}.${name}`, callback);
    context.subscriptions.push(command);
    return command;
}
function activationCommand() {
    vscode_extensions_1.getConfig().update(constants_1.constants.vscode.iconThemeSetting, constants_1.constants.extensionName, true);
}
exports.activationCommand = activationCommand;
function applyCustomizationCommand(additionalTitles = []) {
    const message = i18nManager.getMessage(models.LangResourceKeys.iconCustomization, ' ', models.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models.LangResourceKeys.reload) }, ...additionalTitles], applyCustomization);
}
exports.applyCustomizationCommand = applyCustomizationCommand;
function restoreDefaultManifestCommand() {
    const message = i18nManager.getMessage(models.LangResourceKeys.iconRestore, ' ', models.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models.LangResourceKeys.reload) }], restoreManifest);
}
function resetProjectDetectionDefaultsCommand() {
    const message = i18nManager.getMessage(models.LangResourceKeys.projectDetectionReset, ' ', models.LangResourceKeys.restart);
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models.LangResourceKeys.reload) }], resetProjectDetectionDefaults);
}
function toggleAngularPresetCommand() {
    togglePreset(models.PresetNames.angular, 'ngPreset', false, false);
}
function toggleJsPresetCommand() {
    togglePreset(models.PresetNames.jsOfficial, 'jsOfficialPreset');
}
function toggleTsPresetCommand() {
    togglePreset(models.PresetNames.tsOfficial, 'tsOfficialPreset');
}
function toggleJsonPresetCommand() {
    togglePreset(models.PresetNames.jsonOfficial, 'jsonOfficialPreset');
}
function toggleHideFoldersPresetCommand() {
    togglePreset(models.PresetNames.hideFolders, 'hideFoldersPreset', true);
}
function toggleFoldersAllDefaultIconPresetCommand() {
    togglePreset(models.PresetNames.foldersAllDefaultIcon, 'foldersAllDefaultIconPreset', true);
}
function toggleHideExplorerArrowsPresetCommand() {
    togglePreset(models.PresetNames.hideExplorerArrows, 'hideExplorerArrowsPreset', true);
}
function togglePreset(presetName, presetKey, reverseAction = false, global = true) {
    const preset = models.PresetNames[presetName];
    const toggledValue = helper.isNonIconsRelatedPreset(presetName)
        ? !vscode_extensions_1.getVsiconsConfig().presets[preset]
        : helper.isFoldersRelated(presetName)
            ? manifestReader_1.ManifestReader.folderIconsDisabled(helper.getFunc(preset))
            : manifestReader_1.ManifestReader.iconsDisabled(helper.getIconName(preset));
    const action = reverseAction
        ? toggledValue
            ? 'Disabled'
            : 'Enabled'
        : toggledValue
            ? 'Enabled'
            : 'Disabled';
    if (!Reflect.has(models.LangResourceKeys, `${presetKey}${action}`)) {
        throw Error(`${presetKey}${action} is not valid`);
    }
    const message = `${i18nManager.getMessage(models.LangResourceKeys[`${presetKey}${action}`], ' ', models.LangResourceKeys.restart)}`;
    showCustomizationMessage(message, [{ title: i18nManager.getMessage(models.LangResourceKeys.reload) }], applyCustomization, preset, toggledValue, global);
}
function updatePreset(preset, toggledValue, global = true) {
    const removePreset = vscode_extensions_1.getConfig().inspect(`vsicons.presets.${preset}`).defaultValue === toggledValue;
    return vscode_extensions_1.getConfig().update(`vsicons.presets.${preset}`, removePreset ? undefined : toggledValue, global);
}
exports.updatePreset = updatePreset;
function showCustomizationMessage(message, items, callback, ...args) {
    customMsgShown = true;
    return vscode.window.showInformationMessage(message, ...items)
        .then(btn => handleAction(btn, callback, ...args), 
    // tslint:disable-next-line:no-console
        reason => console.info('Rejected because: ', reason));
}
exports.showCustomizationMessage = showCustomizationMessage;
function executeAndReload(callback, ...args) {
    if (callback) {
        callback(...args);
    }
    reload();
}
function handleAction(btn, callback, ...args) {
    if (!btn) {
        customMsgShown = false;
        return;
    }
    cb = callback;
    argms = args;
    const handlePreset = () => {
        // If the preset is the same as the toggle value then trigger an explicit reload
        // Note: This condition works also for auto-reload handling
        if (vscode_extensions_1.getConfig().vsicons.presets[args[0]] === args[1]) {
            executeAndReload(callback, ...args);
        }
        else {
            if (args.length !== 3) {
                throw new Error('Arguments mismatch');
            }
            doReload = true;
            updatePreset(args[0], args[1], args[2]);
        }
    };
    switch (btn.title) {
        case i18nManager.getMessage(models.LangResourceKeys.dontShowThis):
            {
                doReload = false;
                if (!callback) {
                    break;
                }
                switch (callback.name) {
                    case 'applyCustomization':
                        {
                            customMsgShown = false;
                            vscode_extensions_1.getConfig().update(constants_1.constants.vsicons.dontShowConfigManuallyChangedMessageSetting, true, true);
                        }
                        break;
                    default:
                        break;
                }
            }
            break;
        case i18nManager.getMessage(models.LangResourceKeys.disableDetect):
            {
                doReload = false;
                vscode_extensions_1.getConfig().update(constants_1.constants.vsicons.projectDetectionDisableDetectSetting, true, true);
            }
            break;
        case i18nManager.getMessage(models.LangResourceKeys.autoReload):
            {
                vscode_extensions_1.getConfig().update(constants_1.constants.vsicons.projectDetectionAutoReloadSetting, true, true)
                    .then(() => handlePreset());
            }
            break;
        case i18nManager.getMessage(models.LangResourceKeys.reload):
            {
                if (!args || args.length !== 3) {
                    executeAndReload(callback, ...args);
                    break;
                }
                handlePreset();
            }
            break;
        default:
            break;
    }
}
function reload() {
    vscode.commands.executeCommand(constants_1.constants.vscode.reloadWindowActionSetting);
}
exports.reload = reload;
function applyCustomization(projectDetectionResult = null) {
    const associations = vscode_extensions_1.getVsiconsConfig().associations;
    const customFiles = {
        default: associations.fileDefault,
        supported: associations.files,
    };
    const customFolders = {
        default: associations.folderDefault,
        supported: associations.folders,
    };
    generateManifest(customFiles, customFolders, projectDetectionResult);
}
exports.applyCustomization = applyCustomization;
function generateManifest(customFiles, customFolders, projectDetectionResult = null) {
    const vsicons = vscode_extensions_1.getVsiconsConfig();
    const iconGenerator = new iconManifest.IconGenerator(vscode, iconManifest.schema, vsicons.customIconFolderPath);
    const hasProjectDetectionResult = projectDetectionResult &&
        typeof projectDetectionResult === 'object' &&
        'value' in projectDetectionResult;
    const angularPreset = hasProjectDetectionResult
        ? projectDetectionResult.value
        : vsicons.presets.angular;
    let workingCustomFiles = customFiles;
    let workingCustomFolders = customFolders;
    if (customFiles) {
        // check presets...
        workingCustomFiles = iconManifest.toggleAngularPreset(!angularPreset, customFiles);
        workingCustomFiles = iconManifest.toggleOfficialIconsPreset(!vsicons.presets.jsOfficial, workingCustomFiles, [models.IconNames.jsOfficial], [models.IconNames.js]);
        workingCustomFiles = iconManifest.toggleOfficialIconsPreset(!vsicons.presets.tsOfficial, workingCustomFiles, [models.IconNames.tsOfficial, models.IconNames.tsDefOfficial], [models.IconNames.ts, models.IconNames.tsDef]);
        workingCustomFiles = iconManifest.toggleOfficialIconsPreset(!vsicons.presets.jsonOfficial, workingCustomFiles, [models.IconNames.jsonOfficial], [models.IconNames.json]);
    }
    if (customFolders) {
        workingCustomFolders = iconManifest.toggleFoldersAllDefaultIconPreset(vsicons.presets.foldersAllDefaultIcon, customFolders);
        workingCustomFolders = iconManifest.toggleHideFoldersPreset(vsicons.presets.hideFolders, workingCustomFolders);
    }
    // presets affecting default icons
    const workingFiles = iconManifest.toggleAngularPreset(!angularPreset, supportedExtensions_1.extensions);
    let workingFolders = iconManifest.toggleFoldersAllDefaultIconPreset(vsicons.presets.foldersAllDefaultIcon, supportedFolders_1.extensions);
    workingFolders = iconManifest.toggleHideFoldersPreset(vsicons.presets.hideFolders, workingFolders);
    const json = iconManifest.mergeConfig(workingCustomFiles, workingFiles, workingCustomFolders, workingFolders, iconGenerator);
    // apply non icons related config settings
    json.hidesExplorerArrows = vsicons.presets.hideExplorerArrows;
    iconGenerator.persist(settings_1.extensionSettings.iconJsonFileName, json);
}
function restoreManifest() {
    const iconGenerator = new iconManifest.IconGenerator(vscode, iconManifest.schema, '', /*avoidCustomDetection*/ true);
    const json = iconGenerator.generateJson(supportedExtensions_1.extensions, supportedFolders_1.extensions);
    iconGenerator.persist(settings_1.extensionSettings.iconJsonFileName, json);
}
function resetProjectDetectionDefaults() {
    const conf = vscode_extensions_1.getConfig();
    if (conf.vsicons.projectDetection.autoReload) {
        conf.update(constants_1.constants.vsicons.projectDetectionAutoReloadSetting, false, true);
    }
    if (conf.vsicons.projectDetection.disableDetect) {
        conf.update(constants_1.constants.vsicons.projectDetectionDisableDetectSetting, false, true);
    }
}
//# sourceMappingURL=index.js.map