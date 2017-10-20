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
const dockerExtension_1 = require("../dockerExtension");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.compose.'; // we append up or down when reporting telemetry
function getDockerComposeFileUris(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield vscode.workspace.findFiles(new vscode.RelativePattern(folder, dockerExtension_1.COMPOSE_FILE_GLOB_PATTERN), null, 9999, null);
    });
}
function createItem(folder, uri) {
    const filePath = folder ? path.join('.', uri.fsPath.substr(folder.uri.fsPath.length)) : uri.fsPath;
    return {
        description: null,
        file: filePath,
        label: filePath,
        path: path.dirname(filePath)
    };
}
function computeItems(folder, uris) {
    const items = [];
    for (let i = 0; i < uris.length; i++) {
        items.push(createItem(folder, uris[i]));
    }
    return items;
}
function compose(command, message) {
    return __awaiter(this, void 0, void 0, function* () {
        let folder;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
            folder = vscode.workspace.workspaceFolders[0];
        }
        else {
            folder = yield vscode.window.showWorkspaceFolderPick();
        }
        if (!folder) {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage('Docker compose can only run if VS Code is opened on a folder.');
            }
            else {
                vscode.window.showErrorMessage('Docker compose can only run if a workspace folder is picked in VS Code.');
            }
            return;
        }
        const uris = yield getDockerComposeFileUris(folder);
        if (!uris || uris.length == 0) {
            vscode.window.showInformationMessage('Couldn\'t find any docker-compose file in your workspace.');
        }
        else {
            const items = computeItems(folder, uris);
            const selectedItem = yield vscode.window.showQuickPick(items, { placeHolder: `Choose Docker Compose file ${message}` });
            if (selectedItem) {
                const terminal = vscode.window.createTerminal('Docker Compose');
                terminal.sendText(command.toLowerCase() === 'up' ? `docker-compose -f ${selectedItem.file} ${command} -d --build` : `docker-compose -f ${selectedItem.file} ${command}`);
                terminal.show();
                if (telemetry_1.reporter) {
                    telemetry_1.reporter.sendTelemetryEvent('command', {
                        command: teleCmdId + command
                    });
                }
            }
        }
    });
}
exports.compose = compose;
function composeUp() {
    compose('up', 'to bring up');
}
exports.composeUp = composeUp;
function composeDown() {
    compose('down', 'to take down');
}
exports.composeDown = composeDown;
//# sourceMappingURL=docker-compose.js.map