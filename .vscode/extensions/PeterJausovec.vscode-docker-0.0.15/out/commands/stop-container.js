"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docker_endpoint_1 = require("./utils/docker-endpoint");
const quick_pick_container_1 = require("./utils/quick-pick-container");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.container.stop';
function stopContainer() {
    quick_pick_container_1.quickPickContainer(true).then(function (selectedItem) {
        if (selectedItem) {
            for (let i = 0; i < selectedItem.ids.length; i++) {
                let container = docker_endpoint_1.docker.getContainer(selectedItem.ids[i]);
                container.stop(function (err, data) {
                    // console.log("Stopped - error: " + err);
                    // console.log("Stopped - data: " + data);
                });
                if (telemetry_1.reporter) {
                    telemetry_1.reporter.sendTelemetryEvent('command', {
                        command: teleCmdId
                    });
                }
            }
        }
    });
}
exports.stopContainer = stopContainer;
//# sourceMappingURL=stop-container.js.map