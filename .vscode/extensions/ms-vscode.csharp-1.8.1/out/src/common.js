/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
let extensionPath;
function setExtensionPath(path) {
    extensionPath = path;
}
exports.setExtensionPath = setExtensionPath;
function getExtensionPath() {
    if (!extensionPath) {
        throw new Error('Failed to set extension path');
    }
    return extensionPath;
}
exports.getExtensionPath = getExtensionPath;
function getBinPath() {
    return path.resolve(getExtensionPath(), "bin");
}
exports.getBinPath = getBinPath;
function isBoolean(obj) {
    return obj === true || obj === false;
}
exports.isBoolean = isBoolean;
function sum(arr, selector) {
    return arr.reduce((prev, curr) => prev + selector(curr), 0);
}
exports.sum = sum;
/** Retrieve the length of an array. Returns 0 if the array is `undefined`. */
function safeLength(arr) {
    return arr ? arr.length : 0;
}
exports.safeLength = safeLength;
function buildPromiseChain(array, builder) {
    return array.reduce((promise, n) => promise.then(() => builder(n)), Promise.resolve(null));
}
exports.buildPromiseChain = buildPromiseChain;
function execChildProcess(command, workingDirectory = getExtensionPath()) {
    return new Promise((resolve, reject) => {
        cp.exec(command, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else if (stderr && stderr.length > 0) {
                reject(new Error(stderr));
            }
            else {
                resolve(stdout);
            }
        });
    });
}
exports.execChildProcess = execChildProcess;
function fileExists(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (stats && stats.isFile()) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
exports.fileExists = fileExists;
var InstallFileType;
(function (InstallFileType) {
    InstallFileType[InstallFileType["Begin"] = 0] = "Begin";
    InstallFileType[InstallFileType["Lock"] = 1] = "Lock";
})(InstallFileType = exports.InstallFileType || (exports.InstallFileType = {}));
function getInstallFilePath(type) {
    let installFile = 'install.' + InstallFileType[type];
    return path.resolve(getExtensionPath(), installFile);
}
function installFileExists(type) {
    return fileExists(getInstallFilePath(type));
}
exports.installFileExists = installFileExists;
function touchInstallFile(type) {
    return new Promise((resolve, reject) => {
        fs.writeFile(getInstallFilePath(type), '', err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
exports.touchInstallFile = touchInstallFile;
function deleteInstallFile(type) {
    return new Promise((resolve, reject) => {
        fs.unlink(getInstallFilePath(type), err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
exports.deleteInstallFile = deleteInstallFile;
//# sourceMappingURL=common.js.map