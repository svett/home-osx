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
const docker_endpoint_1 = require("./utils/docker-endpoint");
const quick_pick_container_1 = require("./utils/quick-pick-container");
const telemetry_1 = require("../telemetry/telemetry");
const dockerExtension_1 = require("../dockerExtension");
const vscode = require("vscode");
const teleCmdId = 'vscode-docker.container.restart';
function restartContainer(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let containersToRestart;
        if (context && context.containerDesc) {
            containersToRestart = [context.containerDesc];
        }
        else {
            const opts = {
                "filters": {
                    "status": ["running", "paused", "exited"]
                }
            };
            const selectedItem = yield quick_pick_container_1.quickPickContainer(true, opts);
            if (selectedItem) {
                if (selectedItem.label.toLocaleLowerCase().includes("all containers")) {
                    containersToRestart = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
                }
                else {
                    containersToRestart = [selectedItem.containerDesc];
                }
            }
        }
        if (containersToRestart) {
            const numContainers = containersToRestart.length;
            let containerCounter = 0;
            vscode.window.setStatusBarMessage("Docker: Restarting Container(s)...", new Promise((resolve, reject) => {
                containersToRestart.forEach((container) => {
                    docker_endpoint_1.docker.getContainer(container.Id).restart((err, data) => {
                        containerCounter++;
                        if (err) {
                            vscode.window.showErrorMessage(err.message);
                            dockerExtension_1.dockerExplorerProvider.refreshContainers();
                            reject();
                        }
                        if (containerCounter === numContainers) {
                            dockerExtension_1.dockerExplorerProvider.refreshContainers();
                            resolve();
                        }
                    });
                });
            }));
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('command', {
                    command: teleCmdId
                });
            }
        }
    });
}
exports.restartContainer = restartContainer;
//# sourceMappingURL=restart-container.js.map