"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const quick_pick_image_1 = require("./utils/quick-pick-image");
const docker_endpoint_1 = require("./utils/docker-endpoint");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.image.tag';
function tagImage() {
    quick_pick_image_1.quickPickImage(false).then(function (selectedItem) {
        if (selectedItem) {
            var imageName = selectedItem.label;
            let configOptions = vscode.workspace.getConfiguration('docker');
            let defaultRegistryPath = configOptions.get('defaultRegistryPath', '');
            if (defaultRegistryPath.length > 0) {
                imageName = defaultRegistryPath + '/' + imageName;
            }
            let defaultRegistry = configOptions.get('defaultRegistry', '');
            if (defaultRegistry.length > 0) {
                imageName = defaultRegistry + '/' + imageName;
            }
            var opt = {
                ignoreFocusOut: true,
                placeHolder: selectedItem.label,
                prompt: 'Tag image as...',
                value: imageName
            };
            vscode.window.showInputBox(opt).then((value) => {
                if (value) {
                    var repo = value;
                    var tag = 'latest';
                    if (value.lastIndexOf(':') > 0) {
                        repo = value.slice(0, value.lastIndexOf(':'));
                        tag = value.slice(value.lastIndexOf(':') + 1);
                    }
                    let image = docker_endpoint_1.docker.getImage(selectedItem.ids[0]);
                    image.tag({ repo: repo, tag: tag }, function (err, data) {
                        if (err) {
                            console.log('Docker Tag error: ' + err);
                        }
                    });
                    if (telemetry_1.reporter) {
                        telemetry_1.reporter.sendTelemetryEvent('command', {
                            command: teleCmdId
                        });
                    }
                }
            });
        }
        ;
    });
}
exports.tagImage = tagImage;
//# sourceMappingURL=tag-image.js.map