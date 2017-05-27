"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const quick_pick_container_1 = require("./utils/quick-pick-container");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.container.show-logs';
function showLogsContainer() {
    quick_pick_container_1.quickPickContainer().then(function (selectedItem) {
        if (selectedItem) {
            let terminal = vscode.window.createTerminal(selectedItem.label);
            terminal.sendText(`docker logs -f ${selectedItem.ids[0]}`);
            terminal.show();
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('command', {
                    command: teleCmdId
                });
            }
        }
    });
}
exports.showLogsContainer = showLogsContainer;
//# sourceMappingURL=showlogs-container.js.map