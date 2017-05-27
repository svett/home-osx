"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docker_endpoint_1 = require("./docker-endpoint");
const vscode = require("vscode");
function createItem(container) {
    return {
        label: container.Image,
        description: container.Status,
        ids: [container.Id]
    };
}
function computeItems(containers, includeAll) {
    let allIds = [];
    let items = [];
    for (let i = 0; i < containers.length; i++) {
        let item = createItem(containers[i]);
        allIds.push(item.ids[0]);
        items.push(item);
    }
    if (includeAll && allIds.length > 0) {
        items.unshift({
            label: 'All Containers',
            description: 'Stops all running containers',
            ids: allIds
        });
    }
    return items;
}
function quickPickContainer(includeAll = false) {
    return docker_endpoint_1.docker.getContainerDescriptors().then(containers => {
        if (!containers || containers.length == 0) {
            vscode.window.showInformationMessage('There are no running docker containers.');
            return Promise.resolve(null);
        }
        else {
            let items = computeItems(containers, includeAll);
            return vscode.window.showQuickPick(items, { placeHolder: 'Choose Container' });
        }
    });
}
exports.quickPickContainer = quickPickContainer;
//# sourceMappingURL=quick-pick-container.js.map