/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var abstractProvider_1 = require('./abstractProvider');
var serverUtils = require('../omnisharp/utils');
var typeConvertion_1 = require('../omnisharp/typeConvertion');
var vscode = require('vscode');
var Advisor = (function () {
    function Advisor(server) {
        this._packageRestoreCounter = 0;
        this._projectSourceFileCounts = Object.create(null);
        this._server = server;
        var d1 = server.onProjectChange(this._onProjectChange, this);
        var d2 = server.onProjectAdded(this._onProjectAdded, this);
        var d3 = server.onProjectRemoved(this._onProjectRemoved, this);
        var d4 = server.onBeforePackageRestore(this._onBeforePackageRestore, this);
        var d5 = server.onPackageRestore(this._onPackageRestore, this);
        this._disposable = vscode.Disposable.from(d1, d2, d3, d4, d5);
    }
    Advisor.prototype.dispose = function () {
        this._disposable.dispose();
    };
    Advisor.prototype.shouldValidateFiles = function () {
        return this._isServerStarted()
            && !this._isRestoringPackages();
    };
    Advisor.prototype.shouldValidateProject = function () {
        return this._isServerStarted()
            && !this._isRestoringPackages()
            && !this._isHugeProject();
    };
    Advisor.prototype._updateProjectFileCount = function (path, fileCount) {
        this._projectSourceFileCounts[path] = fileCount;
    };
    Advisor.prototype._addOrUpdateProjectFileCount = function (info) {
        if (info.DotNetProject && info.DotNetProject.SourceFiles) {
            this._updateProjectFileCount(info.DotNetProject.Path, info.DotNetProject.SourceFiles.length);
        }
        if (info.MsBuildProject && info.MsBuildProject.SourceFiles) {
            this._updateProjectFileCount(info.MsBuildProject.Path, info.MsBuildProject.SourceFiles.length);
        }
    };
    Advisor.prototype._removeProjectFileCount = function (info) {
        if (info.DotNetProject && info.DotNetProject.SourceFiles) {
            delete this._updateProjectFileCount[info.DotNetProject.Path];
        }
        if (info.MsBuildProject && info.MsBuildProject.SourceFiles) {
            delete this._updateProjectFileCount[info.MsBuildProject.Path];
        }
    };
    Advisor.prototype._onProjectAdded = function (info) {
        this._addOrUpdateProjectFileCount(info);
    };
    Advisor.prototype._onProjectRemoved = function (info) {
        this._removeProjectFileCount(info);
    };
    Advisor.prototype._onProjectChange = function (info) {
        this._addOrUpdateProjectFileCount(info);
    };
    Advisor.prototype._onBeforePackageRestore = function () {
        this._packageRestoreCounter += 1;
    };
    Advisor.prototype._onPackageRestore = function () {
        this._packageRestoreCounter -= 1;
    };
    Advisor.prototype._isRestoringPackages = function () {
        return this._packageRestoreCounter > 0;
    };
    Advisor.prototype._isServerStarted = function () {
        return this._server.isRunning();
    };
    Advisor.prototype._isHugeProject = function () {
        var sourceFileCount = 0;
        for (var key in this._projectSourceFileCounts) {
            sourceFileCount += this._projectSourceFileCounts[key];
            if (sourceFileCount > 1000) {
                console.log("_isHugeProject = true (" + sourceFileCount + ")");
                return true;
            }
        }
        console.log("_isHugeProject = false (" + sourceFileCount + ")");
        return false;
    };
    return Advisor;
}());
exports.Advisor = Advisor;
function reportDiagnostics(server, advisor) {
    return new DiagnosticsProvider(server, advisor);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = reportDiagnostics;
var DiagnosticsProvider = (function (_super) {
    __extends(DiagnosticsProvider, _super);
    function DiagnosticsProvider(server, validationAdvisor) {
        var _this = this;
        _super.call(this, server);
        this._documentValidations = Object.create(null);
        this._validationAdvisor = validationAdvisor;
        this._diagnostics = vscode.languages.createDiagnosticCollection('csharp');
        var d1 = this._server.onPackageRestore(this._validateProject, this);
        var d2 = this._server.onProjectChange(this._validateProject, this);
        var d4 = vscode.workspace.onDidOpenTextDocument(function (event) { return _this._onDocumentAddOrChange(event); }, this);
        var d3 = vscode.workspace.onDidChangeTextDocument(function (event) { return _this._onDocumentAddOrChange(event.document); }, this);
        var d5 = vscode.workspace.onDidCloseTextDocument(this._onDocumentRemove, this);
        this._disposable = vscode.Disposable.from(this._diagnostics, d1, d2, d3, d4, d5);
        // Go ahead and check for diagnostics in the currently visible editors.
        for (var _i = 0, _a = vscode.window.visibleTextEditors; _i < _a.length; _i++) {
            var editor = _a[_i];
            var document = editor.document;
            if (document.languageId === 'csharp' && document.uri.scheme === 'file') {
                this._validateDocument(document);
            }
        }
    }
    DiagnosticsProvider.prototype.dispose = function () {
        if (this._projectValidation) {
            this._projectValidation.dispose();
        }
        for (var key in this._documentValidations) {
            this._documentValidations[key].dispose();
        }
        this._disposable.dispose();
    };
    DiagnosticsProvider.prototype._onDocumentAddOrChange = function (document) {
        if (document.languageId === 'csharp' && document.uri.scheme === 'file') {
            this._validateDocument(document);
            this._validateProject();
        }
    };
    DiagnosticsProvider.prototype._onDocumentRemove = function (document) {
        var key = document.uri.toString();
        var didChange = false;
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
    };
    DiagnosticsProvider.prototype._validateDocument = function (document) {
        var _this = this;
        // If we've already started computing for this document, cancel that work.
        var key = document.uri.toString();
        if (this._documentValidations[key]) {
            this._documentValidations[key].cancel();
        }
        if (!this._validationAdvisor.shouldValidateFiles()) {
            return;
        }
        var source = new vscode.CancellationTokenSource();
        var handle = setTimeout(function () {
            serverUtils.codeCheck(_this._server, { Filename: document.fileName }, source.token).then(function (value) {
                // Easy case: If there are no diagnostics in the file, we can clear it quickly. 
                if (value.QuickFixes.length === 0) {
                    if (_this._diagnostics.has(document.uri)) {
                        _this._diagnostics.delete(document.uri);
                    }
                    return;
                }
                // (re)set new diagnostics for this document
                var diagnostics = value.QuickFixes.map(DiagnosticsProvider._asDiagnostic);
                _this._diagnostics.set(document.uri, diagnostics);
            });
        }, 750);
        source.token.onCancellationRequested(function () { return clearTimeout(handle); });
        this._documentValidations[key] = source;
    };
    DiagnosticsProvider.prototype._validateProject = function () {
        var _this = this;
        // If we've already started computing for this project, cancel that work.
        if (this._projectValidation) {
            this._projectValidation.cancel();
        }
        if (!this._validationAdvisor.shouldValidateProject()) {
            return;
        }
        this._projectValidation = new vscode.CancellationTokenSource();
        var handle = setTimeout(function () {
            serverUtils.codeCheck(_this._server, { Filename: null }, _this._projectValidation.token).then(function (value) {
                var quickFixes = value.QuickFixes.sort(function (a, b) { return a.FileName.localeCompare(b.FileName); });
                var entries = [];
                var lastEntry;
                for (var _i = 0, quickFixes_1 = quickFixes; _i < quickFixes_1.length; _i++) {
                    var quickFix = quickFixes_1[_i];
                    var diag = DiagnosticsProvider._asDiagnostic(quickFix);
                    var uri = vscode.Uri.file(quickFix.FileName);
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
                _this._diagnostics.forEach(function (uri, diagnostics) {
                    if (!entries.find(function (tuple) { return tuple[0].toString() === uri.toString(); })) {
                        _this._diagnostics.delete(uri);
                    }
                });
                // replace all entries
                _this._diagnostics.set(entries);
            });
        }, 3000);
        // clear timeout on cancellation
        this._projectValidation.token.onCancellationRequested(function () {
            clearTimeout(handle);
        });
    };
    // --- data converter
    DiagnosticsProvider._asDiagnostic = function (quickFix) {
        var severity = DiagnosticsProvider._asDiagnosticSeverity(quickFix.LogLevel);
        var message = quickFix.Text + " [" + quickFix.Projects.map(function (n) { return DiagnosticsProvider._asProjectLabel(n); }).join(', ') + "]";
        return new vscode.Diagnostic(typeConvertion_1.toRange(quickFix), message, severity);
    };
    DiagnosticsProvider._asDiagnosticSeverity = function (logLevel) {
        switch (logLevel.toLowerCase()) {
            case 'warning':
            case 'warn':
                return vscode.DiagnosticSeverity.Warning;
            case 'hidden':
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Error;
        }
    };
    DiagnosticsProvider._asProjectLabel = function (projectName) {
        var idx = projectName.indexOf('+');
        return projectName.substr(idx + 1);
    };
    return DiagnosticsProvider;
}(abstractProvider_1.default));
//# sourceMappingURL=diagnosticsProvider.js.map