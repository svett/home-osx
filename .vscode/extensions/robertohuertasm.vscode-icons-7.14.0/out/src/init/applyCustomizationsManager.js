"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const packageJson = require("../../../package.json");
const utils = require("../utils");
function manageAutoApplyCustomizations(isNewVersion, userConfig, applyCustomizationCommandFn) {
    if (!isNewVersion) {
        return;
    }
    const propObj = packageJson.contributes.configuration.properties;
    if (configChanged(propObj, userConfig)) {
        applyCustomizationCommandFn();
    }
}
exports.manageAutoApplyCustomizations = manageAutoApplyCustomizations;
function manageApplyCustomizations(oldConfig, newConfig, applyCustomizationCommandFn, additionalTitles) {
    if (!newConfig.dontShowConfigManuallyChangedMessage && configChanged(utils.flatten(oldConfig), newConfig)) {
        applyCustomizationCommandFn(additionalTitles);
    }
}
exports.manageApplyCustomizations = manageApplyCustomizations;
function configChanged(prevConfig, currentConfig) {
    for (const key of Reflect.ownKeys(prevConfig)) {
        if (!key.includes('presets') && !key.includes('associations')) {
            continue;
        }
        const oldValue = Object.prototype.toString.call(prevConfig[key]) === '[object Object]' &&
            Reflect.has(prevConfig[key], 'default')
            ? prevConfig[key].default
            : prevConfig[key];
        const parts = key.split('.').filter(x => x !== 'vsicons');
        const newValue = parts.reduce((prev, current) => prev[current], currentConfig);
        const cond1 = Array.isArray(oldValue)
            && Array.isArray(newValue)
            && (newValue.length !== _.intersectionWith(oldValue, newValue, _.isEqual).length);
        // this is to equal null == undefined as vscode doesn't respect null defaults
        // tslint:disable-next-line triple-equals
        const cond2 = !Array.isArray(oldValue) && oldValue != newValue;
        if (cond1 || cond2) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=applyCustomizationsManager.js.map