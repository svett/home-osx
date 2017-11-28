"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const os = require("os");
const models_1 = require("../models");
exports.vscode = {
    env: { appName: 'Code' },
    version: '1000.0.0',
};
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
function tempPath() {
    return os.tmpdir();
}
exports.tempPath = tempPath;
function fileFormatToString(extension) {
    return `.${typeof extension === 'string' ? extension.trim() : models_1.FileFormat[extension]}`;
}
exports.fileFormatToString = fileFormatToString;
/**
 * Creates a directory and all subdirectories synchronously
 *
 * @param {any} dirPath The directory's path
 */
function createDirectoryRecursively(dirPath) {
    dirPath.split(path.posix.sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(parentDir, childDir);
        if (!fs.existsSync(curDir)) {
            fs.mkdirSync(curDir);
        }
        return curDir;
    }, path.isAbsolute(dirPath) ? path.posix.sep : '');
}
exports.createDirectoryRecursively = createDirectoryRecursively;
/**
 * Deletes a directory and all subdirectories synchronously
 *
 * @param {any} dirPath The directory's path
 */
function deleteDirectoryRecursively(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            const curPath = `${dirPath}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteDirectoryRecursively(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
}
exports.deleteDirectoryRecursively = deleteDirectoryRecursively;
/**
 * Converts a JavaScript Object Notation (JSON) string into an object
 * without throwing an exception.
 *
 * @param {string} text A valid JSON string.
 */
function parseJSON(text) {
    try {
        return JSON.parse(text);
    }
    catch (err) {
        return null;
    }
}
exports.parseJSON = parseJSON;
function getRelativePath(fromDirPath, toDirName, checkDirectory = true) {
    if (fromDirPath == null) {
        throw new Error('fromDirPath not defined.');
    }
    if (toDirName == null) {
        throw new Error('toDirName not defined.');
    }
    if (checkDirectory && !fs.existsSync(toDirName)) {
        throw new Error(`Directory '${toDirName}' not found.`);
    }
    return path.relative(fromDirPath, toDirName).replace(/\\/g, '/').concat('/');
}
exports.getRelativePath = getRelativePath;
function removeFirstDot(txt) {
    return txt.indexOf('.') === 0 ? txt.substring(1, txt.length) : txt;
}
exports.removeFirstDot = removeFirstDot;
function belongToSameDrive(path1, path2) {
    const [val1, val2] = this.getDrives(path1, path2);
    return val1 === val2;
}
exports.belongToSameDrive = belongToSameDrive;
function overwriteDrive(sourcePath, destPath) {
    const [val1, val2] = this.getDrives(sourcePath, destPath);
    return destPath.replace(val2, val1);
}
exports.overwriteDrive = overwriteDrive;
function getDrives(...paths) {
    const rx = new RegExp('^[a-zA-Z]:');
    return paths.map(x => (rx.exec(x) || [])[0]);
}
exports.getDrives = getDrives;
function flatten(obj, separator = '.') {
    const isValidObject = (value) => {
        if (!value) {
            return false;
        }
        const isArray = Array.isArray(value);
        const isBuffer = Buffer.isBuffer(value);
        const isΟbject = Object.prototype.toString.call(value) === '[object Object]';
        const hasKeys = !!Object.keys(value).length;
        return !isArray && !isBuffer && isΟbject && hasKeys;
    };
    const _flatten = (child, paths = []) => {
        return [].concat(...Object.keys(child)
            .map(key => isValidObject(child[key])
            ? _flatten(child[key], [...paths, key])
            : { [[...paths, key].join(separator)]: child[key] }));
    };
    return Object.assign({}, ..._flatten(obj));
}
exports.flatten = flatten;
function getEnumMemberByValue(obj, enumValue) {
    if (typeof obj !== 'object') {
        throw new Error('Only Enum allowed');
    }
    return Object.keys(obj).find(key => obj[key] === enumValue);
}
exports.getEnumMemberByValue = getEnumMemberByValue;
function combine(array1, array2, separator = '.') {
    return array1.reduce((previous, current) => previous.concat(array2.map(value => [current, value].join(separator))), []);
}
exports.combine = combine;
//# sourceMappingURL=index.js.map