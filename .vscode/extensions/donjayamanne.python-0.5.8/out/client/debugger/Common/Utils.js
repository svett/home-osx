"use strict";
const path = require("path");
const fs = require('fs');
const child_process = require('child_process');
exports.IS_WINDOWS = /^win/.test(process.platform);
exports.PATH_VARIABLE_NAME = exports.IS_WINDOWS ? 'Path' : 'PATH';
const PathValidity = new Map();
function validatePath(filePath) {
    if (filePath.length === 0) {
        return Promise.resolve('');
    }
    if (PathValidity.has(filePath)) {
        return Promise.resolve(PathValidity.get(filePath) ? filePath : '');
    }
    return new Promise(resolve => {
        fs.exists(filePath, exists => {
            PathValidity.set(filePath, exists);
            return resolve(exists ? filePath : '');
        });
    });
}
exports.validatePath = validatePath;
function validatePathSync(filePath) {
    if (filePath.length === 0) {
        return false;
    }
    if (PathValidity.has(filePath)) {
        return PathValidity.get(filePath);
    }
    const exists = fs.existsSync(filePath);
    PathValidity.set(filePath, exists);
    return exists;
}
exports.validatePathSync = validatePathSync;
function CreatePythonThread(id, isWorker, process, name = "") {
    return {
        IsWorkerThread: isWorker,
        Process: process,
        Name: name,
        Id: id,
        Frames: []
    };
}
exports.CreatePythonThread = CreatePythonThread;
function CreatePythonModule(id, fileName) {
    let name = fileName;
    if (typeof fileName === "string") {
        try {
            name = path.basename(fileName);
        }
        catch (ex) {
        }
    }
    else {
        name = "";
    }
    return {
        ModuleId: id,
        Name: name,
        Filename: fileName
    };
}
exports.CreatePythonModule = CreatePythonModule;
function FixupEscapedUnicodeChars(value) {
    return value;
}
exports.FixupEscapedUnicodeChars = FixupEscapedUnicodeChars;
function getPythonExecutable(pythonPath) {
    // If only 'python'
    if (pythonPath === 'python' ||
        pythonPath.indexOf(path.sep) === -1 ||
        path.basename(pythonPath) === path.dirname(pythonPath)) {
        return pythonPath;
    }
    if (isValidPythonPath(pythonPath)) {
        return pythonPath;
    }
    // Suffix with 'python' for linux and 'osx', and 'python.exe' for 'windows'
    if (exports.IS_WINDOWS) {
        if (isValidPythonPath(path.join(pythonPath, 'python.exe'))) {
            return path.join(pythonPath, 'python.exe');
        }
        if (isValidPythonPath(path.join(pythonPath, 'scripts', 'python.exe'))) {
            return path.join(pythonPath, 'scripts', 'python.exe');
        }
    }
    else {
        if (isValidPythonPath(path.join(pythonPath, 'python'))) {
            return path.join(pythonPath, 'python');
        }
        if (isValidPythonPath(path.join(pythonPath, 'bin', 'python'))) {
            return path.join(pythonPath, 'bin', 'python');
        }
    }
    return pythonPath;
}
exports.getPythonExecutable = getPythonExecutable;
function isValidPythonPath(pythonPath) {
    try {
        let output = child_process.execFileSync(pythonPath, ['-c', 'print(1234)'], { encoding: 'utf8' });
        return output.startsWith('1234');
    }
    catch (ex) {
        return false;
    }
}
//# sourceMappingURL=Utils.js.map