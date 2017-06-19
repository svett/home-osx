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
function removeImage() {
    return __awaiter(this, void 0, void 0, function* () {
        const selectedItem = yield quick_pick_image_1.quickPickImage();
        if (selectedItem) {
            // if we're removing all images, remove duplicate IDs, a result of tagging
            if (selectedItem.label.toLowerCase().includes('all images')) {
                selectedItem.ids = Array.from(new Set(selectedItem.ids));
            }
            for (let i = 0; i < selectedItem.ids.length; i++) {
                const image = docker_endpoint_1.docker.getImage(selectedItem.ids[i]);
                // image.remove removes by ID, so to remove a single *tagged* image we
                // just overwrite the name. this is a hack around the dockerode api
                if (selectedItem.ids.length === 1) {
                    if (!selectedItem.label.toLowerCase().includes('<none>')) {
                        image.name = selectedItem.label;
                    }
                }
                image.remove({ force: true }, function (err, data) {
                    if (data) {
                        for (i = 0; i < data.length; i++) {
                            if (data[i].Untagged) {
                                console.log(data[i].Untagged);
                            }
                            else if (data[i].Deleted) {
                                console.log(data[i].Deleted);
                            }
                        }
                        vscode.window.showInformationMessage(selectedItem.label + ' successfully removed');
                        if (telemetry_1.reporter) {
                            telemetry_1.reporter.sendTelemetryEvent('command', {
                                command: teleCmdId
                            });
                        }
                    }
                });
            }
            // show the list again unless the user just did a 'remove all images'
            // if (!selectedItem.label.toLowerCase().includes('all images')) {
            //     setInterval(removeImage, 1000);
            // }
        }
    });
}
exports.removeImage = removeImage;
//# sourceMappingURL=remove-image.js.map