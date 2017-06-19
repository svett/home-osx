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
function hasWorkspaceFolder() {
    return vscode.workspace.rootPath ? true : false;
}
function getDockerComposeFileUris() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!hasWorkspaceFolder()) {
            return;
        }
        return yield vscode.workspace.findFiles(dockerExtension_1.COMPOSE_FILE_GLOB_PATTERN, null, 9999, null);
    });
}
function createItem(uri) {
    const filePath = hasWorkspaceFolder() ? path.join('.', uri.fsPath.substr(vscode.workspace.rootPath.length)) : uri.fsPath;
    return {
        description: null,
        file: filePath,
        label: filePath,
        path: path.dirname(filePath)
    };
}
function computeItems(uris) {
    const items = [];
    for (let i = 0; i < uris.length; i++) {
        items.push(createItem(uris[i]));
    }
    return items;
}
function compose(command, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = yield getDockerComposeFileUris();
        if (!uris || uris.length == 0) {
            vscode.window.showInformationMessage('Couldn\'t find any docker-compose file in your workspace.');
        }
        else {
            const items = computeItems(uris);
            const selectedItem = yield vscode.window.showQuickPick(items, { placeHolder: `Choose Docker Compose file ${message}` });
            if (selectedItem) {
                const terminal = vscode.window.createTerminal('Docker Compose');
                terminal.sendText(`docker-compose -f ${selectedItem.file} ${command}`);
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