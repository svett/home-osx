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
const quick_pick_image_1 = require("./utils/quick-pick-image");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.image.push';
function pushImage(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let imageToPush;
        let imageName = "";
        if (context && context.imageDesc) {
            imageToPush = context.imageDesc;
            imageName = context.label;
        }
        else {
            const selectedItem = yield quick_pick_image_1.quickPickImage();
            if (selectedItem) {
                imageToPush = selectedItem.imageDesc;
                imageName = selectedItem.label;
            }
        }
        if (imageToPush) {
            const terminal = vscode.window.createTerminal(imageName);
            terminal.sendText(`docker push ${imageName}`);
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