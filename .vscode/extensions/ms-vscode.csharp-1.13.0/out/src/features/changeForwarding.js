/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const serverUtils = require("../omnisharp/utils");
const protocol_1 = require("../omnisharp/protocol");
function forwardDocumentChanges(server) {
    return vscode_1.workspace.onDidChangeTextDocument(event => {
        let { document } = event;
        if (document.isUntitled || document.languageId !== 'csharp') {
            return;
        }
        if (!server.isRunning()) {
            return;
        }
        serverUtils.updateBuffer(server, { Buffer: document.getText(), FileName: document.fileName }).catch(err => {
            console.error(err);
            return err;
        });
    });
}
function forwardFileChanges(server) {
    function onFileSystemEvent(changeType) {
        return function (uri) {
            if (!server.isRunning()) {
                return;
            }
            let req = { FileName: uri.fsPath, changeType };
            serverUtils.filesChanged(server, [req]).catch(err => {
                console.warn(`[o] failed to forward file change event for ${uri.fsPath}`, err);
                return err;
            });
        };
    }
    const watcher = vscode_1.workspace.createFileSystemWatcher('**/*.*');
    let d1 = watcher.onDidCreate(onFileSystemEvent(protocol_1.FileChangeType.Create));
    let d2 = watcher.onDidDelete(onFileSystemEvent(protocol_1.FileChangeType.Delete));
    let d3 = watcher.onDidChange(onFileSystemEvent(protocol_1.FileChangeType.Change));
    return vscode_1.Disposable.from(watcher, d1, d2, d3);
}
function forwardChanges(server) {
    // combine file watching and text document watching
    return vscode_1.Disposable.from(forwardDocumentChanges(server), forwardFileChanges(server));
}
exports.default = forwardChanges;
//# sourceMappingURL=changeForwarding.js.map