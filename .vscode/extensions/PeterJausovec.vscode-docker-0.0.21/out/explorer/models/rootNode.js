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
const path = require("path");
const containerNode_1 = require("./containerNode");
const docker_endpoint_1 = require("../../commands/utils/docker-endpoint");
const imageNode_1 = require("./imageNode");
const nodeBase_1 = require("./nodeBase");
const registryRootNode_1 = require("./registryRootNode");
class RootNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, eventEmitter, azureAccount) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        this.eventEmitter = eventEmitter;
        this.azureAccount = azureAccount;
        if (this.contextValue === 'imagesRootNode') {
            this._imagesNode = this;
        }
        else if (this.contextValue === 'containersRootNode') {
            this._containersNode = this;
        }
        this._azureAccount = azureAccount;
    }
    autoRefreshImages() {
        const configOptions = vscode.workspace.getConfiguration('docker');
        const refreshInterval = configOptions.get('explorerRefreshInterval', 1000);
        // https://github.com/Microsoft/vscode/issues/30535
        // if (this._imagesNode.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
        //     clearInterval(this._imageDebounceTimer);
        //     return;
        // }
        clearInterval(this._imageDebounceTimer);
        if (refreshInterval > 0) {
            this._imageDebounceTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                const opts = {
                    "filters": {
                        "dangling": ["false"]
                    }
                };
                let needToRefresh = false;
                let found = false;
                const images = yield docker_endpoint_1.docker.getImageDescriptors(opts);
                if (!this._imageCache) {
                    this._imageCache = images;
                }
                if (this._imageCache.length !== images.length) {
                    needToRefresh = true;
                }
                else {
                    for (let i = 0; i < this._imageCache.length; i++) {
                        let before = JSON.stringify(this._imageCache[i]);
                        for (let j = 0; j < images.length; j++) {
                            let after = JSON.stringify(images[j]);
                            if (before === after) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            needToRefresh = true;
                            break;
                        }
                    }
                }
                if (needToRefresh) {
                    this.eventEmitter.fire(this._imagesNode);
                    this._imageCache = images;
                }
            }), refreshInterval);
        }
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: this.contextValue
        };
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (element.contextValue === 'imagesRootNode') {
                this.autoRefreshImages();
                return this.getImages();
            }
            if (element.contextValue === 'containersRootNode') {
                this.autoRefreshContainers();
                return this.getContainers();
            }
            if (element.contextValue === 'registriesRootNode') {
                return this.getRegistries();
            }
        });
    }
    getImages() {
        return __awaiter(this, void 0, void 0, function* () {
            const imageNodes = [];
            const images = yield docker_endpoint_1.docker.getImageDescriptors();
            if (!images || images.length === 0) {
                return [];
            }
            for (let i = 0; i < images.length; i++) {
                if (!images[i].RepoTags) {
                    let node = new imageNode_1.ImageNode("<none>:<none>", "localImageNode", this.eventEmitter);
                    node.imageDesc = images[i];
                    imageNodes.push(node);
                }
                else {
                    for (let j = 0; j < images[i].RepoTags.length; j++) {
                        let node = new imageNode_1.ImageNode(images[i].RepoTags[j], "localImageNode", this.eventEmitter);
                        node.imageDesc = images[i];
                        imageNodes.push(node);
                    }
                }
            }
            return imageNodes;
        });
    }
    autoRefreshContainers() {
        const configOptions = vscode.workspace.getConfiguration('docker');
        const refreshInterval = configOptions.get('explorerRefreshInterval', 1000);
        // https://github.com/Microsoft/vscode/issues/30535
        // if (this._containersNode.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
        //     clearInterval(this._containerDebounceTimer);
        //     return;
        // }
        clearInterval(this._containerDebounceTimer);
        if (refreshInterval > 0) {
            this._containerDebounceTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                const opts = {
                    "filters": {
                        "status": ["created", "restarting", "running", "paused", "exited", "dead"]
                    }
                };
                let needToRefresh = false;
                let found = false;
                const containers = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
                if (!this._containerCache) {
                    this._containerCache = containers;
                }
                if (this._containerCache.length !== containers.length) {
                    needToRefresh = true;
                }
                else {
                    for (let i = 0; i < this._containerCache.length; i++) {
                        let ctr = this._containerCache[i];
                        for (let j = 0; j < containers.length; j++) {
                            // can't do a full object compare because "Status" keeps changing for running containers
                            if (ctr.Id === containers[j].Id &&
                                ctr.Image === containers[j].Image &&
                                ctr.State === containers[j].State) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            needToRefresh = true;
                            break;
                        }
                    }
                }
                if (needToRefresh) {
                    this.eventEmitter.fire(this._containersNode);
                    this._containerCache = containers;
                }
            }), refreshInterval);
        }
    }
    getContainers() {
        return __awaiter(this, void 0, void 0, function* () {
            const containerNodes = [];
            let contextValue;
            let iconPath = {};
            const opts = {
                "filters": {
                    "status": ["created", "restarting", "running", "paused", "exited", "dead"]
                }
            };
            const containers = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
            if (!containers || containers.length == 0) {
                return [];
            }
            else {
                for (let i = 0; i < containers.length; i++) {
                    if (['exited', 'dead'].includes(containers[i].State)) {
                        contextValue = "stoppedLocalContainerNode";
                        iconPath = {
                            light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'stoppedContainer.svg'),
                            dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'stoppedContainer.svg')
                        };
                    }
                    else {
                        contextValue = "runningLocalContainerNode";
                        iconPath = {
                            light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'runningContainer.svg'),
                            dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'runningContainer.svg')
                        };
                    }
                    let containerNode = new containerNode_1.ContainerNode(`${containers[i].Image} (${containers[i].Names[0].substring(1)}) [${containers[i].Status}]`, contextValue, iconPath);
                    containerNode.containerDesc = containers[i];
                    containerNodes.push(containerNode);
                }
            }
            return containerNodes;
        });
    }
    getRegistries() {
        return __awaiter(this, void 0, void 0, function* () {
            const registryRootNodes = [];
            registryRootNodes.push(new registryRootNode_1.RegistryRootNode('DockerHub', "dockerHubRootNode", null));
            if (this._azureAccount) {
                registryRootNodes.push(new registryRootNode_1.RegistryRootNode('Azure', "azureRegistryRootNode", this.eventEmitter, this._azureAccount));
            }
            return registryRootNodes;
        });
    }
}
exports.RootNode = RootNode;
//# sourceMappingURL=rootNode.js.map