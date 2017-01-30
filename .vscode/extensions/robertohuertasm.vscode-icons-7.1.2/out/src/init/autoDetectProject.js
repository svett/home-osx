"use strict";
const fs = require("fs");
const path = require("path");
const settings_1 = require("../settings");
const messages_1 = require("../messages");
const utils_1 = require("../utils");
function detectProject(findFiles, config) {
    if (config.projectDetection.disableDetect) {
        return Promise.resolve([]);
    }
    return findFiles('**/package.json', '**/node_modules/**')
        .then((results) => {
        return results && results.length ? results : [];
    }, (rej) => {
        return [rej];
    });
}
exports.detectProject = detectProject;
function checkForAngularProject(angularPreset, ngIconsDisabled, isNgProject) {
    // We need to mandatory check the following:
    // 1. The 'preset'
    // 2. The project releated icons are present in the manifest file
    // 3. It's a detectable project
    const enableIcons = (!angularPreset || ngIconsDisabled) && isNgProject;
    const disableIcons = (angularPreset || !ngIconsDisabled) && !isNgProject;
    if (enableIcons || disableIcons) {
        const message = enableIcons ? messages_1.messages.ngDetected : messages_1.messages.nonNgDetected;
        return { apply: true, message, value: enableIcons || !disableIcons };
    }
    return { apply: false };
}
exports.checkForAngularProject = checkForAngularProject;
function iconsDisabled(name) {
    const manifestFilePath = path.join(__dirname, '..', settings_1.extensionSettings.iconJsonFileName);
    const iconManifest = fs.readFileSync(manifestFilePath, 'utf8');
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
            return (projectJson.dependencies && (projectJson.dependencies['@angular/core'] != null)) || false;
        default:
            return false;
    }
}
exports.isProject = isProject;
function applyDetection(message, presetText, value, autoReload, togglePreset, applyCustomization, reload, cancel, showCustomizationMessage) {
    return togglePreset(presetText, value, false)
        .then(() => {
        // Add a delay in order for vscode to persist the toggle of the preset
        if (autoReload) {
            setTimeout(() => {
                applyCustomization();
                reload();
            }, 1000);
            return;
        }
        showCustomizationMessage(message, [{ title: messages_1.messages.reload }, { title: messages_1.messages.autoReload }, { title: messages_1.messages.disableDetect }], applyCustomization, cancel, presetText, !value, false);
    });
}
exports.applyDetection = applyDetection;
//# sourceMappingURL=autoDetectProject.js.map