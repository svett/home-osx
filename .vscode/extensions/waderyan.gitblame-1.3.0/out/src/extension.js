"use strict";
var gitblame_1 = require('./gitblame');
var view_1 = require('./view');
var controller_1 = require('./controller');
var vscode_1 = require('vscode');
var fs = require('fs');
var path = require('path');
var gitBlameShell = require('git-blame');
function activate(context) {
    // Workspace not using a folder. No access to git repo.
    if (!vscode_1.workspace.rootPath) {
        return;
    }
    var workspaceRoot = vscode_1.workspace.rootPath;
    vscode_1.commands.registerCommand('extension.blame', function () {
        showMessage(context, workspaceRoot);
    });
    // Try to find the repo first in the workspace, then in parent directories
    // because sometimes one opens a subdirectory but still wants information
    // about the full repo.
    lookupRepo(context, workspaceRoot);
}
exports.activate = activate;
function lookupRepo(context, repoDir) {
    var repoPath = path.join(repoDir, '.git');
    fs.access(repoPath, function (err) {
        if (err) {
            // No access to git repo or no repo, try to go up.
            var parentDir = path.dirname(repoDir);
            if (parentDir != repoDir) {
                lookupRepo(context, parentDir);
            }
        }
        else {
            var statusBar = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
            var gitBlame = new gitblame_1.GitBlame(repoPath, gitBlameShell);
            var controller = new controller_1.GitBlameController(gitBlame, repoDir, new view_1.StatusBarView(statusBar));
            context.subscriptions.push(controller);
            context.subscriptions.push(gitBlame);
        }
    });
}
function showMessage(context, repoDir) {
    var repoPath = path.join(repoDir, '.git');
    fs.access(repoPath, function (err) {
        if (err) {
            // No access to git repo or no repo, try to go up.
            var parentDir = path.dirname(repoDir);
            if (parentDir != repoDir) {
                showMessage(context, parentDir);
            }
        }
        else {
            var editor = vscode_1.window.activeTextEditor;
            if (!editor)
                return;
            var doc = editor.document;
            if (!doc)
                return;
            if (doc.isUntitled)
                return; // Document hasn't been saved and is not in git.
            var gitBlame = new gitblame_1.GitBlame(repoPath, gitBlameShell);
            var lineNumber_1 = editor.selection.active.line + 1; // line is zero based
            var file = path.relative(repoDir, editor.document.fileName);
            gitBlame.getBlameInfo(file).then(function (info) {
                if (lineNumber_1 in info['lines']) {
                    var hash = info['lines'][lineNumber_1]['hash'];
                    var commitInfo = info['commits'][hash];
                    vscode_1.window.showInformationMessage(hash + ' ' + commitInfo['summary']);
                }
            });
        }
    });
}
//# sourceMappingURL=extension.js.map