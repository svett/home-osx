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
const dockerHub = require("./dockerHubUtils");
const nodeBase_1 = require("./nodeBase");
class DockerHubOrgNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, iconPath = {}) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        this.iconPath = iconPath;
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: this.contextValue,
            iconPath: this.iconPath
        };
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            const repoNodes = [];
            let node;
            const user = yield dockerHub.getUser();
            const myRepos = yield dockerHub.getRepositories(user.username);
            for (let i = 0; i < myRepos.length; i++) {
                const myRepo = yield dockerHub.getRepositoryInfo(myRepos[i]);
                let iconPath = {
                    light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'Repository_16x.svg'),
                    dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'Repository_16x.svg')
                };
                node = new DockerHubRepositoryNode(myRepo.name, 'dockerHubRepository', iconPath);
                node.repository = myRepo;
                node.userName = element.userName;
                node.password = element.password;
                repoNodes.push(node);
            }
            return repoNodes;
        });
    }
}
exports.DockerHubOrgNode = DockerHubOrgNode;
class DockerHubRepositoryNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, iconPath = {}) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        this.iconPath = iconPath;
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: this.contextValue,
            iconPath: this.iconPath
        };
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            const imageNodes = [];
            let node;
            const myTags = yield dockerHub.getRepositoryTags({ namespace: element.repository.namespace, name: element.repository.name });
            for (let i = 0; i < myTags.length; i++) {
                node = new DockerHubImageNode(`${element.repository.name}:${myTags[i].name}`, 'dockerHubImageTag');
                node.password = element.password;
                node.userName = element.userName;
                node.repository = element.repository;
                imageNodes.push(node);
            }
            return imageNodes;
        });
    }
}
exports.DockerHubRepositoryNode = DockerHubRepositoryNode;
class DockerHubImageNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        // this needs to be empty string for DockerHub
        this.serverUrl = '';
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: this.contextValue
        };
    }
}
exports.DockerHubImageNode = DockerHubImageNode;
//# sourceMappingURL=dockerHubNodes.js.map