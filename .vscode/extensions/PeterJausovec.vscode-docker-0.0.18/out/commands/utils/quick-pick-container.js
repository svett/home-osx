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
        containerDesc: container
    };
}
function computeItems(containers, includeAll) {
    const items = [];
    for (let i = 0; i < containers.length; i++) {
        const item = createItem(containers[i]);
        items.push(item);
    }
    if (includeAll && containers.length > 0) {
        items.unshift({
            label: 'All Containers'
        });
    }
    return items;
}
function quickPickContainer(includeAll = false, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        // "status": ["created", "restarting", "running", "paused", "exited", "dead"]
        if (!opts) {
            opts = {
                "filters": {
                    "status": ["running"]
                }
            };
        }
        ;
        const containers = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
        if (!containers || containers.length == 0) {
            vscode.window.showInformationMessage('There are no Docker Containers.');
            return;
        }
        else {
            const items = computeItems(containers, includeAll);
            return vscode.window.showQuickPick(items, { placeHolder: 'Choose container...' });
        }
    });
}
exports.quickPickContainer = quickPickContainer;
//# sourceMappingURL=quick-pick-container.js.map