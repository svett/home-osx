/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
/**
 * This file is loaded by both the extension and debug adapter, so it cannot import 'vscode'
 */
var fs = require('fs');
var path = require('path');
var binPathCache = {};
var runtimePathCache = 'go';
function getBinPathFromEnvVar(toolName, envVar, appendBinToPath) {
    toolName = correctBinname(toolName);
    if (process.env[envVar]) {
        var paths = process.env[envVar].split(path.delimiter);
        for (var i = 0; i < paths.length; i++) {
            var binpath = path.join(paths[i], appendBinToPath ? 'bin' : '', toolName);
            if (fileExists(binpath)) {
                binPathCache[toolName] = binpath;
                return binpath;
            }
        }
    }
    return null;
}
exports.getBinPathFromEnvVar = getBinPathFromEnvVar;
function getBinPath(binname) {
    if (binPathCache[correctBinname(binname)])
        return binPathCache[correctBinname(binname)];
    // First search each GOPATH workspace's bin folder
    var pathFromGoPath = getBinPathFromEnvVar(binname, 'GOPATH', true);
    if (pathFromGoPath) {
        return pathFromGoPath;
    }
    // Then search PATH parts
    var pathFromPath = getBinPathFromEnvVar(binname, 'PATH', false);
    if (pathFromPath) {
        return pathFromPath;
    }
    // Finally check GOROOT just in case
    var pathFromGoRoot = getBinPathFromEnvVar(binname, 'GOROOT', true);
    if (pathFromGoRoot) {
        return pathFromGoRoot;
    }
    // Else return the binary name directly (this will likely always fail downstream)
    return binname;
}
exports.getBinPath = getBinPath;
function correctBinname(binname) {
    if (process.platform === 'win32')
        return binname + '.exe';
    else
        return binname;
}
/**
 * Returns Go runtime binary path.
 *
 * @return the path to the Go binary.
 */
function getGoRuntimePath() {
    if (runtimePathCache !== 'go')
        return runtimePathCache;
    var correctBinNameGo = correctBinname('go');
    if (process.env['GOROOT']) {
        runtimePathCache = path.join(process.env['GOROOT'], 'bin', correctBinNameGo);
    }
    else if (process.env['PATH']) {
        var pathparts = process.env.PATH.split(path.delimiter);
        runtimePathCache = pathparts.map(function (dir) { return path.join(dir, correctBinNameGo); }).filter(function (candidate) { return fileExists(candidate); })[0];
    }
    return runtimePathCache;
}
exports.getGoRuntimePath = getGoRuntimePath;
function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=goPath.js.map