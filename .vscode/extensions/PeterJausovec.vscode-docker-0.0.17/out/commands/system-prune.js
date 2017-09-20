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
const telemetry_1 = require("../telemetry/telemetry");
const dockerExtension_1 = require("../dockerExtension");
const teleCmdId = 'vscode-docker.system.prune';
function systemPrune() {
    return __awaiter(this, void 0, void 0, function* () {
        const terminal = vscode.window.createTerminal("docker system prune");
        terminal.sendText(`docker system prune -f`);
        terminal.show();
        dockerExtension_1.dockerExplorerProvider.refreshContainers(true);
        dockerExtension_1.dockerExplorerProvider.refreshImages(true);
        if (telemetry_1.reporter) {
            telemetry_1.reporter.sendTelemetryEvent('command', {
                command: teleCmdId
            });
        }
    });
}
exports.systemPrune = systemPrune;
//# sourceMappingURL=system-prune.js.map