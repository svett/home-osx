/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const serverUtils = require("../omnisharp/utils");
function forwardDocumentChanges(server) {
    return vscode_1.workspace.onDidChangeTextDocument(event => {
        let { document } = event;
        if (document.isUntitled || document.languageId !== 'csharp') {
            return;
        }
        if (!server.isRunning()) {
            return;
        }
        serverUtils.updateBuffer(server, { Buffer: document.getText(), Filename: document.fileName }).catch(err => {
            console.error(err);
            return err;
        });
    });
}
function forwardFileChanges(server) {
    function onFileSystemEvent(uri) {
        if (!server.isRunning()) {
            return;
        }
        let req = { Filename: uri.fsPath };
        serverUtils.filesChanged(server, [req]).catch(err => {
            console.warn(`[o] failed to forward file change event for ${uri.fsPath}`, err);
            return err;
        });
    }
    const watcher = vscode_1.workspace.createFileSystemWatcher('**/*.*');
    let d1 = watcher.onDidCreate(onFileSystemEvent);
    let d2 = watcher.onDidChange(onFileSystemEvent);
    let d3 = watcher.onDidDelete(onFileSystemEvent);
    return vscode_1.Disposable.from(watcher, d1, d2, d3);
}
function forwardChanges(server) {
    // combine file watching and text document watching
    return vscode_1.Disposable.from(forwardDocumentChanges(server), forwardFileChanges(server));
}
exports.default = forwardChanges;
//# sourceMappingURL=changeForwarding.js.map