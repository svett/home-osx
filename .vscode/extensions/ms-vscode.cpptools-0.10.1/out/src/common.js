"use strict";
var path = require('path');
var fs = require('fs');
var os = require('os');
var child_process = require('child_process');
var extensionPath;
function setExtensionPath(path) {
    extensionPath = path;
}
exports.setExtensionPath = setExtensionPath;
function getExtensionPath() {
    if (!extensionPath) {
        throw new Error("Failed to set extension path");
    }
    return extensionPath;
}
exports.getExtensionPath = getExtensionPath;
function getDebugAdaptersPath() {
    return path.resolve(getExtensionPath(), "debugAdapters");
}
exports.getDebugAdaptersPath = getDebugAdaptersPath;
function checkLockFile() {
    return checkFileExists(getInstallLockPath());
}
exports.checkLockFile = checkLockFile;
function touchLockFile() {
    return new Promise(function (resolve, reject) {
        fs.writeFile(getInstallLockPath(), "", function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
exports.touchLockFile = touchLockFile;
function checkFileExists(filePath) {
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
exports.checkFileExists = checkFileExists;
function readFileText(filePath, encoding) {
    if (encoding === void 0) { encoding = "utf8"; }
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, encoding, function (err, data) {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}
exports.readFileText = readFileText;
function writeFileText(filePath, content, encoding) {
    if (encoding === void 0) { encoding = "utf8"; }
    return new Promise(function (resolve, reject) {
        fs.writeFile(filePath, content, encoding, function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
exports.writeFileText = writeFileText;
function getInstallLockPath() {
    return path.resolve(getExtensionPath(), "install.lock");
}
exports.getInstallLockPath = getInstallLockPath;
function getReadmeMessage() {
    var readmePath = path.resolve(getExtensionPath(), "README.md");
    var readmeMessage = "Please refer to " + readmePath + " for troubleshooting information. Issues can be created at https://github.com/Microsoft/vscppsamples/issues";
    return readmeMessage;
}
exports.getReadmeMessage = getReadmeMessage;
function logToFile(message) {
    var logFolder = path.resolve(getExtensionPath(), "extension.log");
    fs.writeFileSync(logFolder, "" + message + os.EOL, { flag: 'a' });
}
exports.logToFile = logToFile;
function execChildProcess(process, workingDirectory, channel) {
    return new Promise(function (resolve, reject) {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, function (error, stdout, stderr) {
            if (channel) {
                var message = "";
                var err = false;
                if (stdout && stdout.length > 0) {
                    message += stdout;
                }
                if (stderr && stderr.length > 0) {
                    message += stderr;
                    err = true;
                }
                if (error) {
                    message += error.message;
                    err = true;
                }
                if (err) {
                    channel.append(message);
                    channel.show();
                }
            }
            if (error) {
                reject(error);
                return;
            }
            if (stderr && stderr.length > 0) {
                reject(new Error(stderr));
                return;
            }
            resolve(stdout);
        });
    });
}
exports.execChildProcess = execChildProcess;
function spawnChildProcess(process, args, workingDirectory, dataCallback, errorCallback) {
    return new Promise(function (resolve, reject) {
        var child = child_process.spawn(process, args, { cwd: workingDirectory });
        child.stdout.on('data', function (data) {
            dataCallback("" + data);
        });
        child.stderr.on('data', function (data) {
            errorCallback("" + data);
        });
        child.on('exit', function (code) {
            if (code !== 0) {
                reject(new Error(process + " exited with error code " + code));
            }
            else {
                resolve();
            }
        });
    });
}
exports.spawnChildProcess = spawnChildProcess;
//# sourceMappingURL=common.js.map