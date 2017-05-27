"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.system.prune';
function systemPrune() {
    let terminal = vscode.window.createTerminal("docker system prune");
    terminal.sendText(`docker system prune -f`);
    terminal.show();
    if (telemetry_1.reporter) {
        telemetry_1.reporter.sendTelemetryEvent('command', {
            command: teleCmdId
        });
    }
}
exports.systemPrune = systemPrune;
//# sourceMappingURL=system-prune.js.map