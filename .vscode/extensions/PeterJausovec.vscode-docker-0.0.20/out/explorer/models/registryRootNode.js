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
const azureRegistryNodes_1 = require("./azureRegistryNodes");
const dockerHubNodes_1 = require("./dockerHubNodes");
const nodeBase_1 = require("./nodeBase");
const registryType_1 = require("./registryType");
const ContainerRegistryManagement = require('azure-arm-containerregistry');
class RegistryRootNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, eventEmitter, azureAccount) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        this.eventEmitter = eventEmitter;
        this.azureAccount = azureAccount;
        try {
            this._keytar = require(`${vscode.env.appRoot}/node_modules/keytar`);
        }
        catch (e) {
            // unable to find keytar
        }
        this._azureAccount = azureAccount;
        if (this._azureAccount && this.eventEmitter && this.contextValue === 'azureRegistryRootNode') {
            this._azureAccount.onFiltersChanged((e) => {
                this.eventEmitter.fire(this);
            });
            this._azureAccount.onStatusChanged((e) => {
                this.eventEmitter.fire(this);
            });
            this._azureAccount.onSessionsChanged((e) => {
                this.eventEmitter.fire(this);
            });
        }
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: this.contextValue,
        };
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (element.contextValue === 'azureRegistryRootNode') {
                return this.getAzureRegistries();
            }
            else if (element.contextValue === 'dockerHubRootNode') {
                return this.getDockerHubOrgs();
            }
            else {
                return [];
            }
        });
    }
    getDockerHubOrgs() {
        return __awaiter(this, void 0, void 0, function* () {
            const orgNodes = [];
            let id = { username: null, password: null, token: null };
            if (this._keytar) {
                id.token = yield this._keytar.getPassword('vscode-docker', 'dockerhub.token');
                id.username = yield this._keytar.getPassword('vscode-docker', 'dockerhub.username');
                id.password = yield this._keytar.getPassword('vscode-docker', 'dockerhub.password');
            }
            if (!id.token) {
                id = yield dockerHub.dockerHubLogin();
                if (id && id.token) {
                    if (this._keytar) {
                        this._keytar.setPassword('vscode-docker', 'dockerhub.token', id.token);
                        this._keytar.setPassword('vscode-docker', 'dockerhub.password', id.password);
                        this._keytar.setPassword('vscode-docker', 'dockerhub.username', id.username);
                    }
                }
                else {
                    return orgNodes;
                }
            }
            else {
                dockerHub.setDockerHubToken(id.token);
            }
            const user = yield dockerHub.getUser();
            const myRepos = yield dockerHub.getRepositories(user.username);
            const namespaces = [...new Set(myRepos.map(item => item.namespace))];
            namespaces.forEach((namespace) => {
                let iconPath = {
                    light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'Registry_16x.svg'),
                    dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'Registry_16x.svg')
                };
                let node = new dockerHubNodes_1.DockerHubOrgNode(`${namespace}`, 'dockerHubNamespace', iconPath);
                node.userName = id.username;
                node.password = id.password;
                node.token = id.token;
                orgNodes.push(node);
            });
            return orgNodes;
        });
    }
    getAzureRegistries() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._azureAccount) {
                return [];
            }
            const loggedIntoAzure = yield this._azureAccount.waitForLogin();
            const azureRegistryNodes = [];
            if (this._azureAccount.status === 'Initializing' || this._azureAccount.status === 'LoggingIn') {
                return [new azureRegistryNodes_1.AzureLoadingNode()];
            }
            if (this._azureAccount.status === 'LoggedOut') {
                return [new azureRegistryNodes_1.AzureNotSignedInNode()];
            }
            if (loggedIntoAzure) {
                const subs = this.getFilteredSubscriptions();
                for (let i = 0; i < subs.length; i++) {
                    const client = new ContainerRegistryManagement(this.getCredentialByTenantId(subs[i].tenantId), subs[i].subscriptionId);
                    const registries = yield client.registries.list();
                    for (let j = 0; j < registries.length; j++) {
                        if (registries[j].adminUserEnabled && registries[j].sku.tier.includes('Managed')) {
                            const resourceGroup = registries[j].id.slice(registries[j].id.search('resourceGroups/') + 'resourceGroups/'.length, registries[j].id.search('/providers/'));
                            const creds = yield client.registries.listCredentials(resourceGroup, registries[j].name);
                            let iconPath = {
                                light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'Registry_16x.svg'),
                                dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'Registry_16x.svg')
                            };
                            let node = new azureRegistryNodes_1.AzureRegistryNode(registries[j].loginServer, 'registry', iconPath, this._azureAccount);
                            node.type = registryType_1.RegistryType.Azure;
                            node.password = creds.passwords[0].value;
                            node.userName = creds.username;
                            node.subscription = subs[i];
                            azureRegistryNodes.push(node);
                        }
                    }
                }
            }
            return azureRegistryNodes;
        });
    }
    getCredentialByTenantId(tenantId) {
        const session = this._azureAccount.sessions.find((s, i, array) => s.tenantId.toLowerCase() === tenantId.toLowerCase());
        if (session) {
            return session.credentials;
        }
        throw new Error(`Failed to get credentials, tenant ${tenantId} not found.`);
    }
    getFilteredSubscriptions() {
        if (this._azureAccount) {
            return this._azureAccount.filters.map(filter => {
                return {
                    id: filter.subscription.id,
                    session: filter.session,
                    subscriptionId: filter.subscription.subscriptionId,
                    tenantId: filter.session.tenantId,
                    displayName: filter.subscription.displayName,
                    state: filter.subscription.state,
                    subscriptionPolicies: filter.subscription.subscriptionPolicies,
                    authorizationSource: filter.subscription.authorizationSource
                };
            });
        }
        else {
            return [];
        }
    }
}
exports.RegistryRootNode = RegistryRootNode;
//# sourceMappingURL=registryRootNode.js.map