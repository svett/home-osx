Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
var extensionPath;
function getExtensionPath() {
    extensionPath = path.resolve(__dirname, '../../../../');
    console.log(extensionPath);
    return extensionPath;
}
exports.getExtensionPath = getExtensionPath;
function getDebugAdaptersPath(file) {
    return path.resolve(getExtensionPath(), "debugAdapters", file);
}
exports.getDebugAdaptersPath = getDebugAdaptersPath;
function checkLockFile() {
    return checkFileExists(getInstallLockPath());
}
exports.checkLockFile = checkLockFile;
function checkFileExists(filePath) {
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
exports.checkFileExists = checkFileExists;
function getInstallLockPath() {
    return path.resolve(getExtensionPath(), `install.lock`);
}
exports.getInstallLockPath = getInstallLockPath;
function logToFile(message) {
    var logFolder = path.resolve(getExtensionPath(), "extension.log");
    fs.writeFileSync(logFolder, `${message}${os.EOL}`, { flag: 'a' });
}
exports.logToFile = logToFile;
//# sourceMappingURL=debugProxyUtils.js.map