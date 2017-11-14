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
const rootNode_1 = require("./models/rootNode");
class DockerExplorerProvider {
    constructor(azureAccount) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._azureAccount = azureAccount;
    }
    refresh() {
        this._onDidChangeTreeData.fire(this._imagesNode);
        this._onDidChangeTreeData.fire(this._containersNode);
        this._onDidChangeTreeData.fire(this._registriesNode);
    }
    refreshImages() {
        this._onDidChangeTreeData.fire(this._imagesNode);
    }
    refreshContainers() {
        this._onDidChangeTreeData.fire(this._imagesNode);
    }
    refreshRegistries() {
        this._onDidChangeTreeData.fire(this._registriesNode);
    }
    getTreeItem(element) {
        return element.getTreeItem();
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!element) {
                return this.getRootNodes();
            }
            return element.getChildren(element);
        });
    }
    getRootNodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const rootNodes = [];
            let node;
            node = new rootNode_1.RootNode('Images', 'imagesRootNode', this._onDidChangeTreeData);
            this._imagesNode = node;
            rootNodes.push(node);
            node = new rootNode_1.RootNode('Containers', 'containersRootNode', this._onDidChangeTreeData);
            this._containersNode = node;
            rootNodes.push(node);
            node = new rootNode_1.RootNode('Registries', 'registriesRootNode', this._onDidChangeTreeData, this._azureAccount);
            this._registriesNode = node;
            rootNodes.push(node);
            return rootNodes;
        });
    }
}
exports.DockerExplorerProvider = DockerExplorerProvider;
//# sourceMappingURL=dockerExplorer.js.map