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
        description: null,
        ids: [image.Id],
        parentId: image.ParentId,
        created: image.Created,
        repoTags: image.RepoTags,
        size: image.Size,
        virtualSize: image.VirtualSize
    };
}
function computeItems(images, includeAll) {
    const allIds = [];
    const items = [];
    for (let i = 0; i < images.length; i++) {
        if (!images[i].RepoTags) {
            const item = createItem(images[i], '<none>:<none>');
            allIds.push(item.ids[0]);
            items.push(item);
        }
        else {
            for (let j = 0; j < images[i].RepoTags.length; j++) {
                const item = createItem(images[i], images[i].RepoTags[j]);
                allIds.push(item.ids[0]);
                items.push(item);
            }
        }
    }
    if (includeAll && allIds.length > 0) {
        items.unshift({
            label: 'All Images',
            description: 'Remove all images',
            ids: allIds
        });
    }
    return items;
}
function quickPickImage(includeAll) {
    return __awaiter(this, void 0, void 0, function* () {
        const images = yield docker_endpoint_1.docker.getImageDescriptors();
        if (!images || images.length == 0) {
            vscode.window.showInformationMessage('There are no docker images yet. Try Build first.');
            return;
        }
        else {
            const items = computeItems(images, includeAll);
            return vscode.window.showQuickPick(items, { placeHolder: 'Choose image' });
        }
    });
}
exports.quickPickImage = quickPickImage;
//# sourceMappingURL=quick-pick-image.js.map