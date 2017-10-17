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
function checkForAngularProject(preset, ngIconsDisabled, isNgProject, i18nManager) {
    // NOTE: User setting (preset) bypasses detection in the following cases:
    // 1. Preset is set to 'false' and icons are not present in the manifest file
    // 2. Preset is set to 'true' and icons are present in the manifest file
    // For this cases PAD will not display a message
    const bypass = (preset != null) && ((!preset && ngIconsDisabled) || (preset && !ngIconsDisabled));
    // We need to mandatory check the following:
    // 1. The project related icons are present in the manifest file
    // 2. It's a detectable project
    // 3. The preset (when it's defined)
    const enableIcons = ngIconsDisabled && (isNgProject || (preset === true));
    const disableIcons = !ngIconsDisabled && (!isNgProject || (preset === false));
    if (bypass || (!enableIcons && !disableIcons)) {
        return { apply: false };
    }
    const langResourceKey = enableIcons
        ? models.LangResourceKeys.ngDetected
        : models.LangResourceKeys.nonNgDetected;
    const message = i18nManager.getMessage(langResourceKey);
    return { apply: true, message, value: enableIcons || !disableIcons };
}
exports.checkForAngularProject = checkForAngularProject;
function iconsDisabled(name, isFile = true) {
    const iconManifest = getIconManifest();
    const iconsJson = iconManifest && utils_1.parseJSON(iconManifest);
    return !iconsJson || !Reflect.ownKeys(iconsJson.iconDefinitions)
        .filter(key => key.toString().startsWith(`_${isFile ? 'f' : 'fd'}_${name}`)).length;
}
exports.iconsDisabled = iconsDisabled;
function folderIconsDisabled(func) {
    const iconManifest = getIconManifest();
    const iconsJson = iconManifest && utils_1.parseJSON(iconManifest);
    return !iconsJson || !func(iconsJson);
}
exports.folderIconsDisabled = folderIconsDisabled;
function getIconManifest() {
    const manifestFilePath = path.join(__dirname, '..', settings_1.extensionSettings.iconJsonFileName);
    try {
        return fs.readFileSync(manifestFilePath, 'utf8');
    }
    catch (err) {
        return null;
    }
}
function getProjectInfo(results, name) {
    let projectInfo = null;
    results.forEach(result => {
        const content = fs.readFileSync(result.fsPath, 'utf8');
        const projectJson = utils_1.parseJSON(content);
        projectInfo = getInfo(projectJson, name);
        if (!!projectInfo) {
            return;
        }
    });
    return projectInfo;
}
exports.getProjectInfo = getProjectInfo;
function getInfo(projectJson, name) {
    if (!projectJson) {
        return null;
    }
    const getInfoFn = (key) => {
        const depExists = projectJson.dependencies && (projectJson.dependencies[key] != null);
        if (depExists) {
            return { name, version: projectJson.dependencies[key] };
        }
        const devDepExists = (projectJson.devDependencies && (projectJson.devDependencies[key] != null));
        if (devDepExists) {
            return { name, version: projectJson.devDependencies[key] };
        }
        return null;
    };
    switch (name) {
        case models.Projects.angular:
            return getInfoFn('@angular/core');
        default:
            return null;
    }
}
exports.getInfo = getInfo;
function applyDetection(i18nManager, projectDetectionResult, autoReload, applyCustomizationFn, showCustomizationMessageFn, reloadFn) {
    return new Promise(resolve => {
        if (autoReload) {
            applyCustomizationFn(projectDetectionResult);
            reloadFn();
        }
        else {
            showCustomizationMessageFn(projectDetectionResult.message, [{ title: i18nManager.getMessage(models.LangResourceKeys.reload) },
                { title: i18nManager.getMessage(models.LangResourceKeys.autoReload) },
                { title: i18nManager.getMessage(models.LangResourceKeys.disableDetect) }], applyCustomizationFn, projectDetectionResult);
        }
        resolve();
    });
}
exports.applyDetection = applyDetection;
//# sourceMappingURL=projectAutoDetection.js.map