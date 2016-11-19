/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var extensionPath;
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
function buildPromiseChain(array, builder) {
    return array.reduce(function (promise, n) { return promise.then(function () { return builder(n); }); }, Promise.resolve(null));
}
exports.buildPromiseChain = buildPromiseChain;
function execChildProcess(command, workingDirectory) {
    if (workingDirectory === void 0) { workingDirectory = getExtensionPath(); }
    return new Promise(function (resolve, reject) {
        cp.exec(command, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, function (error, stdout, stderr) {
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
    return new Promise(function (resolve, reject) {
        fs.stat(filePath, function (err, stats) {
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
(function (InstallFileType) {
    InstallFileType[InstallFileType["Begin"] = 0] = "Begin";
    InstallFileType[InstallFileType["Lock"] = 1] = "Lock";
})(exports.InstallFileType || (exports.InstallFileType = {}));
var InstallFileType = exports.InstallFileType;
function getInstallFilePath(type) {
    var installFile = 'install.' + InstallFileType[type];
    return path.resolve(getExtensionPath(), installFile);
}
function installFileExists(type) {
    return fileExists(getInstallFilePath(type));
}
exports.installFileExists = installFileExists;
function touchInstallFile(type) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(getInstallFilePath(type), '', function (err) {
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
    return new Promise(function (resolve, reject) {
        fs.unlink(getInstallFilePath(type), function (err) {
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