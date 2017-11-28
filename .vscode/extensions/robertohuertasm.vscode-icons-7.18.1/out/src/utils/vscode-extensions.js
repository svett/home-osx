"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const vscode = require("vscode");
function getConfig() {
    return vscode.workspace.getConfiguration();
}
exports.getConfig = getConfig;
function getVsiconsConfig() {
    const config = vscode.workspace.getConfiguration();
    const mergedConfig = config.vsicons;
    const files = config.inspect('vsicons.associations.files');
    const folders = config.inspect('vsicons.associations.folders');
    if (files.workspaceValue && files.globalValue) {
        mergedConfig.associations.files = _.unionWith(files.workspaceValue, files.globalValue, _.isEqual);
    }
    if (folders.workspaceValue && folders.globalValue) {
        mergedConfig.associations.folders = _.unionWith(folders.workspaceValue, folders.globalValue, _.isEqual);
    }
    return mergedConfig;
}
exports.getVsiconsConfig = getVsiconsConfig;
function findFiles(include, exclude, maxResults, token) {
    return vscode.workspace.findFiles(include, exclude, maxResults, token);
}
exports.findFiles = findFiles;
function asRelativePath(pathOrUri) {
    return vscode.workspace.asRelativePath(pathOrUri);
}
exports.asRelativePath = asRelativePath;
//# sourceMappingURL=vscode-extensions.js.map