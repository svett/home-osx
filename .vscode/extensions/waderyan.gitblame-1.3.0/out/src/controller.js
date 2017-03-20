"use strict";
var vscode_1 = require('vscode');
var path = require('path');
var moment = require('moment');
var GitBlameController = (function () {
    function GitBlameController(gitBlame, gitRoot, view) {
        this.gitBlame = gitBlame;
        this.gitRoot = gitRoot;
        this.view = view;
        var self = this;
        var disposables = [];
        vscode_1.window.onDidChangeActiveTextEditor(self.onTextEditorChange, self, disposables);
        vscode_1.window.onDidChangeTextEditorSelection(self.onTextEditorSelectionChange, self, disposables);
        this.onTextEditorChange(vscode_1.window.activeTextEditor);
        this._disposable = vscode_1.Disposable.from.apply(vscode_1.Disposable, disposables);
        this._textDecorator = new TextDecorator();
    }
    GitBlameController.prototype.onTextEditorChange = function (editor) {
        var _this = this;
        this.clear();
        if (!editor)
            return;
        var doc = editor.document;
        if (!doc)
            return;
        if (doc.isUntitled)
            return; // Document hasn't been saved and is not in git.
        var lineNumber = editor.selection.active.line + 1; // line is zero based
        var file = path.relative(this.gitRoot, editor.document.fileName);
        this.gitBlame.getBlameInfo(file).then(function (info) {
            _this.show(info, lineNumber);
        }, function () {
            // Do nothing.
        });
    };
    GitBlameController.prototype.onTextEditorSelectionChange = function (textEditorSelectionChangeEvent) {
        this.onTextEditorChange(textEditorSelectionChangeEvent.textEditor);
    };
    GitBlameController.prototype.clear = function () {
        this.view.refresh('');
    };
    GitBlameController.prototype.show = function (blameInfo, lineNumber) {
        if (lineNumber in blameInfo['lines']) {
            var hash = blameInfo['lines'][lineNumber]['hash'];
            var commitInfo = blameInfo['commits'][hash];
            this.view.refresh(this._textDecorator.toTextView(new Date(), commitInfo));
        }
        else {
        }
    };
    GitBlameController.prototype.dispose = function () {
        this._disposable.dispose();
    };
    return GitBlameController;
}());
exports.GitBlameController = GitBlameController;
var TextDecorator = (function () {
    function TextDecorator() {
    }
    TextDecorator.prototype.toTextView = function (dateNow, commit) {
        var author = commit['author'];
        var dateText = this.toDateText(dateNow, new Date(author['timestamp'] * 1000));
        return 'Blame ' + author['name'] + ' ( ' + dateText + ' )';
    };
    TextDecorator.prototype.toDateText = function (dateNow, dateThen) {
        var momentNow = moment(dateNow);
        var momentThen = moment(dateThen);
        var months = momentNow.diff(momentThen, 'months');
        var days = momentNow.diff(momentThen, 'days');
        if (months <= 1) {
            if (days == 0) {
                return 'today';
            }
            else if (days == 1) {
                return 'yesterday';
            }
            else {
                return days + ' days ago';
            }
        }
        else {
            return months + ' months ago';
        }
    };
    return TextDecorator;
}());
exports.TextDecorator = TextDecorator;
//# sourceMappingURL=controller.js.map