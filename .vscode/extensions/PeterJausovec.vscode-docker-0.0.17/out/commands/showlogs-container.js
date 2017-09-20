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
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.container.show-logs';
function showLogsContainer(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let containerToLog;
        if (context && context.containerDesc) {
            containerToLog = context.containerDesc;
        }
        else {
            const opts = {
                "filters": {
                    "status": ["running"]
                }
            };
            const selectedItem = yield quick_pick_container_1.quickPickContainer(false, opts);
            if (selectedItem) {
                containerToLog = selectedItem.containerDesc;
            }
        }
        if (containerToLog) {
            const terminal = vscode.window.createTerminal(containerToLog.Image);
            terminal.sendText(`docker logs -f ${containerToLog.Id}`);
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