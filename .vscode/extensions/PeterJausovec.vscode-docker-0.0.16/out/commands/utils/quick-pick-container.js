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
function createItem(container) {
    return {
        label: container.Image,
        description: container.Status,
        ids: [container.Id]
    };
}
function computeItems(containers, includeAll) {
    const allIds = [];
    const items = [];
    for (let i = 0; i < containers.length; i++) {
        const item = createItem(containers[i]);
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
    return __awaiter(this, void 0, void 0, function* () {
        const containers = yield docker_endpoint_1.docker.getContainerDescriptors();
        if (!containers || containers.length == 0) {
            vscode.window.showInformationMessage('There are no running docker containers.');
            return;
        }
        else {
            const items = computeItems(containers, includeAll);
            return vscode.window.showQuickPick(items, { placeHolder: 'Choose Container' });
        }
    });
}
exports.quickPickContainer = quickPickContainer;
//# sourceMappingURL=quick-pick-container.js.map