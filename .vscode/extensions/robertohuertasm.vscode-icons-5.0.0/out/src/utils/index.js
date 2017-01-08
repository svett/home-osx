"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const models_1 = require("../models");
exports.vscode = {
    env: { appName: 'Code' },
    version: '1000.0.0',
};
function isCodeContext() {
    return process.execPath.indexOf('code.exe') >= 0;
}
exports.isCodeContext = isCodeContext;
function pathUnixJoin(...paths) {
    return path.posix.join(...paths);
}
exports.pathUnixJoin = pathUnixJoin;
function vscodePath() {
    switch (process.platform) {
        case 'darwin':
            return `${process.env.HOME}/Library/Application Support`;
        case 'linux':
            return `${os.homedir()}/.config`;
        case 'win32':
            return process.env.APPDATA;
        default:
            return '/var/local';
    }
}
exports.vscodePath = vscodePath;
;
function tempPath() {
    return os.tmpdir();
}
exports.tempPath = tempPath;
;
function fileFormatToString(extension) {
    return `.${typeof extension === 'string' ? extension.trim() : models_1.FileFormat[extension]}`;
}
exports.fileFormatToString = fileFormatToString;
/**
 * Deletes a directory and all subdirectories
 *
 * @param {any} path The directory's path
 */
function deleteDirectoryRecursively(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(file => {
            const curPath = `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteDirectoryRecursively(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
exports.deleteDirectoryRecursively = deleteDirectoryRecursively;
//# sourceMappingURL=index.js.map