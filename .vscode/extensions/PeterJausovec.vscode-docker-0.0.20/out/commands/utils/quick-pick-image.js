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
const docker_endpoint_1 = require("./docker-endpoint");
const vscode = require("vscode");
function createItem(image, repoTag) {
    return {
        label: repoTag || '<none>',
        imageDesc: image
    };
}
function computeItems(images, includeAll) {
    const items = [];
    for (let i = 0; i < images.length; i++) {
        if (!images[i].RepoTags) {
            // dangling
            const item = createItem(images[i], '<none>:<none>');
            items.push(item);
        }
        else {
            for (let j = 0; j < images[i].RepoTags.length; j++) {
                const item = createItem(images[i], images[i].RepoTags[j]);
                items.push(item);
            }
        }
    }
    if (includeAll && images.length > 0) {
        items.unshift({
            label: 'All Images'
        });
    }
    return items;
}
function quickPickImage(includeAll) {
    return __awaiter(this, void 0, void 0, function* () {
        const images = yield docker_endpoint_1.docker.getImageDescriptors();
        if (!images || images.length == 0) {
            vscode.window.showInformationMessage('There are no docker images. Try Docker Build first.');
            return;
        }
        else {
            const items = computeItems(images, includeAll);
            return vscode.window.showQuickPick(items, { placeHolder: 'Choose image...' });
        }
    });
}
exports.quickPickImage = quickPickImage;
//# sourceMappingURL=quick-pick-image.js.map