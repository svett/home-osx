"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.image.build';
function hasWorkspaceFolder() {
    return vscode.workspace.rootPath ? true : false;
}
function getDockerFileUris() {
    if (!hasWorkspaceFolder()) {
        return Promise.resolve(null);
    }
    return Promise.resolve(vscode.workspace.findFiles('**/[dD]ocker[fF]ile', null, 9999, null));
}
function createItem(uri) {
    let filePath = hasWorkspaceFolder() ? path.join(".", uri.fsPath.substr(vscode.workspace.rootPath.length)) : uri.fsPath;
    return {
        description: null,
        file: filePath,
        label: filePath,
        path: path.dirname(filePath)
    };
}
function computeItems(uris) {
    let items = [];
    for (let i = 0; i < uris.length; i++) {
        items.push(createItem(uris[i]));
    }
    return items;
}
function resolveImageItem(dockerFileUri) {
    return new Promise((resolve) => {
        if (dockerFileUri) {
            return resolve(createItem(dockerFileUri));
        }
        ;
        getDockerFileUris().then((uris) => {
            if (!uris || uris.length == 0) {
                vscode.window.showInformationMessage('Couldn\'t find a Dockerfile in your workspace.');
                resolve();
            }
            else {
                let items = computeItems(uris);
                vscode.window.showQuickPick(items, { placeHolder: 'Choose Dockerfile to build' }).then(resolve);
            }
        });
    });
}
function buildImage(dockerFileUri) {
    resolveImageItem(dockerFileUri).then((uri) => {
        if (!uri)
            return;
        let imageName;
        if (process.platform === 'win32') {
            imageName = uri.path.split('\\').pop().toLowerCase();
        }
        else {
            imageName = uri.path.split('/').pop().toLowerCase();
        }
        if (imageName === '.') {
            if (process.platform === 'win32') {
                imageName = vscode.workspace.rootPath.split('\\').pop().toLowerCase();
            }
            else {
                imageName = vscode.workspace.rootPath.split('/').pop().toLowerCase();
            }
        }
        const opt = {
            placeHolder: imageName + ':latest',
            prompt: 'Tag image as...',
            value: imageName + ':latest'
        };
        vscode.window.showInputBox(opt).then((value) => {
            if (!value)
                return;
            let terminal = vscode.window.createTerminal('Docker');
            terminal.sendText(`docker build -f ${uri.file} -t ${value} ${uri.path}`);
            terminal.show();
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('command', {
                    command: teleCmdId
                });
            }
        });
    });
}
exports.buildImage = buildImage;
//# sourceMappingURL=build-image.js.map