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
        this._onDidChangeTreeData.fire();
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
            let opts = {};
            const nodes = [];
            if (!element) {
                nodes.push(new DockerNode("Images", vscode.TreeItemCollapsibleState.Collapsed, null, null));
                nodes.push(new DockerNode("Running Containers", vscode.TreeItemCollapsibleState.Collapsed, null, null));
                nodes.push(new DockerNode("Stopped Containers", vscode.TreeItemCollapsibleState.Collapsed, null, null));
            }
            else {
                if (element.label === 'Images') {
                    const images = yield docker_endpoint_1.docker.getImageDescriptors();
                    if (!images || images.length == 0) {
                        return [];
                    }
                    else {
                        for (let i = 0; i < images.length; i++) {
                            if (!images[i].RepoTags) {
                                nodes.push(new DockerNode("<none>:<none>", vscode.TreeItemCollapsibleState.None));
                            }
                            else {
                                for (let j = 0; j < images[i].RepoTags.length; j++) {
                                    nodes.push(new DockerNode(images[i].RepoTags[j], vscode.TreeItemCollapsibleState.None));
                                }
                            }
                        }
                    }
                }
                if (element.label === 'Running Containers') {
                    opts = {
                        "filters": {
                            "status": ["created", "restarting", "running", "paused"]
                        }
                    };
                    const containers = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
                    if (!containers || containers.length == 0) {
                        return [];
                    }
                    else {
                        for (let i = 0; i < containers.length; i++) {
                            nodes.push(new DockerNode(containers[i].Image + ' (' + containers[i].Status + ')', vscode.TreeItemCollapsibleState.None));
                        }
                    }
                }
                if (element.label === 'Stopped Containers') {
                    opts = {
                        "filters": {
                            "status": ["exited", "dead"]
                        }
                    };
                    const containers = yield docker_endpoint_1.docker.getContainerDescriptors(opts);
                    if (!containers || containers.length == 0) {
                        return [];
                    }
                    else {
                        for (let i = 0; i < containers.length; i++) {
                            nodes.push(new DockerNode(containers[i].Image + ' (' + containers[i].Status + ')', vscode.TreeItemCollapsibleState.None));
                        }
                    }
                }
            }
            return nodes;
            // if (this.pathExists(packageJsonPath)) {
            //     const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            //     const toDep = (moduleName: string): DockerNode => {
            //         if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
            //             return new DockerNode(moduleName, vscode.TreeItemCollapsibleState.Collapsed);
            //         } else {
            //             return new DockerNode(moduleName, vscode.TreeItemCollapsibleState.None, {
            //                 command: 'extension.openPackageOnNpm',
            //                 title: '',
            //                 arguments: [moduleName],
            //             });
            //         }
            //     }
            //     const deps = packageJson.dependencies
            //         ? Object.keys(packageJson.dependencies).map(toDep)
            //         : [];
            //     const devDeps = packageJson.devDependencies
            //         ? Object.keys(packageJson.devDependencies).map(toDep)
            //         : [];
            //     return deps.concat(devDeps);
            // } else {
            //     return [];
            // }
        });
    }
}
exports.DockerExplorerProvider = DockerExplorerProvider;
class DockerNode extends vscode.TreeItem {
    constructor(label, collapsibleState, command, iconPath = {
            light: path.join(__filename, '..', '..', '..', 'images', 'light', 'mono_moby_small.png'),
            dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'mono_moby_small.png')
        }) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = iconPath;
        this.iconPath = iconPath;
    }
}
//# sourceMappingURL=dockerExplorer.js.map