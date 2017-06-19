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
const teleCmdId = 'vscode-docker.container.stop';
function stopContainer() {
    return __awaiter(this, void 0, void 0, function* () {
        const selectedItem = yield quick_pick_container_1.quickPickContainer(true);
        if (selectedItem) {
            for (let i = 0; i < selectedItem.ids.length; i++) {
                const container = docker_endpoint_1.docker.getContainer(selectedItem.ids[i]);
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