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
const request = require("request-promise");
const nodeBase_1 = require("./nodeBase");
class AzureRegistryNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, iconPath = {}, azureAccount) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        this.iconPath = iconPath;
        this.azureAccount = azureAccount;
        this._azureAccount = azureAccount;
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
            const tenantId = element.subscription.tenantId;
            if (!this._azureAccount) {
                return [];
            }
            const session = this._azureAccount.sessions.find((s, i, array) => s.tenantId.toLowerCase() === tenantId.toLowerCase());
            const { accessToken, refreshToken } = yield acquireToken(session);
            if (accessToken && refreshToken) {
                let refreshTokenARC;
                let accessTokenARC;
                yield request.post('https://' + element.label + '/oauth2/exchange', {
                    form: {
                        grant_type: 'access_token_refresh_token',
                        service: element.label,
                        tenant: tenantId,
                        refresh_token: refreshToken,
                        access_token: accessToken
                    }
                }, (err, httpResponse, body) => {
                    if (body.length > 0) {
                        refreshTokenARC = JSON.parse(body).refresh_token;
                    }
                    else {
                        return [];
                    }
                });
                yield request.post('https://' + element.label + '/oauth2/token', {
                    form: {
                        grant_type: 'refresh_token',
                        service: element.label,
                        scope: 'registry:catalog:*',
                        refresh_token: refreshTokenARC
                    }
                }, (err, httpResponse, body) => {
                    if (body.length > 0) {
                        accessTokenARC = JSON.parse(body).access_token;
                    }
                    else {
                        return [];
                    }
                });
                yield request.get('https://' + element.label + '/v2/_catalog', {
                    auth: {
                        bearer: accessTokenARC
                    }
                }, (err, httpResponse, body) => {
                    if (body.length > 0) {
                        const repositories = JSON.parse(body).repositories;
                        for (let i = 0; i < repositories.length; i++) {
                            node = new AzureRepositoryNode(repositories[i], "azureRepository");
                            node.repository = element.label;
                            node.subscription = element.subscription;
                            node.accessTokenARC = accessTokenARC;
                            node.refreshTokenARC = refreshTokenARC;
                            node.userName = element.userName;
                            node.password = element.password;
                            repoNodes.push(node);
                        }
                    }
                });
            }
            return repoNodes;
        });
    }
}
exports.AzureRegistryNode = AzureRegistryNode;
class AzureRepositoryNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, iconPath = {
            light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'Repository_16x.svg'),
            dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'Repository_16x.svg')
        }) {
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
            const { accessToken, refreshToken } = yield acquireToken(element.subscription.session);
            if (accessToken && refreshToken) {
                const tenantId = element.subscription.tenantId;
                let refreshTokenARC;
                let accessTokenARC;
                yield request.post('https://' + element.repository + '/oauth2/exchange', {
                    form: {
                        grant_type: 'access_token_refresh_token',
                        service: element.repository,
                        tenant: tenantId,
                        refresh_token: refreshToken,
                        access_token: accessToken
                    }
                }, (err, httpResponse, body) => {
                    if (body.length > 0) {
                        refreshTokenARC = JSON.parse(body).refresh_token;
                    }
                    else {
                        return [];
                    }
                });
                yield request.post('https://' + element.repository + '/oauth2/token', {
                    form: {
                        grant_type: 'refresh_token',
                        service: element.repository,
                        scope: 'repository:' + element.label + ':pull',
                        refresh_token: refreshTokenARC
                    }
                }, (err, httpResponse, body) => {
                    if (body.length > 0) {
                        accessTokenARC = JSON.parse(body).access_token;
                    }
                    else {
                        return [];
                    }
                });
                yield request.get('https://' + element.repository + '/v2/' + element.label + '/tags/list', {
                    auth: {
                        bearer: accessTokenARC
                    }
                }, (err, httpResponse, body) => {
                    if (err) {
                        return [];
                    }
                    if (body.length > 0) {
                        const tags = JSON.parse(body).tags;
                        for (let i = 0; i < tags.length; i++) {
                            node = new AzureImageNode(element.label + ':' + tags[i], 'azureImageTag');
                            node.serverUrl = element.repository;
                            node.userName = element.userName;
                            node.password = element.password;
                            imageNodes.push(node);
                        }
                    }
                });
            }
            return imageNodes;
        });
    }
}
exports.AzureRepositoryNode = AzureRepositoryNode;
class AzureImageNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: this.contextValue
        };
    }
}
exports.AzureImageNode = AzureImageNode;
class AzureNotSignedInNode extends nodeBase_1.NodeBase {
    constructor() {
        super('Sign in to Azure...');
    }
    getTreeItem() {
        return {
            label: this.label,
            command: {
                title: this.label,
                command: 'azure-account.login'
            },
            collapsibleState: vscode.TreeItemCollapsibleState.None
        };
    }
}
exports.AzureNotSignedInNode = AzureNotSignedInNode;
class AzureLoadingNode extends nodeBase_1.NodeBase {
    constructor() {
        super('Loading...');
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None
        };
    }
}
exports.AzureLoadingNode = AzureLoadingNode;
function acquireToken(session) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const credentials = session.credentials;
            const environment = session.environment;
            credentials.context.acquireToken(environment.activeDirectoryResourceId, credentials.username, credentials.clientId, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken
                    });
                }
            });
        });
    });
}
//# sourceMappingURL=azureRegistryNodes.js.map