// import * as vscode from 'vscode';
// import * as fs from 'fs';
// import * as path from 'path';
// import { docker } from '../commands/utils/docker-endpoint';
// import * as dockerHubAPI from 'docker-hub-api';
// import { AzureAccount, AzureSession } from './azure-account.api';
// import * as os from 'os';
// import { dockerHubLogin } from './utils/dockerLogin';
// const azureAccount: AzureAccount = vscode.extensions.getExtension<AzureAccount>('vscode.azure-account')!.exports;
// import { SubscriptionClient, ResourceManagementClient, SubscriptionModels } from 'azure-arm-resource';
// const ContainerRegistryManagement = require('azure-arm-containerregistry');
// import request = require('request-promise');
// export class DockerExplorerProvider implements vscode.TreeDataProvider<DockerNode> {
//     private _onDidChangeTreeData: vscode.EventEmitter<DockerNode | undefined> = new vscode.EventEmitter<DockerNode | undefined>();
//     readonly onDidChangeTreeData: vscode.Event<DockerNode | undefined> = this._onDidChangeTreeData.event;
//     private _imagesNode: DockerNode;
//     private _containersNode: DockerNode;
//     private _registriesNode: DockerNode;
//     private _debounceTimer: NodeJS.Timer;
//     refresh(): void {
//         this.refreshImages()
//         this.refreshContainers()
//         this.refreshRegistries()
//    }
//     refreshImages(): void {
//         this._onDidChangeTreeData.fire(this._imagesNode);
//     }
//     refreshContainers(): void {
//         this._onDidChangeTreeData.fire(this._containersNode);
//     }
//     refreshRegistries(): void {
//         this._onDidChangeTreeData.fire(this._registriesNode);
//     }
//     private setAutoRefresh(): void {
//         // from https://github.com/formulahendry/vscode-docker-explorer/blob/master/src/dockerTreeBase.ts  
//         const configOptions: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('docker');
//         const interval = configOptions.get('explorerRefreshInterval', 1000);
//         if (interval > 0) {
//             clearTimeout(this._debounceTimer);
//             this._debounceTimer = setTimeout(() => {
//                 this.refreshImages();
//                 this.refreshContainers();
//             }, interval);
//         }
//     }
//     private async getSubscriptions(api: AzureAccount): Promise<SubscriptionItem[]> {
//         const subscriptionItems: SubscriptionItem[] = [];
//         for (const session of api.sessions) {
//             const credentials = session.credentials;
//             const subscriptionClient = new SubscriptionClient(credentials);
//             const subscriptions = await this.listAll(subscriptionClient.subscriptions, subscriptionClient.subscriptions.list());
//             subscriptionItems.push(...subscriptions.map(subscription => ({
//                 label: subscription.displayName || '',
//                 description: subscription.subscriptionId || '',
//                 session,
//                 subscription
//             })));
//         }
//         subscriptionItems.sort((a, b) => a.label.localeCompare(b.label));
//         return subscriptionItems;
//     }
//     private async listAll<T>(client: { listNext(nextPageLink: string): Promise<PartialList<T>>; }, first: Promise<PartialList<T>>): Promise<T[]> {
//         const all: T[] = [];
//         for (let list = await first; list.length || list.nextLink; list = list.nextLink ? await client.listNext(list.nextLink) : []) {
//             all.push(...list);
//         }
//         return all;
//     }
//     getTreeItem(element: DockerNode): vscode.TreeItem {
//         return element;
//     }
//     async getChildren(element?: DockerNode): Promise<DockerNode[]> {
//         return this.getDockerNodes(element);
//     }
//     private async getDockerNodes(element?: DockerNode): Promise<DockerNode[]> {
//         let opts = {};
//         let iconPath: any = {};
//         let contextValue: string = "";
//         let node: DockerNode;
//         const nodes: DockerNode[] = [];
//         if (!element) {
//             this._imagesNode = new DockerNode("Images", vscode.TreeItemCollapsibleState.Collapsed, "dockerImagesLabel", null, null);
//             this._containersNode = new DockerNode("Containers", vscode.TreeItemCollapsibleState.Collapsed, "dockerContainersLabel", null, null);
//             this._registriesNode = new DockerNode("Registries", vscode.TreeItemCollapsibleState.Collapsed, "dockerRegistriesLabel", null, null);
//             nodes.push(this._imagesNode);
//             nodes.push(this._containersNode);
//             nodes.push(this._registriesNode);
//         } else {
//             if (element.contextValue === 'dockerImagesLabel') {
//                 const images: Docker.ImageDesc[] = await docker.getImageDescriptors();
//                 if (!images || images.length == 0) {
//                     return [];
//                 } else {
//                     for (let i = 0; i < images.length; i++) {
//                         contextValue = "dockerImage";
//                         if (!images[i].RepoTags) {
//                             let node = new DockerNode("<none>:<none>", vscode.TreeItemCollapsibleState.None, contextValue);
//                             node.imageDesc = images[i];
//                             nodes.push(node);
//                         } else {
//                             for (let j = 0; j < images[i].RepoTags.length; j++) {
//                                 let node = new DockerNode(images[i].RepoTags[j], vscode.TreeItemCollapsibleState.None, contextValue);
//                                 node.imageDesc = images[i];
//                                 nodes.push(node);
//                             }
//                         }
//                     }
//                 }
//             }
//             if (element.contextValue === 'dockerContainersLabel') {
//                 opts = {
//                     "filters": {
//                         "status": ["created", "restarting", "running", "paused", "exited", "dead"]
//                     }
//                 };
//                 const containers: Docker.ContainerDesc[] = await docker.getContainerDescriptors(opts);
//                 if (!containers || containers.length == 0) {
//                     return [];
//                 } else {
//                     for (let i = 0; i < containers.length; i++) {
//                         if (['exited', 'dead'].includes(containers[i].State)) {
//                             contextValue = "dockerContainerStopped";
//                             iconPath = {
//                                 light: path.join(__filename, '..', '..', '..', 'images', 'light', 'mono_moby_small.png'),
//                                 dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'mono_moby_small.png')
//                             };
//                         } else {
//                             contextValue = "dockerContainerRunning";
//                             iconPath = {
//                                 light: path.join(__filename, '..', '..', '..', 'images', 'light', 'moby_small.png'),
//                                 dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'moby_small.png')
//                             };
//                         }
//                         const containerName = containers[i].Names[0].substring(1);
//                         let node = new DockerNode(`${containers[i].Image} (${containerName}) [${containers[i].Status}]`, vscode.TreeItemCollapsibleState.None, contextValue, null, iconPath);
//                         node.containerDesc = containers[i];
//                         nodes.push(node);
//                     }
//                 }
//             }
//             if (element.contextValue === 'dockerRegistriesLabel') {
//                 contextValue = "dockerRegistryLabel";
//                 node = new DockerNode(`Docker Hub`, vscode.TreeItemCollapsibleState.Collapsed, contextValue, null, null);
//                 nodes.push(node);
//                 contextValue = "dockerRegistryLabel";
//                 node = new DockerNode(`Azure`, vscode.TreeItemCollapsibleState.Collapsed, contextValue, null, null);
//                 nodes.push(node);
//             }
//             if (element.contextValue === 'dockerRegistryLabel') {
//                 if (element.label.includes('Docker')) {
//                     // see if we've saved off the token
//                     let token: string = await azureAccount.credentials.readSecret('vscode-docker', 'dockerhub')
//                     if (!token) {
//                         token = await dockerHubLogin();
//                         if (token) {
//                             azureAccount.credentials.writeSecret('vscode-docker', 'dockerhub', token);
//                             dockerHubAPI.setLoginToken(token);
//                         } else {
//                             return [];
//                         }
//                     } else {
//                         dockerHubAPI.setLoginToken(token);
//                     }
//                     const user: any = await dockerHubAPI.loggedInUser();
//                     const myRepos = await dockerHubAPI.repositories(user.username);
//                     for (let i = 0; i < myRepos.length; i++) {
//                         const myRepo = await dockerHubAPI.repository(myRepos[i].namespace, myRepos[i].name);
//                         contextValue = 'dockerHubRegistryImage';
//                         let node = new DockerNode(`${myRepo.namespace}/${myRepo.name}`, vscode.TreeItemCollapsibleState.Collapsed, contextValue, null, null);
//                         node.repository = myRepo;
//                         nodes.push(node);
//                     }
//                 } else if (element.label.includes('Azure')) {
//                     if (azureAccount.status === "LoggedIn") {
//                         //let creds = azureAccount.credentials;
//                         const subs = await this.getSubscriptions(azureAccount);
//                         for (let i = 0; i < subs.length; i++) {
//                             contextValue = 'dockerRegistryAzureSubscription';
//                             node = new DockerNode(subs[i].label, vscode.TreeItemCollapsibleState.Collapsed, contextValue, null, null);
//                             node.subscription = subs[i];
//                             nodes.push(node);
//                         }
//                     }
//                 }
//             }
//             if (element.contextValue === 'dockerHubRegistryImage') {
//                 let myTags = await dockerHubAPI.tags(element.repository.namespace, element.repository.name);
//                 for (let i = 0; i < myTags.length; i++) {
//                     contextValue = 'dockerHubRegistryImageTag';
//                     nodes.push(new DockerNode(`${element.repository.name}:${myTags[i].name}`, vscode.TreeItemCollapsibleState.None, contextValue, null, null));
//                 }
//             }
//             if (element.contextValue === 'dockerRegistryAzureSubscription') {
//                 const client = new ContainerRegistryManagement(element.subscription.session.credentials, element.subscription.subscription.subscriptionId);
//                 const registries = await client.registries.list();
//                 for (let i = 0; i < registries.length; i++) {
//                     contextValue = 'dockerRegistryAzureRegistry';
//                     node = new DockerNode(registries[i].loginServer, vscode.TreeItemCollapsibleState.Collapsed, contextValue, null, null);
//                     node.subscription = element.subscription;
//                     nodes.push(node);
//                 }
//             }
//             if (element.contextValue == 'dockerRegistryAzureRegistry') {
//                 const { accessToken, refreshToken } = await acquireToken(element.subscription.session);
//                 if (accessToken && refreshToken) {
//                     const tenantId = element.subscription.subscription.tenantId;
//                     let refreshTokenARC;
//                     let accessTokenARC;
//                     await request.post('https://' + element.label + '/oauth2/exchange', {
//                         form: {
//                             grant_type: 'access_token_refresh_token',
//                             service: element.label,
//                             tenant: tenantId,
//                             refresh_token: refreshToken,
//                             access_token: accessToken
//                         }
//                     }, (err, httpResponse, body) => {
//                         refreshTokenARC = JSON.parse(body).refresh_token;
//                     });
//                     await request.post('https://' + element.label + '/oauth2/token', {
//                         form: {
//                             grant_type: 'refresh_token',
//                             service: element.label,
//                             scope: 'registry:catalog:*',
//                             refresh_token: refreshTokenARC
//                         }
//                     }, (err, httpResponse, body) => {
//                         accessTokenARC = JSON.parse(body).access_token;
//                     });
//                     await request.get('https://' + element.label + '/v2/_catalog', {
//                         auth: {
//                             bearer: accessTokenARC
//                         }
//                     }, (err, httpResponse, body) => {
//                         if (body) {
//                             const repositories = JSON.parse(body).repositories;
//                             for (let i = 0; i < repositories.length; i++) {
//                                 contextValue = "dockerAzureRegistryImage";
//                                 node = new DockerNode(repositories[i], vscode.TreeItemCollapsibleState.Collapsed, contextValue, null, null);
//                                 node.repository = element.label;
//                                 node.subscription = element.subscription;
//                                 node.accessTokenARC = accessTokenARC;
//                                 node.refreshTokenARC = refreshTokenARC;
//                                 nodes.push(node);
//                             }
//                         }
//                     });
//                 }
//             }
//             // if (element.contextValue === 'dockerAzureRegistryImage') {
//             //     const { accessToken, refreshToken } = await acquireToken(element.subscription.session);
//             //     if (accessToken && refreshToken) {
//             //         const tenantId = element.subscription.subscription.tenantId;
//             //         let refreshTokenARC;
//             //         let accessTokenARC;
//             //         await request.post('https://' + element.repository + '/oauth2/exchange', {
//             //             form: {
//             //                 grant_type: 'access_token_refresh_token',
//             //                 service: element.label,
//             //                 tenant: tenantId,
//             //                 refresh_token: refreshToken,
//             //                 access_token: accessToken
//             //             }
//             //         }, (err, httpResponse, body) => {
//             //             refreshTokenARC = JSON.parse(body).refresh_token;
//             //         });
//             //         await request.post('https://' + element.repository + '/oauth2/token', {
//             //             form: {
//             //                 grant_type: 'refresh_token',
//             //                 service: element.repository,
//             //                 scope: 'registry:tag:*',
//             //                 refresh_token: refreshTokenARC
//             //             }
//             //         }, (err, httpResponse, body) => {
//             //             accessTokenARC = JSON.parse(body).access_token;
//             //         });
//             //         await request.get('https://' + element.repository + '/v2/' + element.label + '/tags/list', {
//             //             auth: {
//             //                 bearer: accessTokenARC
//             //             }
//             //         }, (err, httpResponse, body) => {
//             //             if (body) {
//             //                 const tags = JSON.parse(body).repositories;
//             //                 for (let i = 0; i < tags.length; i++) {
//             //                     contextValue = "dockerAzureRegistryImageTag";
//             //                     node = new DockerNode(tags[i], vscode.TreeItemCollapsibleState.None, contextValue, null, null);
//             //                     node.repository = element.label;
//             //                     nodes.push(node);
//             //                 }
//             //             }
//             //         });
//             //     }
//             // }
//         }
//         this.setAutoRefresh();
//         return nodes;
//     }
// }
// async function acquireToken(session: AzureSession) {
//     return new Promise<{ accessToken: string; refreshToken: string; }>((resolve, reject) => {
//         const credentials: any = session.credentials;
//         const environment: any = session.environment;
//         credentials.context.acquireToken(environment.activeDirectoryResourceId, credentials.username, credentials.clientId, function (err: any, result: any) {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve({
//                     accessToken: result.accessToken,
//                     refreshToken: result.refreshToken
//                 });
//             }
//         });
//     });
// }
// export class DockerNode extends vscode.TreeItem {
//     constructor(public readonly label: string,
//         public readonly collapsibleState: vscode.TreeItemCollapsibleState,
//         public readonly contextValue: string,
//         public readonly command?: vscode.Command,
//         public iconPath: any = {
//             light: path.join(__filename, '..', '..', '..', 'images', 'light', 'mono_moby_small.png'),
//             dark: path.join(__filename, '..', '..', '..', 'images', 'dark', 'mono_moby_small.png')
//         }) {
//         super(label, collapsibleState);
//     }
//     public containerDesc: Docker.ContainerDesc;
//     public imageDesc: Docker.ImageDesc;
//     public repository: any = {};
//     public subscription: SubscriptionItem;
//     public refreshTokenARC: string;
//     public accessTokenARC: string;
// }
// enum RegistryType {
//     Docker,
//     Azure,
//     Unknown
// }
// class Registry {
//     url: string;
//     registryType: RegistryType;
//     userName: string;
//     password: string;
//     token: string;
//     friendlyName: string;
// }
// interface SubscriptionItem {
//     label: string;
//     description: string;
//     session: AzureSession;
//     subscription: SubscriptionModels.Subscription;
// }
// interface PartialList<T> extends Array<T> {
//     nextLink?: string;
// }
//# sourceMappingURL=merge.js.map