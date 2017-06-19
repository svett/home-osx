"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const telemetry_1 = require("../telemetry/telemetry");
const dockerExtension_1 = require("../dockerExtension");
const teleCmdId = 'vscode-docker.image.build';
function hasWorkspaceFolder() {
    return vscode.workspace.rootPath ? true : false;
}
function getDockerFileUris() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!hasWorkspaceFolder()) {
            return;
        }
        return yield vscode.workspace.findFiles(dockerExtension_1.DOCKERFILE_GLOB_PATTERN, null, 1000, null);
    });
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
    return __awaiter(this, void 0, void 0, function* () {
        if (dockerFileUri) {
            return createItem(dockerFileUri);
        }
        ;
        const uris = yield getDockerFileUris();
        if (!uris || uris.length == 0) {
            vscode.window.showInformationMessage('Couldn\'t find a Dockerfile in your workspace.');
            return;
        }
        else {
            const res = yield vscode.window.showQuickPick(computeItems(uris), { placeHolder: 'Choose Dockerfile to build' });
            return res;
        }
    });
}
function buildImage(dockerFileUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const uri = yield resolveImageItem(dockerFileUri);
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
        const value = yield vscode.window.showInputBox(opt);
        if (!value)
            return;
        const terminal = vscode.window.createTerminal('Docker');
        terminal.sendText(`docker build -f ${uri.file} -t ${value} ${uri.path}`);
        terminal.show();
        if (telemetry_1.reporter) {
            telemetry_1.reporter.sendTelemetryEvent('command', {
                command: teleCmdId
            });
        }
    });
}
exports.buildImage = buildImage;
//# sourceMappingURL=build-image.js.map