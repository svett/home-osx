"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models = require("../models");
function isFolders(preset) {
    return preset.toLowerCase().includes('folders');
}
exports.isFolders = isFolders;
function getFunc(preset) {
    switch (preset) {
        case 'hideFolders':
            return (iconsJson) => Object.keys(iconsJson.folderNames).length === 0 &&
                iconsJson.iconDefinitions._folder.iconPath === '';
        case 'foldersAllDefaultIcon':
            return (iconsJson) => Object.keys(iconsJson.folderNames).length === 0 &&
                iconsJson.iconDefinitions._folder.iconPath !== '';
        default:
            throw new Error('Not Implemented');
    }
}
exports.getFunc = getFunc;
function getIconName(preset) {
    const iconName = models.IconNames[preset];
    if (!iconName) {
        throw new Error('Not Implemented');
    }
    return iconName;
}
exports.getIconName = getIconName;
//# sourceMappingURL=helper.js.map