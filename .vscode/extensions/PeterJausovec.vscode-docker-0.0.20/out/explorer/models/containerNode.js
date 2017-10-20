"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nodeBase_1 = require("./nodeBase");
class ContainerNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, iconPath = {}) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        this.iconPath = iconPath;
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: this.contextValue,
            iconPath: this.iconPath
        };
    }
}
exports.ContainerNode = ContainerNode;
//# sourceMappingURL=containerNode.js.map