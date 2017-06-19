/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
// Supports only passing interface, see TODO in implCursor to finish
const inputRegex = /^(\w+\ \*?\w+\ )?([\w.]+)$/;
function implCursor() {
    let cursor = vscode.window.activeTextEditor.selection;
    return vscode.window.showInputBox({
        placeHolder: 'f *File io.Closer',
        prompt: 'Enter receiver and interface to implement.'
    }).then(implInput => {
        if (typeof implInput === 'undefined') {
            return;
        }
        const matches = implInput.match(inputRegex);
        if (!matches) {
            vscode.window.showInformationMessage(`Not parsable input: ${implInput}`);
            return;
        }
        // TODO: automatically detect type name at cursor
        // if matches[1] is undefined then detect receiver type
        // take first character and use as receiver name
        let input = {
            receiver: matches[1],
            interface: matches[2]
        };
        runGoImpl(input, cursor.start);
    });
}
exports.implCursor = implCursor;
function runGoImpl(input, insertPos) {
    let goimpl = util_1.getBinPath('impl');
    let editor = vscode.window.activeTextEditor;
    let p = cp.execFile(goimpl, [input.receiver, input.interface], (err, stdout, stderr) => {
        if (err && err.code === 'ENOENT') {
            goInstallTools_1.promptForMissingTool('impl');
            return;
        }
        if (err) {
            vscode.window.showInformationMessage(`Cannot stub inteface: ${stderr}`);
            return;
        }
        let output = stdout;
        vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.insert(insertPos, stdout);
        });
    });
    p.stdin.end();
}
//# sourceMappingURL=goImpl.js.map