"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const os = require("os");
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
function getUnixChildProcessIds(pid) {
    return new Promise((resolve, reject) => {
        let ps = cp.exec('ps -A -o ppid,pid', (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            if (stderr) {
                return reject(stderr);
            }
            if (!stdout) {
                return resolve([]);
            }
            let lines = stdout.split(os.EOL);
            let pairs = lines.map(line => line.trim().split(/\s+/));
            let children = [];
            for (let pair of pairs) {
                let ppid = parseInt(pair[0]);
                if (ppid === pid) {
                    children.push(parseInt(pair[1]));
                }
            }
            resolve(children);
        });
        ps.on('error', reject);
    });
}
exports.getUnixChildProcessIds = getUnixChildProcessIds;
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
function deleteIfExists(filePath) {
    return fileExists(filePath)
        .then((exists) => {
        return new Promise((resolve, reject) => {
            if (!exists) {
                return resolve();
            }
            fs.unlink(filePath, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}
exports.deleteIfExists = deleteIfExists;
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
function convertNativePathToPosix(pathString) {
    let parts = pathString.split(path.sep);
    return parts.join(path.posix.sep);
}
exports.convertNativePathToPosix = convertNativePathToPosix;
/**
 * This function checks to see if a subfolder is part of folder.
 *
 * Assumes subfolder and folder are absolute paths and have consistent casing.
 *
 * @param subfolder subfolder to check if it is part of the folder parameter
 * @param folder folder to check aganist
 */
function isSubfolderOf(subfolder, folder) {
    const subfolderArray = subfolder.split(path.sep);
    const folderArray = folder.split(path.sep);
    // Check to see that every sub directory in subfolder exists in folder.
    return subfolderArray.length <= folderArray.length && subfolderArray.every((subpath, index) => folderArray[index] === subpath);
}
exports.isSubfolderOf = isSubfolderOf;
//# sourceMappingURL=common.js.map