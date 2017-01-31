/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
"use strict";
const vscode = require("vscode");
const path = require("path");
const goPath_1 = require("./goPath");
const cp = require("child_process");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const extensionId = 'lukehoban.Go';
const extensionVersion = vscode.extensions.getExtension(extensionId).packageJSON.version;
const aiKey = 'AIF-d9b70cd4-b9f9-4d70-929b-a071c400b217';
exports.goKeywords = [
    'break',
    'case',
    'chan',
    'const',
    'continue',
    'default',
    'defer',
    'else',
    'fallthrough',
    'for',
    'func',
    'go',
    'goto',
    'if',
    'import',
    'interface',
    'map',
    'package',
    'range',
    'return',
    'select',
    'struct',
    'switch',
    'type',
    'var'
];
let goVersion = null;
let vendorSupport = null;
let telemtryReporter;
function byteOffsetAt(document, position) {
    let offset = document.offsetAt(position);
    let text = document.getText();
    let byteOffset = 0;
    for (let i = 0; i < offset; i++) {
        let clen = Buffer.byteLength(text[i]);
        byteOffset += clen;
    }
    return byteOffset;
}
exports.byteOffsetAt = byteOffsetAt;
function parseFilePrelude(text) {
    let lines = text.split('\n');
    let ret = { imports: [], pkg: null };
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let pkgMatch = line.match(/^(\s)*package(\s)+(\w+)/);
        if (pkgMatch) {
            ret.pkg = { start: i, end: i, name: pkgMatch[3] };
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
    let ret = [];
    let parenCount = 0;
    let lastStart = 1;
    for (let i = 1; i < signature.length; i++) {
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
    let gopath = process.env['GOPATH'];
    if (!gopath)
        return filename;
    let workspaces = gopath.split(path.delimiter);
    let filenameLowercase = filename.toLowerCase();
    // In case of multiple workspaces, find current workspace by checking if current file is
    // under any of the workspaces in $GOPATH
    let currentWorkspace = null;
    for (let workspace of workspaces) {
        // In case of nested workspaces, (example: both /Users/me and /Users/me/a/b/c are in $GOPATH)
        // both parent & child workspace in the nested workspaces pair can make it inside the above if block
        // Therefore, the below check will take longer (more specific to current file) of the two
        if (filenameLowercase.substring(0, workspace.length) === workspace.toLowerCase()
            && (!currentWorkspace || workspace.length > currentWorkspace.length)) {
            currentWorkspace = workspace;
        }
    }
    if (!currentWorkspace)
        return filename;
    return currentWorkspace + filename.slice(currentWorkspace.length);
}
exports.canonicalizeGOPATHPrefix = canonicalizeGOPATHPrefix;
/**
 * Gets version of Go based on the output of the command `go version`.
 * Returns null if go is being used from source/tip in which case `go version` will not return release tag like go1.6.3
 */
function getGoVersion() {
    let goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    if (goVersion) {
        sendTelemetryEvent('getGoVersion', { version: `${goVersion.major}.${goVersion.minor}` });
        return Promise.resolve(goVersion);
    }
    return new Promise((resolve, reject) => {
        cp.execFile(goRuntimePath, ['version'], {}, (err, stdout, stderr) => {
            let matches = /go version go(\d).(\d).*/.exec(stdout);
            if (matches) {
                goVersion = {
                    major: parseInt(matches[1]),
                    minor: parseInt(matches[2])
                };
                sendTelemetryEvent('getGoVersion', { version: `${goVersion.major}.${goVersion.minor}` });
            }
            else {
                sendTelemetryEvent('getGoVersion', { version: stdout });
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
    return getGoVersion().then(version => {
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
        vscode.window.showInformationMessage('Set GOPATH environment variable and restart VS Code or set GOPATH in Workspace settings', 'Set GOPATH in Workspace Settings').then(selected => {
            if (selected === 'Set GOPATH in Workspace Settings') {
                let settingsFilePath = path.join(vscode.workspace.rootPath, '.vscode', 'settings.json');
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(settingsFilePath));
            }
        });
        return false;
    }
    return true;
}
exports.isGoPathSet = isGoPathSet;
function sendTelemetryEvent(eventName, properties, measures) {
    telemtryReporter = telemtryReporter ? telemtryReporter : new vscode_extension_telemetry_1.default(extensionId, extensionVersion, aiKey);
    telemtryReporter.sendTelemetryEvent(eventName, properties, measures);
}
exports.sendTelemetryEvent = sendTelemetryEvent;
function isPositionInString(document, position) {
    let lineText = document.lineAt(position.line).text;
    let lineTillCurrentPosition = lineText.substr(0, position.character);
    // Count the number of double quotes in the line till current position. Ignore escaped double quotes
    let doubleQuotesCnt = (lineTillCurrentPosition.match(/[^\\]\"/g) || []).length;
    doubleQuotesCnt += lineTillCurrentPosition.startsWith('\"') ? 1 : 0;
    return doubleQuotesCnt % 2 === 1;
}
exports.isPositionInString = isPositionInString;
function getBinPath(tool) {
    let goConfig = vscode.workspace.getConfiguration('go');
    return goPath_1.getBinPathWithPreferredGopath(tool, goConfig['toolsGopath']);
}
exports.getBinPath = getBinPath;
//# sourceMappingURL=util.js.map