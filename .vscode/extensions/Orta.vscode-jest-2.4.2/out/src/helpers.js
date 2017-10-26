"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 *  Handles getting the jest runner, handling the OS and project specific work too
 *
 * @returns {string}
 */
function pathToJest(pluginSettings) {
    const path = path_1.normalize(pluginSettings.pathToJest);
    const defaultPath = path_1.normalize('node_modules/.bin/jest');
    if (path === defaultPath) {
        const defaultCreateReactPath = 'node_modules/react-scripts/node_modules/.bin/jest';
        const defaultCreateReactPathWindows = 'node_modules/react-scripts/node_modules/.bin/jest.cmd';
        const createReactPath = os_1.platform() === 'win32' ? defaultCreateReactPathWindows : defaultCreateReactPath;
        const absolutePath = path_1.join(pluginSettings.rootPath, createReactPath);
        const craExists = fs_1.existsSync(absolutePath);
        if (craExists) {
            // If it's the default, run the script instead
            return os_1.platform() === 'win32' ? 'npm.cmd test --' : 'npm test --';
        }
    }
    // For windows support, see https://github.com/orta/vscode-jest/issues/10
    if (!path.includes('.cmd') && os_1.platform() === 'win32') {
        return path + '.cmd';
    }
    return path;
}
exports.pathToJest = pathToJest;
/**
 * Handles getting the path to config file
 *
 * @returns {string}
 */
function pathToConfig(pluginSettings) {
    if (pluginSettings.pathToConfig !== '') {
        return path_1.normalize(pluginSettings.pathToConfig);
    }
    return '';
}
exports.pathToConfig = pathToConfig;
function pathToJestPackageJSON(pluginSettings) {
    const defaultPath = path_1.normalize('node_modules/jest/package.json');
    const craPath = path_1.normalize('node_modules/react-scripts/node_modules/jest/package.json');
    const paths = [defaultPath, craPath];
    for (const i in paths) {
        const absolutePath = path_1.join(pluginSettings.rootPath, paths[i]);
        if (fs_1.existsSync(absolutePath)) {
            return absolutePath;
        }
    }
    return null;
}
exports.pathToJestPackageJSON = pathToJestPackageJSON;
//# sourceMappingURL=helpers.js.map