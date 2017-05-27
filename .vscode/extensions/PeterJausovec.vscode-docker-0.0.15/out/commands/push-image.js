"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const quick_pick_image_1 = require("./utils/quick-pick-image");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.image.push';
function pushImage() {
    quick_pick_image_1.quickPickImage(false).then(function (selectedItem) {
        if (selectedItem) {
            let terminal = vscode.window.createTerminal(selectedItem.label);
            terminal.sendText(`docker push ${selectedItem.label}`);
            terminal.show();
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('command', {
                    command: teleCmdId
                });
            }
        }
        ;
    });
}
exports.pushImage = pushImage;
//# sourceMappingURL=push-image.js.map