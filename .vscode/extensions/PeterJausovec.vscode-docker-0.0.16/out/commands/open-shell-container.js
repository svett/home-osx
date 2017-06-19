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
const engineTypeShellCommands = {
    [docker_endpoint_1.DockerEngineType.Linux]: "/bin/sh",
    [docker_endpoint_1.DockerEngineType.Windows]: "powershell"
};
function openShellContainer() {
    return __awaiter(this, void 0, void 0, function* () {
        const selectedItem = yield quick_pick_container_1.quickPickContainer();
        if (selectedItem) {
            docker_endpoint_1.docker.getEngineType().then((engineType) => {
                const terminal = vscode.window.createTerminal(`Shell: ${selectedItem.label}`);
                terminal.sendText(`docker exec -it ${selectedItem.ids[0]} ${engineTypeShellCommands[engineType]}`);
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