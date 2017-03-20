"use strict";
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
    let allIds = [];
    let items = [];
    for (let i = 0; i < images.length; i++) {
        if (!images[i].RepoTags) {
            let item = createItem(images[i], '<none>:<none>');
            allIds.push(item.ids[0]);
            items.push(item);
        }
        else {
            for (let j = 0; j < images[i].RepoTags.length; j++) {
                let item = createItem(images[i], images[i].RepoTags[j]);
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
    return docker_endpoint_1.docker.getImageDescriptors().then(images => {
        if (!images || images.length == 0) {
            vscode.window.showInformationMessage('There are no docker images yet. Try Build first.');
            return Promise.resolve(null);
        }
        else {
            let items = computeItems(images, includeAll);
            return vscode.window.showQuickPick(items, { placeHolder: 'Choose image' });
        }
    });
}
exports.quickPickImage = quickPickImage;
//# sourceMappingURL=quick-pick-image.js.map