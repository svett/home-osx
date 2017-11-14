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
const quick_pick_image_1 = require("./utils/quick-pick-image");
const vscode = require("vscode");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.image.remove';
function removeImage(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let imagesToRemove;
        if (context && context.imageDesc) {
            imagesToRemove = [context.imageDesc];
        }
        else {
            const selectedItem = yield quick_pick_image_1.quickPickImage(true);
            if (selectedItem) {
                if (selectedItem.label.toLowerCase().includes('all containers')) {
                    imagesToRemove = yield docker_endpoint_1.docker.getImageDescriptors();
                }
                else {
                    imagesToRemove = [selectedItem.imageDesc];
                }
            }
        }
        if (imagesToRemove) {
            const numImages = imagesToRemove.length;
            let imageCounter = 0;
            vscode.window.setStatusBarMessage("Docker: Removing Image(s)...", new Promise((resolve, reject) => {
                imagesToRemove.forEach((img) => {
                    docker_endpoint_1.docker.getImage(img.Id).remove({ force: true }, function (err, data) {
                        imageCounter++;
                        if (err) {
                            vscode.window.showErrorMessage(err.message);
                            reject();
                        }
                        if (imageCounter === numImages) {
                            resolve();
                        }
                    });
                });
            }));
        }
        if (telemetry_1.reporter) {
            telemetry_1.reporter.sendTelemetryEvent('command', {
                command: teleCmdId
            });
        }
    });
}
exports.removeImage = removeImage;
//# sourceMappingURL=remove-image.js.map