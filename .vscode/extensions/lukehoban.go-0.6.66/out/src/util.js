"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const goPath_1 = require("./goPath");
const cp = require("child_process");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const fs = require("fs");
const os = require("os");
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
let toolsGopath;
function byteOffsetAt(document, position) {
    let offset = document.offsetAt(position);
    let text = document.getText();
    return Buffer.byteLength(text.substr(0, offset));
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
    let gopath = getCurrentGoPath();
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
        /* __GDPR__
           "getGoVersion" : {
              "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
           }
         */
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
                /* __GDPR__
                   "getGoVersion" : {
                      "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                   }
                 */
                sendTelemetryEvent('getGoVersion', { version: `${goVersion.major}.${goVersion.minor}` });
            }
            else {
                /* __GDPR__
                   "getGoVersion" : {
                      "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                   }
                 */
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
    if (!getCurrentGoPath()) {
        vscode.window.showInformationMessage('Set GOPATH environment variable and restart VS Code or set GOPATH in Workspace settings', 'Set GOPATH in Workspace Settings').then(selected => {
            if (selected === 'Set GOPATH in Workspace Settings') {
                vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
            }
        });
        return false;
    }
    return true;
}
exports.isGoPathSet = isGoPathSet;
function sendTelemetryEvent(eventName, properties, measures) {
    let temp = vscode.extensions.getExtension(extensionId).packageJSON.contributes;
    telemtryReporter = telemtryReporter ? telemtryReporter : new vscode_extension_telemetry_1.default(extensionId, extensionVersion, aiKey);
    telemtryReporter.sendTelemetryEvent(eventName, properties, measures);
}
exports.sendTelemetryEvent = sendTelemetryEvent;
function isPositionInString(document, position) {
    let lineText = document.lineAt(position.line).text;
    let lineTillCurrentPosition = lineText.substr(0, position.character);
    // Count the number of double quotes in the line till current position. Ignore escaped double quotes
    let doubleQuotesCnt = (lineTillCurrentPosition.match(/\"/g) || []).length;
    let escapedDoubleQuotesCnt = (lineTillCurrentPosition.match(/\\\"/g) || []).length;
    doubleQuotesCnt -= escapedDoubleQuotesCnt;
    return doubleQuotesCnt % 2 === 1;
}
exports.isPositionInString = isPositionInString;
function getToolsGopath(useCache = true) {
    if (!useCache || !toolsGopath) {
        toolsGopath = resolveToolsGopath();
    }
    return toolsGopath;
}
exports.getToolsGopath = getToolsGopath;
function resolveToolsGopath() {
    let toolsGopathForWorkspace = vscode.workspace.getConfiguration('go')['toolsGopath'] || '';
    // In case of single root, use resolvePath to resolve ~ and ${workspaceRoot}
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 1) {
        return resolvePath(toolsGopathForWorkspace);
    }
    // In case of multi-root, resolve ~ and ignore ${workspaceRoot}
    if (toolsGopathForWorkspace.startsWith('~')) {
        toolsGopathForWorkspace = path.join(os.homedir(), toolsGopathForWorkspace.substr(1));
    }
    if (toolsGopathForWorkspace && toolsGopathForWorkspace.trim() && !/\${workspaceRoot}/.test(toolsGopathForWorkspace)) {
        return toolsGopathForWorkspace;
    }
    // If any of the folders in multi root have toolsGopath set, use it.
    for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
        let toolsGopath = vscode.workspace.getConfiguration('go', vscode.workspace.workspaceFolders[i].uri).inspect('toolsGopath').workspaceFolderValue;
        toolsGopath = resolvePath(toolsGopath, vscode.workspace.workspaceFolders[i].uri.fsPath);
        if (toolsGopath) {
            return toolsGopath;
        }
    }
}
function getBinPath(tool) {
    return goPath_1.getBinPathWithPreferredGopath(tool, getToolsGopath(), getCurrentGoPath());
}
exports.getBinPath = getBinPath;
function getFileArchive(document) {
    let fileContents = document.getText();
    return document.fileName + '\n' + Buffer.byteLength(fileContents, 'utf8') + '\n' + fileContents;
}
exports.getFileArchive = getFileArchive;
function getToolsEnvVars() {
    const config = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
    const toolsEnvVars = config['toolsEnvVars'];
    let gopath = getCurrentGoPath();
    let envVars = Object.assign({}, process.env, gopath ? { GOPATH: gopath } : {});
    if (toolsEnvVars && typeof toolsEnvVars === 'object') {
        Object.keys(toolsEnvVars).forEach(key => envVars[key] = resolvePath(toolsEnvVars[key]));
    }
    return envVars;
}
exports.getToolsEnvVars = getToolsEnvVars;
function getCurrentGoPath(workspaceUri) {
    if (!workspaceUri && vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
        workspaceUri = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri;
    }
    const config = vscode.workspace.getConfiguration('go', workspaceUri);
    let currentRoot = workspaceUri ? workspaceUri.fsPath : vscode.workspace.rootPath;
    // Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
    if (process.platform === 'win32') {
        currentRoot = currentRoot.substr(0, 1).toUpperCase() + currentRoot.substr(1);
    }
    const configGopath = config['gopath'] ? resolvePath(config['gopath'], currentRoot) : '';
    const inferredGopath = config['inferGopath'] === true ? goPath_1.getInferredGopath(currentRoot) : '';
    return inferredGopath ? inferredGopath : (configGopath || process.env['GOPATH']);
}
exports.getCurrentGoPath = getCurrentGoPath;
function getExtensionCommands() {
    let pkgJSON = vscode.extensions.getExtension(extensionId).packageJSON;
    if (!pkgJSON.contributes || !pkgJSON.contributes.commands) {
        return;
    }
    let extensionCommands = vscode.extensions.getExtension(extensionId).packageJSON.contributes.commands.filter(x => x.command !== 'go.show.commands');
    return extensionCommands;
}
exports.getExtensionCommands = getExtensionCommands;
class LineBuffer {
    constructor() {
        this.buf = '';
        this.lineListeners = [];
        this.lastListeners = [];
    }
    append(chunk) {
        this.buf += chunk;
        do {
            const idx = this.buf.indexOf('\n');
            if (idx === -1) {
                break;
            }
            this.fireLine(this.buf.substring(0, idx));
            this.buf = this.buf.substring(idx + 1);
        } while (true);
    }
    done() {
        this.fireDone(this.buf !== '' ? this.buf : null);
    }
    fireLine(line) {
        this.lineListeners.forEach(listener => listener(line));
    }
    fireDone(last) {
        this.lastListeners.forEach(listener => listener(last));
    }
    onLine(listener) {
        this.lineListeners.push(listener);
    }
    onDone(listener) {
        this.lastListeners.push(listener);
    }
}
exports.LineBuffer = LineBuffer;
function timeout(millis) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), millis);
    });
}
exports.timeout = timeout;
/**
 * Exapnds ~ to homedir in non-Windows platform and resolves ${workspaceRoot}
 */
function resolvePath(inputPath, workspaceRoot) {
    if (!inputPath || !inputPath.trim())
        return inputPath;
    if (!workspaceRoot && vscode.workspace.workspaceFolders) {
        if (vscode.workspace.workspaceFolders.length === 1) {
            workspaceRoot = vscode.workspace.rootPath;
        }
        else if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
            workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath;
        }
    }
    if (workspaceRoot) {
        inputPath = inputPath.replace(/\${workspaceRoot}/g, workspaceRoot);
    }
    return goPath_1.resolveHomeDir(inputPath);
}
exports.resolvePath = resolvePath;
/**
 * Returns the import path in a passed in string.
 * @param text The string to search for an import path
 */
function getImportPath(text) {
    // Catch cases like `import alias "importpath"` and `import "importpath"`
    let singleLineImportMatches = text.match(/^\s*import\s+([a-z,A-Z,_,\.]\w*\s+)?\"([^\"]+)\"/);
    if (singleLineImportMatches) {
        return singleLineImportMatches[2];
    }
    // Catch cases like `alias "importpath"` and "importpath"
    let groupImportMatches = text.match(/^\s*([a-z,A-Z,_,\.]\w*\s+)?\"([^\"]+)\"/);
    if (groupImportMatches) {
        return groupImportMatches[2];
    }
    return '';
}
exports.getImportPath = getImportPath;
// TODO: Add unit tests for the below
/**
 * Guess the package name based on parent directory name of the given file
 *
 * Cases:
 * - dir 'go-i18n' -> 'i18n'
 * - dir 'go-spew' -> 'spew'
 * - dir 'kingpin' -> 'kingpin'
 * - dir 'go-expand-tilde' -> 'tilde'
 * - dir 'gax-go' -> 'gax'
 * - dir 'go-difflib' -> 'difflib'
 * - dir 'jwt-go' -> 'jwt'
 * - dir 'go-radix' -> 'radix'
 *
 * @param {string} filePath.
 */
function guessPackageNameFromFile(filePath) {
    return new Promise((resolve, reject) => {
        const goFilename = path.basename(filePath);
        if (goFilename === 'main.go') {
            return resolve('main');
        }
        const directoryPath = path.dirname(filePath);
        const dirName = path.basename(directoryPath);
        let segments = dirName.split(/[\.-]/);
        segments = segments.filter(val => val !== 'go');
        if (segments.length === 0 || !/[a-zA-Z_]\w*/.test(segments[segments.length - 1])) {
            return reject();
        }
        const proposedPkgName = segments[segments.length - 1];
        if (goFilename.endsWith('internal_test.go')) {
            return resolve(proposedPkgName);
        }
        if (goFilename.endsWith('_test.go')) {
            return resolve(proposedPkgName + '_test');
        }
        fs.stat(path.join(directoryPath, 'main.go'), (err, stats) => {
            if (stats && stats.isFile()) {
                return resolve('main');
            }
            return resolve(proposedPkgName);
        });
    });
}
exports.guessPackageNameFromFile = guessPackageNameFromFile;
//# sourceMappingURL=util.js.map