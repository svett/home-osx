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
const docker_endpoint_1 = require("./utils/docker-endpoint");
const telemetry_1 = require("../telemetry/telemetry");
const dockerExtension_1 = require("../dockerExtension");
const quick_pick_container_1 = require("./utils/quick-pick-container");
const teleCmdId = 'vscode-docker.container.remove';
function removeContainer(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let containersToRemove;
        if (context && context.containerDesc) {
            containersToRemove = [context.containerDesc];
        }
        else {
            const opts = {
                "filters": {
                    "status": ["created", "restarting", "running", "paused", "exited", "dead"]
                }
            };
            const selectedItem = yield quick_pick_container_1.quickPickContainer(true, opts);
            if (selectedItem) {
                if (selectedItem.label.toLowerCase().includes('all containers')) {
                    containersToRemove = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
                }
                else {
                    containersToRemove = [selectedItem.containerDesc];
                }
            }
        }
        if (containersToRemove) {
            const numContainers = containersToRemove.length;
            let containerCounter = 0;
            vscode.window.setStatusBarMessage("Docker: Removing Container(s)...", new Promise((resolve, reject) => {
                containersToRemove.forEach((c) => {
                    docker_endpoint_1.docker.getContainer(c.Id).remove({ force: true }, function (err, data) {
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
        }
        telemetry_1.reporter && telemetry_1.reporter.sendTelemetryEvent("command", { command: teleCmdId });
    });
}
exports.removeContainer = removeContainer;
//# sourceMappingURL=remove-container.js.map