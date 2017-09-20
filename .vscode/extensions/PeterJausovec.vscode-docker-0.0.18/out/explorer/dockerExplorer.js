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
const docker_endpoint_1 = require("../commands/utils/docker-endpoint");
class DockerExplorerProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this.refreshImages(false);
        this.refreshContainers(false);
    }
    refreshImages(delay) {
        if (delay) {
            setTimeout(() => {
                this._onDidChangeTreeData.fire(this._imagesNode);
            }, 5000);
        }
        else {
            this._onDidChangeTreeData.fire(this._imagesNode);
        }
    }
    refreshContainers(delay) {
        if (delay) {
            setTimeout(() => {
                this._onDidChangeTreeData.fire(this._containersNode);
            }, 5000);
        }
        else {
            this._onDidChangeTreeData.fire(this._containersNode);
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getDockerNodes(element);
        });
    }
    getDockerNodes(element) {
        return __awaiter(this, void 0, void 0, function* () {
            let iconPath = {};
            let contextValue = "";
            let node;
            const nodes = [];
            if (!element) {
                this._imagesNode = new DockerNode('Images', vscode.TreeItemCollapsibleState.Collapsed, 'rootImages', null);
                this._containersNode = new DockerNode('Containers', vscode.TreeItemCollapsibleState.Collapsed, 'rootContainers', null);
                nodes.push(this._imagesNode);
                nodes.push(this._containersNode);
            }
            else {
                if (element.contextValue === 'rootImages') {
                    let opts = {
                        "filters": {
                            "dangling": ["false"]
                        }
                    };
                    try {
                        const images = yield docker_endpoint_1.docker.getImageDescriptors(opts);
                        if (!images || images.length == 0) {
                            return [];
                        }
                        else {
                            iconPath = {
                                light: path.join(__filename, '..', '..', '..', 'images', 'light', 'application.svg'),
                                dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'application.svg')
                            };
                            for (let i = 0; i < images.length; i++) {
                                contextValue = "dockerImage";
                                if (!images[i].RepoTags) {
                                    let node = new DockerNode("<none>:<none>", vscode.TreeItemCollapsibleState.None, contextValue, iconPath);
                                    node.imageDesc = images[i];
                                    nodes.push(node);
                                }
                                else {
                                    for (let j = 0; j < images[i].RepoTags.length; j++) {
                                        let node = new DockerNode(images[i].RepoTags[j], vscode.TreeItemCollapsibleState.None, contextValue, iconPath);
                                        node.imageDesc = images[i];
                                        nodes.push(node);
                                    }
                                }
                            }
                        }
                    }
                    catch (error) {
                        vscode.window.showErrorMessage('Unable to connect to Docker, is the Docker daemon running?');
                        console.log(error);
                    }
                }
                if (element.contextValue === 'rootContainers') {
                    let opts = {
                        "filters": {
                            "status": ["created", "restarting", "running", "paused", "exited", "dead"]
                        }
                    };
                    try {
                        const containers = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
                        if (!containers || containers.length == 0) {
                            return [];
                        }
                        else {
                            for (let i = 0; i < containers.length; i++) {
                                if (['exited', 'dead'].includes(containers[i].State)) {
                                    contextValue = "dockerContainerStopped";
                                    iconPath = {
                                        light: path.join(__filename, '..', '..', '..', 'images', 'light', 'stoppedContainer.svg'),
                                        dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'stoppedContainer.svg')
                                    };
                                }
                                else {
                                    contextValue = "dockerContainerRunning";
                                    iconPath = {
                                        light: path.join(__filename, '..', '..', '..', 'images', 'light', 'runningContainer.svg'),
                                        dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'runningContainer.svg')
                                    };
                                }
                                const containerName = containers[i].Names[0].substring(1);
                                let node = new DockerNode(`${containers[i].Image} (${containerName}) [${containers[i].Status}]`, vscode.TreeItemCollapsibleState.None, contextValue, iconPath);
                                node.containerDesc = containers[i];
                                nodes.push(node);
                            }
                        }
                    }
                    catch (error) {
                        vscode.window.showErrorMessage('Unable to connect to Docker, is the Docker daemon running?');
                        console.log(error);
                    }
                }
            }
            return nodes;
        });
    }
}
exports.DockerExplorerProvider = DockerExplorerProvider;
class DockerNode extends vscode.TreeItem {
    constructor(label, collapsibleState, contextValue, iconPath) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.iconPath = iconPath;
    }
}
exports.DockerNode = DockerNode;
//# sourceMappingURL=dockerExplorer.js.map