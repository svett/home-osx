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
const docker_endpoint_1 = require("./utils/docker-endpoint");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.image.tag';
function tagImage(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let imageName;
        let imageToTag;
        if (context && context.imageDesc) {
            imageToTag = context.imageDesc;
            imageName = context.label;
        }
        else {
            const selectedItem = yield quick_pick_image_1.quickPickImage(false);
            if (selectedItem) {
                imageToTag = selectedItem.imageDesc;
                imageName = selectedItem.label;
            }
        }
        if (imageToTag) {
            const configOptions = vscode.workspace.getConfiguration('docker');
            const defaultRegistryPath = configOptions.get('defaultRegistryPath', '');
            if (defaultRegistryPath.length > 0) {
                imageName = defaultRegistryPath + '/' + imageName;
            }
            const defaultRegistry = configOptions.get('defaultRegistry', '');
            if (defaultRegistry.length > 0) {
                imageName = defaultRegistry + '/' + imageName;
            }
            var opt = {
                ignoreFocusOut: true,
                placeHolder: imageName,
                prompt: 'Tag image as...',
                value: imageName
            };
            const value = yield vscode.window.showInputBox(opt);
            if (value) {
                let repo = value;
                let tag = 'latest';
                if (value.lastIndexOf(':') > 0) {
                    repo = value.slice(0, value.lastIndexOf(':'));
                    tag = value.slice(value.lastIndexOf(':') + 1);
                }
                const image = docker_endpoint_1.docker.getImage(imageToTag.Id);
                image.tag({ repo: repo, tag: tag }, function (err, data) {
                    if (err) {
                        vscode.window.showErrorMessage('Docker Tag error: ' + err.message);
                    }
                });
                if (telemetry_1.reporter) {
                    telemetry_1.reporter.sendTelemetryEvent('command', {
                        command: teleCmdId
                    });
                }
            }
        }
        ;
    });
}
exports.tagImage = tagImage;
//# sourceMappingURL=tag-image.js.map