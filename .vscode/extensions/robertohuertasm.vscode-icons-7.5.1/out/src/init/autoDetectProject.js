"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const models = require("../models");
const settings_1 = require("../settings");
const utils_1 = require("../utils");
function detectProject(findFiles, config) {
    if (config.projectDetection.disableDetect) {
        return Promise.resolve([]);
    }
    return findFiles('**/package.json', '**/node_modules/**')
        .then(results => results, rej => [rej]);
}
exports.detectProject = detectProject;
function checkForAngularProject(angularPreset, ngIconsDisabled, isNgProject, i18nManager) {
    // We need to mandatory check the following:
    // 1. The 'preset'
    // 2. The project releated icons are present in the manifest file
    // 3. It's a detectable project
    const enableIcons = (!angularPreset || ngIconsDisabled) && isNgProject;
    const disableIcons = (angularPreset || !ngIconsDisabled) && !isNgProject;
    if (enableIcons || disableIcons) {
        const langResourceKey = enableIcons
            ? models.LangResourceKeys.ngDetected
            : models.LangResourceKeys.nonNgDetected;
        const message = i18nManager.getMessage(langResourceKey);
        return { apply: true, message, value: enableIcons || !disableIcons };
    }
    return { apply: false };
}
exports.checkForAngularProject = checkForAngularProject;
function iconsDisabled(name) {
    const manifestFilePath = path.join(__dirname, '..', settings_1.extensionSettings.iconJsonFileName);
    let iconManifest;
    try {
        iconManifest = fs.readFileSync(manifestFilePath, 'utf8');
    }
    catch (err) {
        return true;
    }
    const iconsJson = utils_1.parseJSON(iconManifest);
    if (!iconsJson) {
        return true;
    }
    for (const key in iconsJson.iconDefinitions) {
        if (key.startsWith(`_f_${name}_`)) {
            return false;
        }
    }
    return true;
}
exports.iconsDisabled = iconsDisabled;
function isProject(projectJson, name) {
    switch (name) {
        case 'ng':
            return (projectJson.dependencies && (projectJson.dependencies['@angular/core'] != null)) ||
                (projectJson.devDependencies && (projectJson.devDependencies['@angular/core'] != null)) ||
                false;
        default:
            return false;
    }
}
exports.isProject = isProject;
function applyDetection(i18nManager, message, presetText, value, initValue, defaultValue, autoReload, updatePreset, applyCustomization, showCustomizationMessage, reload, cancel, handleVSCodeDir) {
    return updatePreset(presetText, value, defaultValue, false)
        .then(() => {
        if (autoReload) {
            applyCustomization();
            reload();
            return;
        }
        showCustomizationMessage(message, [{ title: i18nManager.getMessage(models.LangResourceKeys.reload) },
            { title: i18nManager.getMessage(models.LangResourceKeys.autoReload) },
            { title: i18nManager.getMessage(models.LangResourceKeys.disableDetect) }], applyCustomization, cancel, presetText, !value, initValue, false, handleVSCodeDir);
    });
}
exports.applyDetection = applyDetection;
//# sourceMappingURL=autoDetectProject.js.map