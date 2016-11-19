/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const vscode_languageserver_1 = require('vscode-languageserver');
const vscode_uri_1 = require('vscode-uri');
const path = require('path');
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["warn"] = 2] = "warn";
    Status[Status["error"] = 3] = "error";
})(Status || (Status = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = { get method() { return 'eslint/status'; } };
})(StatusNotification || (StatusNotification = {}));
var NoConfigRequest;
(function (NoConfigRequest) {
    NoConfigRequest.type = { get method() { return 'eslint/noConfig'; } };
})(NoConfigRequest || (NoConfigRequest = {}));
var NoESLintLibraryRequest;
(function (NoESLintLibraryRequest) {
    NoESLintLibraryRequest.type = { get method() { return 'eslint/noLibrary'; } };
})(NoESLintLibraryRequest || (NoESLintLibraryRequest = {}));
class ID {
    static next() {
        return `${ID.base}${ID.counter++}`;
    }
}
ID.base = `${Date.now().toString()}-`;
ID.counter = 0;
function makeDiagnostic(problem) {
    let message = (problem.ruleId != null)
        ? `${problem.message} (${problem.ruleId})`
        : `${problem.message}`;
    let startLine = Math.max(0, problem.line - 1);
    let startChar = Math.max(0, problem.column - 1);
    let endLine = problem.endLine != null ? Math.max(0, problem.endLine - 1) : startLine;
    let endChar = problem.endColumn != null ? Math.max(0, problem.endColumn - 1) : startChar;
    return {
        message: message,
        severity: convertSeverity(problem.severity),
        source: 'eslint',
        range: {
            start: { line: startLine, character: startChar },
            end: { line: endLine, character: endChar }
        },
        code: problem.ruleId
    };
}
function computeKey(diagnostic) {
    let range = diagnostic.range;
    return `[${range.start.line},${range.start.character},${range.end.line},${range.end.character}]-${diagnostic.code}`;
}
let codeActions = Object.create(null);
function recordCodeAction(document, diagnostic, problem) {
    if (!problem.fix || !problem.ruleId) {
        return;
    }
    let uri = document.uri;
    let edits = codeActions[uri];
    if (!edits) {
        edits = Object.create(null);
        codeActions[uri] = edits;
    }
    edits[computeKey(diagnostic)] = { label: `Fix this ${problem.ruleId} problem`, documentVersion: document.version, ruleId: problem.ruleId, edit: problem.fix };
}
function convertSeverity(severity) {
    switch (severity) {
        // Eslint 1 is warning
        case 1:
            return 2 /* Warning */;
        case 2:
            return 1 /* Error */;
        default:
            return 1 /* Error */;
    }
}
const exitCalled = { method: 'eslint/exitCalled' };
const nodeExit = process.exit;
process.exit = (code) => {
    let stack = new Error('stack');
    connection.sendNotification(exitCalled, [code ? code : 0, stack.stack]);
    setTimeout(() => {
        nodeExit(code);
    }, 1000);
};
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let settings = null;
let options = null;
let documents = new vscode_languageserver_1.TextDocuments();
let supportedLanguages = {
    'javascript': true,
    'javascriptreact': true
};
let globalNodePath = undefined;
let nodePath = undefined;
let workspaceRoot = undefined;
let path2Library = Object.create(null);
let document2Library = Object.create(null);
function ignoreTextDocument(document) {
    return !supportedLanguages[document.languageId] || !document2Library[document.uri];
}
// The documents manager listen for text document create, change
// and close on the connection
documents.listen(connection);
documents.onDidOpen((event) => {
    if (!supportedLanguages[event.document.languageId]) {
        return;
    }
    if (!document2Library[event.document.uri]) {
        let uri = vscode_uri_1.default.parse(event.document.uri);
        let promise;
        if (uri.scheme === 'file') {
            let file = uri.fsPath;
            let directory = path.dirname(file);
            if (nodePath) {
                promise = vscode_languageserver_1.Files.resolve('eslint', nodePath, nodePath, trace).then(undefined, (error) => {
                    return vscode_languageserver_1.Files.resolve('eslint', globalNodePath, directory, trace);
                });
            }
            else {
                promise = vscode_languageserver_1.Files.resolve('eslint', globalNodePath, directory, trace);
            }
        }
        else {
            promise = vscode_languageserver_1.Files.resolve('eslint', globalNodePath, workspaceRoot, trace);
        }
        document2Library[event.document.uri] = promise.then((path) => {
            let library = path2Library[path];
            if (!library) {
                library = require(path);
                path2Library[path] = library;
            }
            if (!library.CLIEngine) {
                throw new Error(`The eslint library doesn\'t export a CLIEngine. You need at least eslint@1.0.0`);
            }
            connection.console.info(`ESLint library loaded from: ${path}`);
            return library;
        }, (error) => {
            connection.sendRequest(NoESLintLibraryRequest.type, { source: { uri: event.document.uri } });
            return null;
        });
    }
});
// A text document has changed. Validate the document according the run setting.
documents.onDidChangeContent((event) => {
    if (settings.eslint.run !== 'onType' || ignoreTextDocument(event.document)) {
        return;
    }
    validateSingle(event.document);
});
// A text document has been saved. Validate the document according the run setting.
documents.onDidSave((event) => {
    if (settings.eslint.run !== 'onSave' || ignoreTextDocument(event.document)) {
        return;
    }
    validateSingle(event.document);
});
documents.onDidClose((event) => {
    if (ignoreTextDocument(event.document)) {
        return;
    }
    delete document2Library[event.document.uri];
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});
function trace(message, verbose) {
    connection.tracer.log(message, verbose);
}
connection.onInitialize((params) => {
    let initOptions = params.initializationOptions;
    workspaceRoot = params.rootPath;
    nodePath = initOptions.nodePath;
    globalNodePath = vscode_languageserver_1.Files.resolveGlobalNodePath();
    return { capabilities: { textDocumentSync: documents.syncKind, codeActionProvider: true } };
});
function getMessage(err, document) {
    let result = null;
    if (typeof err.message === 'string' || err.message instanceof String) {
        result = err.message;
        result = result.replace(/\r?\n/g, ' ');
        if (/^CLI: /.test(result)) {
            result = result.substr(5);
        }
    }
    else {
        result = `An unknown error occured while validating file: ${vscode_languageserver_1.Files.uriToFilePath(document.uri)}`;
    }
    return result;
}
function validate(document, library) {
    let cli = new library.CLIEngine(options);
    let content = document.getText();
    let uri = document.uri;
    // Clean previously computed code actions.
    delete codeActions[uri];
    let report = cli.executeOnText(content, vscode_languageserver_1.Files.uriToFilePath(uri));
    let diagnostics = [];
    if (report && report.results && Array.isArray(report.results) && report.results.length > 0) {
        let docReport = report.results[0];
        if (docReport.messages && Array.isArray(docReport.messages)) {
            docReport.messages.forEach((problem) => {
                if (problem) {
                    let diagnostic = makeDiagnostic(problem);
                    diagnostics.push(diagnostic);
                    recordCodeAction(document, diagnostic, problem);
                }
            });
        }
    }
    // Publish the diagnostics
    connection.sendDiagnostics({ uri, diagnostics });
}
let noConfigReported = Object.create(null);
function isNoConfigFoundError(error) {
    let candidate = error;
    return candidate.messageTemplate === 'no-config-found' || candidate.message === 'No ESLint configuration found.';
}
function tryHandleNoConfig(error, document, library) {
    if (!isNoConfigFoundError(error)) {
        return undefined;
    }
    if (!noConfigReported[document.uri]) {
        connection.sendRequest(NoConfigRequest.type, {
            message: getMessage(error, document),
            document: {
                uri: document.uri
            }
        })
            .then(undefined, (error) => { });
        noConfigReported[document.uri] = library;
    }
    return Status.warn;
}
let configErrorReported = Object.create(null);
function tryHandleConfigError(error, document, library) {
    if (!error.message) {
        return undefined;
    }
    function handleFileName(filename) {
        if (!configErrorReported[filename]) {
            connection.console.error(getMessage(error, document));
            if (!documents.get(vscode_uri_1.default.file(filename).toString())) {
                connection.window.showInformationMessage(getMessage(error, document));
            }
            configErrorReported[filename] = library;
        }
        return Status.warn;
    }
    let filename = undefined;
    let matches = /Cannot read config file:\s+(.*)\nError:\s+(.*)/.exec(error.message);
    if (matches && matches.length === 3) {
        return handleFileName(matches[1]);
    }
    matches = /(.*):\n\s*Configuration for rule \"(.*)\" is /.exec(error.message);
    if (matches && matches.length === 3) {
        return handleFileName(matches[1]);
    }
    matches = /Cannot find module '([^']*)'\nReferenced from:\s+(.*)/.exec(error.message);
    if (matches && matches.length === 3) {
        return handleFileName(matches[2]);
    }
    return undefined;
}
let missingModuleReported = Object.create(null);
function tryHandleMissingModule(error, document, library) {
    if (!error.message) {
        return undefined;
    }
    function handleMissingModule(plugin, module, error) {
        if (!missingModuleReported[plugin]) {
            let fsPath = vscode_languageserver_1.Files.uriToFilePath(document.uri);
            missingModuleReported[plugin] = library;
            if (error.messageTemplate === 'plugin-missing') {
                connection.console.error([
                    '',
                    `${error.message.toString()}`,
                    `Happend while validating ${fsPath ? fsPath : document.uri}`,
                    `This can happen for a couple of reasons:`,
                    `1. The plugin name is spelled incorrectly in an ESLint configuration file (e.g. .eslintrc).`,
                    `2. If ESLint is installed globally, then make sure ${module} is installed globally as well.`,
                    `3. If ESLint is installed locally, then ${module} isn't installed correctly.`,
                    '',
                    `Consider running eslint --debug ${fsPath ? fsPath : document.uri} from a terminal to obtain a trace about the configuration files used.`
                ].join('\n'));
            }
            else {
                connection.console.error([
                    `${error.message.toString()}`,
                    `Happend while validating ${fsPath ? fsPath : document.uri}`
                ].join('\n'));
            }
        }
        return Status.warn;
    }
    let matches = /Failed to load plugin (.*): Cannot find module (.*)/.exec(error.message);
    if (matches && matches.length === 3) {
        return handleMissingModule(matches[1], matches[2], error);
    }
    return undefined;
}
function showErrorMessage(error, document, library) {
    connection.window.showErrorMessage(getMessage(error, document));
    return Status.error;
}
const singleErrorHandlers = [
    tryHandleNoConfig,
    tryHandleConfigError,
    tryHandleMissingModule,
    showErrorMessage
];
function validateSingle(document) {
    document2Library[document.uri].then((library) => {
        if (!library) {
            return;
        }
        try {
            validate(document, library);
            connection.sendNotification(StatusNotification.type, { state: Status.ok });
        }
        catch (err) {
            let status = undefined;
            for (let handler of singleErrorHandlers) {
                status = handler(err, document, library);
                if (status) {
                    break;
                }
            }
            status = status || Status.error;
            connection.sendNotification(StatusNotification.type, { state: status });
        }
    });
}
const manyErrorHandlers = [
    tryHandleNoConfig,
    tryHandleConfigError,
    tryHandleMissingModule
];
function validateMany(documents) {
    let tracker = new vscode_languageserver_1.ErrorMessageTracker();
    let status = undefined;
    let promises = [];
    documents.forEach(document => {
        if (ignoreTextDocument(document)) {
            return;
        }
        promises.push(document2Library[document.uri].then((library) => {
            if (!library) {
                return;
            }
            try {
                validate(document, library);
            }
            catch (err) {
                let handled = false;
                for (let handler of manyErrorHandlers) {
                    status = handler(err, document, library);
                    if (status) {
                        handled = true;
                        break;
                    }
                }
                if (!handled) {
                    status = Status.error;
                    tracker.add(getMessage(err, document));
                }
            }
        }));
    });
    Promise.all(promises).then(() => {
        tracker.sendErrors(connection);
        status = status || Status.ok;
        connection.sendNotification(StatusNotification.type, { state: status });
    }, (error) => {
        tracker.sendErrors(connection);
        connection.console.warn('Validating all open documents failed.');
        connection.sendNotification(StatusNotification.type, { state: Status.error });
    });
}
connection.onDidChangeConfiguration((params) => {
    settings = params.settings;
    if (settings.eslint) {
        options = settings.eslint.options || {};
    }
    // Settings have changed. Revalidate all documents.
    validateMany(documents.all());
});
connection.onDidChangeWatchedFiles((params) => {
    // A .eslintrc has change. No smartness here.
    // Simply revalidate all file.
    noConfigReported = Object.create(null);
    missingModuleReported = Object.create(null);
    params.changes.forEach((change) => {
        let fspath = vscode_languageserver_1.Files.uriToFilePath(change.uri);
        let dirname = path.dirname(fspath);
        if (dirname) {
            let library = configErrorReported[fspath];
            if (library) {
                let cli = new library.CLIEngine(options);
                try {
                    cli.executeOnText("", path.join(dirname, "___test___.js"));
                    delete configErrorReported[fspath];
                }
                catch (error) {
                }
            }
        }
    });
    validateMany(documents.all());
});
class Fixes {
    constructor(edits) {
        this.edits = edits;
        this.keys = Object.keys(edits);
    }
    static overlaps(lastEdit, newEdit) {
        return !!lastEdit && lastEdit.edit.range[1] > newEdit.edit.range[0];
    }
    isEmpty() {
        return this.keys.length === 0;
    }
    getDocumentVersion() {
        return this.edits[this.keys[0]].documentVersion;
    }
    getScoped(diagnostics) {
        let result = [];
        for (let diagnostic of diagnostics) {
            let key = computeKey(diagnostic);
            let editInfo = this.edits[key];
            if (editInfo) {
                result.push(editInfo);
            }
        }
        return result;
    }
    getAllSorted() {
        let result = this.keys.map(key => this.edits[key]);
        return result.sort((a, b) => {
            let d = a.edit.range[0] - b.edit.range[0];
            if (d !== 0) {
                return d;
            }
            if (a.edit.range[1] === 0) {
                return -1;
            }
            if (b.edit.range[1] === 0) {
                return 1;
            }
            return a.edit.range[1] - b.edit.range[1];
        });
    }
    getOverlapFree() {
        let sorted = this.getAllSorted();
        if (sorted.length <= 1) {
            return sorted;
        }
        let result = [];
        let last = sorted[0];
        result.push(last);
        for (let i = 1; i < sorted.length; i++) {
            let current = sorted[i];
            if (!Fixes.overlaps(last, current)) {
                result.push(current);
                last = current;
            }
        }
        return result;
    }
}
connection.onCodeAction((params) => {
    let result = [];
    let uri = params.textDocument.uri;
    let edits = codeActions[uri];
    if (!edits) {
        return result;
    }
    let fixes = new Fixes(edits);
    if (fixes.isEmpty()) {
        return result;
    }
    let textDocument = documents.get(uri);
    let documentVersion = -1;
    let ruleId;
    function createTextEdit(editInfo) {
        return vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(textDocument.positionAt(editInfo.edit.range[0]), textDocument.positionAt(editInfo.edit.range[1])), editInfo.edit.text || '');
    }
    function getLastEdit(array) {
        let length = array.length;
        if (length === 0) {
            return undefined;
        }
        return array[length - 1];
    }
    for (let editInfo of fixes.getScoped(params.context.diagnostics)) {
        documentVersion = editInfo.documentVersion;
        ruleId = editInfo.ruleId;
        result.push(vscode_languageserver_1.Command.create(editInfo.label, 'eslint.applySingleFix', uri, documentVersion, [
            createTextEdit(editInfo)
        ]));
    }
    ;
    if (result.length > 0) {
        let same = [];
        let all = [];
        for (let editInfo of fixes.getAllSorted()) {
            if (documentVersion === -1) {
                documentVersion = editInfo.documentVersion;
            }
            if (editInfo.ruleId === ruleId && !Fixes.overlaps(getLastEdit(same), editInfo)) {
                same.push(editInfo);
            }
            if (!Fixes.overlaps(getLastEdit(all), editInfo)) {
                all.push(editInfo);
            }
        }
        if (same.length > 1) {
            result.push(vscode_languageserver_1.Command.create(`Fix all ${ruleId} problems`, 'eslint.applySameFixes', uri, documentVersion, same.map(createTextEdit)));
        }
        if (all.length > 1) {
            result.push(vscode_languageserver_1.Command.create(`Fix all auto-fixable problems`, 'eslint.applyAllFixes', uri, documentVersion, all.map(createTextEdit)));
        }
    }
    return result;
});
var AllFixesRequest;
(function (AllFixesRequest) {
    AllFixesRequest.type = { get method() { return 'textDocument/eslint/allFixes'; } };
})(AllFixesRequest || (AllFixesRequest = {}));
connection.onRequest(AllFixesRequest.type, (params) => {
    let result = null;
    let uri = params.textDocument.uri;
    let textDocument = documents.get(uri);
    let edits = codeActions[uri];
    function createTextEdit(editInfo) {
        return vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(textDocument.positionAt(editInfo.edit.range[0]), textDocument.positionAt(editInfo.edit.range[1])), editInfo.edit.text || '');
    }
    if (edits) {
        let fixes = new Fixes(edits);
        if (!fixes.isEmpty()) {
            result = {
                documentVersion: fixes.getDocumentVersion(),
                edits: fixes.getOverlapFree().map(createTextEdit)
            };
        }
    }
    return result;
});
connection.listen();
//# sourceMappingURL=server.js.map