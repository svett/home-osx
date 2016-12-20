"use strict";
const path = require("path");
const fs = require('fs');
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
//# sourceMappingURL=Utils.js.map