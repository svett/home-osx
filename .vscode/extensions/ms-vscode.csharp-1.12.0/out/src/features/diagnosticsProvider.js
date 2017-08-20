"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const abstractProvider_1 = require("./abstractProvider");
const serverUtils = require("../omnisharp/utils");
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const vscode = require("vscode");
class Advisor {
    constructor(server) {
        this._packageRestoreCounter = 0;
        this._projectSourceFileCounts = Object.create(null);
        this._server = server;
        let d1 = server.onProjectChange(this._onProjectChange, this);
        let d2 = server.onProjectAdded(this._onProjectAdded, this);
        let d3 = server.onProjectRemoved(this._onProjectRemoved, this);
        let d4 = server.onBeforePackageRestore(this._onBeforePackageRestore, this);
        let d5 = server.onPackageRestore(this._onPackageRestore, this);
        this._disposable = vscode.Disposable.from(d1, d2, d3, d4, d5);
    }
    dispose() {
        this._disposable.dispose();
    }
    shouldValidateFiles() {
        return this._isServerStarted()
            && !this._isRestoringPackages();
    }
    shouldValidateProject() {
        return this._isServerStarted()
            && !this._isRestoringPackages()
            && !this._isHugeProject();
    }
    _updateProjectFileCount(path, fileCount) {
        this._projectSourceFileCounts[path] = fileCount;
    }
    _addOrUpdateProjectFileCount(info) {
        if (info.DotNetProject && info.DotNetProject.SourceFiles) {
            this._updateProjectFileCount(info.DotNetProject.Path, info.DotNetProject.SourceFiles.length);
        }
        if (info.MsBuildProject && info.MsBuildProject.SourceFiles) {
            this._updateProjectFileCount(info.MsBuildProject.Path, info.MsBuildProject.SourceFiles.length);
        }
    }
    _removeProjectFileCount(info) {
        if (info.DotNetProject && info.DotNetProject.SourceFiles) {
            delete this._updateProjectFileCount[info.DotNetProject.Path];
        }
        if (info.MsBuildProject && info.MsBuildProject.SourceFiles) {
            delete this._updateProjectFileCount[info.MsBuildProject.Path];
        }
    }
    _onProjectAdded(info) {
        this._addOrUpdateProjectFileCount(info);
    }
    _onProjectRemoved(info) {
        this._removeProjectFileCount(info);
    }
    _onProjectChange(info) {
        this._addOrUpdateProjectFileCount(info);
    }
    _onBeforePackageRestore() {
        this._packageRestoreCounter += 1;
    }
    _onPackageRestore() {
        this._packageRestoreCounter -= 1;
    }
    _isRestoringPackages() {
        return this._packageRestoreCounter > 0;
    }
    _isServerStarted() {
        return this._server.isRunning();
    }
    _isHugeProject() {
        let sourceFileCount = 0;
        for (let key in this._projectSourceFileCounts) {
            sourceFileCount += this._projectSourceFileCounts[key];
            if (sourceFileCount > 1000) {
                return true;
            }
        }
        return false;
    }
}
exports.Advisor = Advisor;
function reportDiagnostics(server, reporter, advisor) {
    return new DiagnosticsProvider(server, reporter, advisor);
}
exports.default = reportDiagnostics;
class DiagnosticsProvider extends abstractProvider_1.default {
    constructor(server, reporter, validationAdvisor) {
        super(server, reporter);
        this._documentValidations = Object.create(null);
        this._validationAdvisor = validationAdvisor;
        this._diagnostics = vscode.languages.createDiagnosticCollection('csharp');
        let d1 = this._server.onPackageRestore(this._validateProject, this);
        let d2 = this._server.onProjectChange(this._validateProject, this);
        let d4 = vscode.workspace.onDidOpenTextDocument(event => this._onDocumentAddOrChange(event), this);
        let d3 = vscode.workspace.onDidChangeTextDocument(event => this._onDocumentAddOrChange(event.document), this);
        let d5 = vscode.workspace.onDidCloseTextDocument(this._onDocumentRemove, this);
        this._disposable = vscode.Disposable.from(this._diagnostics, d1, d2, d3, d4, d5);
        // Go ahead and check for diagnostics in the currently visible editors.
        for (let editor of vscode.window.visibleTextEditors) {
            let document = editor.document;
            if (document.languageId === 'csharp' && document.uri.scheme === 'file') {
                this._validateDocument(document);
            }
        }
    }
    dispose() {
        if (this._projectValidation) {
            this._projectValidation.dispose();
        }
        for (let key in this._documentValidations) {
            this._documentValidations[key].dispose();
        }
        this._disposable.dispose();
    }
    _onDocumentAddOrChange(document) {
        if (document.languageId === 'csharp' && document.uri.scheme === 'file') {
            this._validateDocument(document);
            this._validateProject();
        }
    }
    _onDocumentRemove(document) {
        let key = document.uri.toString();
        let didChange = false;
        if (this._diagnostics[key]) {
            didChange = true;
            this._diagnostics[key].dispose();
            delete this._diagnostics[key];
        }
        if (this._documentValidations[key]) {
            didChange = true;
            this._documentValidations[key].cancel();
            delete this._documentValidations[key];
        }
        if (didChange) {
            this._validateProject();
        }
    }
    _validateDocument(document) {
        // If we've already started computing for this document, cancel that work.
        let key = document.uri.toString();
        if (this._documentValidations[key]) {
            this._documentValidations[key].cancel();
        }
        if (!this._validationAdvisor.shouldValidateFiles()) {
            return;
        }
        let source = new vscode.CancellationTokenSource();
        let handle = setTimeout(() => {
            serverUtils.codeCheck(this._server, { FileName: document.fileName }, source.token).then(value => {
                let quickFixes = value.QuickFixes.filter(DiagnosticsProvider._shouldInclude);
                // Easy case: If there are no diagnostics in the file, we can clear it quickly.
                if (quickFixes.length === 0) {
                    if (this._diagnostics.has(document.uri)) {
                        this._diagnostics.delete(document.uri);
                    }
                    return;
                }
                // (re)set new diagnostics for this document
                let diagnostics = quickFixes.map(DiagnosticsProvider._asDiagnostic);
                this._diagnostics.set(document.uri, diagnostics);
            });
        }, 750);
        source.token.onCancellationRequested(() => clearTimeout(handle));
        this._documentValidations[key] = source;
    }
    _validateProject() {
        // If we've already started computing for this project, cancel that work.
        if (this._projectValidation) {
            this._projectValidation.cancel();
        }
        if (!this._validationAdvisor.shouldValidateProject()) {
            return;
        }
        this._projectValidation = new vscode.CancellationTokenSource();
        let handle = setTimeout(() => {
            serverUtils.codeCheck(this._server, { FileName: null }, this._projectValidation.token).then(value => {
                let quickFixes = value.QuickFixes
                    .filter(DiagnosticsProvider._shouldInclude)
                    .sort((a, b) => a.FileName.localeCompare(b.FileName));
                let entries = [];
                let lastEntry;
                for (let quickFix of quickFixes) {
                    let diag = DiagnosticsProvider._asDiagnostic(quickFix);
                    let uri = vscode.Uri.file(quickFix.FileName);
                    if (lastEntry && lastEntry[0].toString() === uri.toString()) {
                        lastEntry[1].push(diag);
                    }
                    else {
                        // We're replacing all diagnostics in this file. Pushing an entry with undefined for
                        // the diagnostics first ensures that the previous diagnostics for this file are
                        // cleared. Otherwise, new entries will be merged with the old ones.
                        entries.push([uri, undefined]);
                        lastEntry = [uri, [diag]];
                        entries.push(lastEntry);
                    }
                }
                // Clear diagnostics for files that no longer have any diagnostics.
                this._diagnostics.forEach((uri, diagnostics) => {
                    if (!entries.find(tuple => tuple[0].toString() === uri.toString())) {
                        this._diagnostics.delete(uri);
                    }
                });
                // replace all entries
                this._diagnostics.set(entries);
            });
        }, 3000);
        // clear timeout on cancellation
        this._projectValidation.token.onCancellationRequested(() => {
            clearTimeout(handle);
        });
    }
    static _shouldInclude(quickFix) {
        const config = vscode.workspace.getConfiguration('csharp');
        if (config.get('suppressHiddenDiagnostics', true)) {
            return quickFix.LogLevel.toLowerCase() !== 'hidden';
        }
        else {
            return true;
        }
    }
    // --- data converter
    static _asDiagnostic(quickFix) {
        let severity = DiagnosticsProvider._asDiagnosticSeverity(quickFix.LogLevel);
        let message = `${quickFix.Text} [${quickFix.Projects.map(n => DiagnosticsProvider._asProjectLabel(n)).join(', ')}]`;
        return new vscode.Diagnostic(typeConvertion_1.toRange(quickFix), message, severity);
    }
    static _asDiagnosticSeverity(logLevel) {
        switch (logLevel.toLowerCase()) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            // info and hidden
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }
    static _asProjectLabel(projectName) {
        const idx = projectName.indexOf('+');
        return projectName.substr(idx + 1);
    }
}
//# sourceMappingURL=diagnosticsProvider.js.map