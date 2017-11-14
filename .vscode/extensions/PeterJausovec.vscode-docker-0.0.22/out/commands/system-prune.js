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
const docker_endpoint_1 = require("./utils/docker-endpoint");
const teleCmdId = 'vscode-docker.system.prune';
function systemPrune() {
    return __awaiter(this, void 0, void 0, function* () {
        const terminal = vscode.window.createTerminal("docker system prune");
        const semver = require(`${vscode.env.appRoot}/node_modules/semver`);
        try {
            const info = yield docker_endpoint_1.docker.getEngineInfo();
            // in docker 17.06.1 and higher you must specify the --volumes flag
            if (semver.gte(info.ServerVersion, '17.6.1', true)) {
                terminal.sendText(`docker system prune --volumes -f`);
            }
            else {
                terminal.sendText(`docker system prune -f`);
            }
            terminal.show();
        }
        catch (error) {
            vscode.window.showErrorMessage('Unable to connect to Docker, is the Docker daemon running?');
            console.log(error);
        }
        if (telemetry_1.reporter) {
            telemetry_1.reporter.sendTelemetryEvent('command', {
                command: teleCmdId
            });
        }
    });
}
exports.systemPrune = systemPrune;
//# sourceMappingURL=system-prune.js.map