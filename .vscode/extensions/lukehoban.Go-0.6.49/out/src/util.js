/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
"use strict";
var vscode = require('vscode');
var path = require('path');
var goPath_1 = require('./goPath');
var cp = require('child_process');
var goVersion = null;
var vendorSupport = null;
function byteOffsetAt(document, position) {
    var offset = document.offsetAt(position);
    var text = document.getText();
    var byteOffset = 0;
    for (var i = 0; i < offset; i++) {
        var clen = Buffer.byteLength(text[i]);
        byteOffset += clen;
    }
    return byteOffset;
}
exports.byteOffsetAt = byteOffsetAt;
function parseFilePrelude(text) {
    var lines = text.split('\n');
    var ret = { imports: [], pkg: null };
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.match(/^(\s)*package(\s)+/)) {
            ret.pkg = { start: i, end: i };
        }
        if (line.match(/^(\s)*import(\s)+\(/)) {
            ret.imports.push({ kind: 'multi', start: i, end: -1 });
        }
        if (line.match(/^(\s)*import(\s)+[^\(]/)) {
            ret.imports.push({ kind: 'single', start: i, end: i });
        }
        if (line.match(/^(\s)*\)/)) {
            if (ret.imports[ret.imports.length - 1].end === -1) {
                ret.imports[ret.imports.length - 1].end = i;
            }
        }
        if (line.match(/^(\s)*(func|const|type|var)/)) {
            break;
        }
    }
    return ret;
}
exports.parseFilePrelude = parseFilePrelude;
// Takes a Go function signature like:
//     (foo, bar string, baz number) (string, string)
// and returns an array of parameter strings:
//     ["foo", "bar string", "baz string"]
// Takes care of balancing parens so to not get confused by signatures like:
//     (pattern string, handler func(ResponseWriter, *Request)) {
function parameters(signature) {
    var ret = [];
    var parenCount = 0;
    var lastStart = 1;
    for (var i = 1; i < signature.length; i++) {
        switch (signature[i]) {
            case '(':
                parenCount++;
                break;
            case ')':
                parenCount--;
                if (parenCount < 0) {
                    if (i > lastStart) {
                        ret.push(signature.substring(lastStart, i));
                    }
                    return ret;
                }
                break;
            case ',':
                if (parenCount === 0) {
                    ret.push(signature.substring(lastStart, i));
                    lastStart = i + 2;
                }
                break;
        }
    }
    return null;
}
exports.parameters = parameters;
function canonicalizeGOPATHPrefix(filename) {
    var gopath = process.env['GOPATH'];
    if (!gopath)
        return filename;
    var workspaces = gopath.split(path.delimiter);
    var filenameLowercase = filename.toLowerCase();
    for (var _i = 0, workspaces_1 = workspaces; _i < workspaces_1.length; _i++) {
        var workspace = workspaces_1[_i];
        if (filenameLowercase.substring(0, workspace.length) === workspace.toLowerCase()) {
            return workspace + filename.slice(workspace.length);
        }
    }
    return filename;
}
exports.canonicalizeGOPATHPrefix = canonicalizeGOPATHPrefix;
/**
 * Gets version of Go based on the output of the command `go version`.
 * Returns null if go is being used from source/tip in which case `go version` will not return release tag like go1.6.3
 */
function getGoVersion() {
    var goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    if (goVersion) {
        return Promise.resolve(goVersion);
    }
    return new Promise(function (resolve, reject) {
        cp.execFile(goRuntimePath, ['version'], {}, function (err, stdout, stderr) {
            var matches = /go version go(\d).(\d).*/.exec(stdout);
            if (matches) {
                goVersion = {
                    major: parseInt(matches[1]),
                    minor: parseInt(matches[2])
                };
            }
            return resolve(goVersion);
        });
    });
}
exports.getGoVersion = getGoVersion;
/**
 * Returns boolean denoting if current version of Go supports vendoring
 */
function isVendorSupported() {
    if (vendorSupport != null) {
        return Promise.resolve(vendorSupport);
    }
    return getGoVersion().then(function (version) {
        if (!version) {
            return process.env['GO15VENDOREXPERIMENT'] === '0' ? false : true;
        }
        switch (version.major) {
            case 0:
                vendorSupport = false;
                break;
            case 1:
                vendorSupport = (version.minor > 6 || ((version.minor === 5 || version.minor === 6) && process.env['GO15VENDOREXPERIMENT'] === '1')) ? true : false;
                break;
            default:
                vendorSupport = true;
                break;
        }
        return vendorSupport;
    });
}
exports.isVendorSupported = isVendorSupported;
/**
 * Returns boolean indicating if GOPATH is set or not
 * If not set, then prompts user to do set GOPATH
 */
function isGoPathSet() {
    if (!process.env['GOPATH']) {
        vscode.window.showInformationMessage('Set GOPATH environment variable and restart VS Code or set GOPATH in Workspace settings', 'Set GOPATH in Workspace Settings').then(function (selected) {
            if (selected === 'Set GOPATH in Workspace Settings') {
                var settingsFilePath = path.join(vscode.workspace.rootPath, '.vscode', 'settings.json');
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(settingsFilePath));
            }
        });
        return false;
    }
    return true;
}
exports.isGoPathSet = isGoPathSet;
//# sourceMappingURL=util.js.map