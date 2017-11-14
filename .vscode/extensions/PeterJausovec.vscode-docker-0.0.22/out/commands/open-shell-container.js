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
const vscode = require("vscode");
const quick_pick_container_1 = require("./utils/quick-pick-container");
const docker_endpoint_1 = require("./utils/docker-endpoint");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.container.open-shell';
const configOptions = vscode.workspace.getConfiguration('docker');
const engineTypeShellCommands = {
    [docker_endpoint_1.DockerEngineType.Linux]: configOptions.get('attachShellCommand.linuxContainer', '/bin/sh'),
    [docker_endpoint_1.DockerEngineType.Windows]: configOptions.get('attachShellCommand.windowsContainer', 'powershell')
};
function openShellContainer(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let containerToAttach;
        if (context && context.containerDesc) {
            containerToAttach = context.containerDesc;
        }
        else {
            const opts = {
                "filters": {
                    "status": ["running"]
                }
            };
            const selectedItem = yield quick_pick_container_1.quickPickContainer(false, opts);
            if (selectedItem) {
                containerToAttach = selectedItem.containerDesc;
            }
        }
        if (containerToAttach) {
            docker_endpoint_1.docker.getEngineType().then((engineType) => {
                const terminal = vscode.window.createTerminal(`Shell: ${containerToAttach.Image}`);
                terminal.sendText(`docker exec -it ${containerToAttach.Id} ${engineTypeShellCommands[engineType]}`);
                terminal.show();
                if (telemetry_1.reporter) {
                    telemetry_1.reporter.sendTelemetryEvent('command', {
                        command: teleCmdId,
                        dockerEngineType: engineTypeShellCommands[engineType]
                    });
                }
            });
        }
    });
}
exports.openShellContainer = openShellContainer;
//# sourceMappingURL=open-shell-container.js.map