"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const adal = require('adal-node');
const MemoryCache = adal.MemoryCache;
const AuthenticationContext = adal.AuthenticationContext;
const CacheDriver = require('adal-node/lib/cache-driver');
const createLogContext = require('adal-node/lib/log').createLogContext;
const ms_rest_azure_1 = require("ms-rest-azure");
const azure_arm_resource_1 = require("azure-arm-resource");
const opn = require("opn");
const copypaste = require("copy-paste");
const nls = require("vscode-nls");
const cp = require("child_process");
const vscode_1 = require("vscode");
const localize = nls.loadMessageBundle();
let keytar;
try {
    keytar = require(`${vscode_1.env.appRoot}/node_modules/keytar`);
}
catch (e) {
    // Not available.
}
const logVerbose = false;
const defaultEnvironment = ms_rest_azure_1.AzureEnvironment.Azure;
const commonTenantId = 'common';
const authorityHostUrl = defaultEnvironment.activeDirectoryEndpointUrl; // Testing: 'https://login.windows-ppe.net/'
const clientId = 'aebc6443-996d-45c2-90f0-388ff96faa56'; // VSC: 'aebc6443-996d-45c2-90f0-388ff96faa56'
const validateAuthority = true;
const authorityUrl = `${authorityHostUrl}${commonTenantId}`;
const resource = defaultEnvironment.activeDirectoryResourceId;
const credentialsService = 'VSCode Public Azure';
const credentialsAccount = 'Refresh Token';
class AzureLoginError extends Error {
    constructor(message, _reason) {
        super(message);
        this._reason = _reason;
    }
}
class AzureLoginHelper {
    constructor(context) {
        this.onStatusChanged = new vscode_1.EventEmitter();
        this.onSessionsChanged = new vscode_1.EventEmitter();
        this.subscriptions = Promise.resolve([]);
        this.onSubscriptionsChanged = new vscode_1.EventEmitter();
        this.filters = Promise.resolve([]);
        this.onFiltersChanged = new vscode_1.EventEmitter();
        this.tokenCache = new MemoryCache();
        this.api = {
            status: 'Initializing',
            onStatusChanged: this.onStatusChanged.event,
            waitForLogin: () => this.waitForLogin(),
            sessions: [],
            onSessionsChanged: this.onSessionsChanged.event,
            subscriptions: [],
            onSubscriptionsChanged: this.onSubscriptionsChanged.event,
            waitForSubscriptions: () => this.waitForSubscriptions(),
            filters: [],
            onFiltersChanged: this.onFiltersChanged.event,
            waitForFilters: () => this.waitForFilters(),
        };
        const subscriptions = context.subscriptions;
        subscriptions.push(vscode_1.commands.registerCommand('azure-account.login', () => this.login().catch(console.error)));
        subscriptions.push(vscode_1.commands.registerCommand('azure-account.logout', () => this.logout().catch(console.error)));
        subscriptions.push(vscode_1.commands.registerCommand('azure-account.askForLogin', () => this.askForLogin().catch(console.error)));
        subscriptions.push(vscode_1.commands.registerCommand('azure-account.selectSubscriptions', () => this.selectSubscriptions().catch(console.error)));
        subscriptions.push(this.api.onSessionsChanged(() => this.updateSubscriptions().catch(console.error)));
        subscriptions.push(this.api.onSubscriptionsChanged(() => this.updateFilters().catch(console.error)));
        subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(() => this.updateFilters(true).catch(console.error)));
        this.initialize()
            .catch(console.error);
        if (logVerbose) {
            const outputChannel = vscode_1.window.createOutputChannel('Azure Account');
            subscriptions.push(outputChannel);
            this.enableLogging(outputChannel);
        }
    }
    enableLogging(channel) {
        const log = adal.Logging;
        log.setLoggingOptions({
            level: log.LOGGING_LEVEL.VERBOSE,
            log: (level, message, error) => {
                if (message) {
                    channel.appendLine(message);
                }
                if (error) {
                    channel.appendLine(error);
                }
            }
        });
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.beginLoggingIn();
                const deviceLogin = yield deviceLogin1();
                const message = this.showDeviceCodeMessage(deviceLogin);
                const login2 = deviceLogin2(deviceLogin);
                const tokenResponse = yield Promise.race([login2, message.then(() => login2)]);
                const refreshToken = tokenResponse.refreshToken;
                const tokenResponses = yield tokensFromToken(tokenResponse);
                if (keytar) {
                    yield keytar.setPassword(credentialsService, credentialsAccount, refreshToken);
                }
                yield this.updateSessions(tokenResponses);
            }
            finally {
                this.updateStatus();
            }
        });
    }
    showDeviceCodeMessage(deviceLogin) {
        return __awaiter(this, void 0, void 0, function* () {
            const copyAndOpen = { title: localize('azure-account.copyAndOpen', "Copy & Open") };
            const open = { title: localize('azure-account.open', "Open") };
            const close = { title: localize('azure-account.close', "Close"), isCloseAffordance: true };
            const canCopy = process.platform !== 'linux' || (yield exitCode('xclip', '-version')) === 0;
            const response = yield vscode_1.window.showInformationMessage(deviceLogin.message, canCopy ? copyAndOpen : open, close);
            if (response === copyAndOpen) {
                copypaste.copy(deviceLogin.userCode);
                opn(deviceLogin.verificationUrl);
            }
            else if (response === open) {
                opn(deviceLogin.verificationUrl);
                yield this.showDeviceCodeMessage(deviceLogin);
            }
            else if (response === close) {
                return Promise.reject(null);
            }
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.waitForLogin();
            if (keytar) {
                yield keytar.deletePassword(credentialsService, credentialsAccount);
            }
            yield this.updateSessions([]);
            this.updateStatus();
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const refreshToken = keytar && (yield keytar.getPassword(credentialsService, credentialsAccount));
                if (refreshToken) {
                    this.beginLoggingIn();
                    const tokenResponse = yield tokenFromRefreshToken(refreshToken);
                    const tokenResponses = yield tokensFromToken(tokenResponse);
                    yield this.updateSessions(tokenResponses);
                }
            }
            catch (err) {
                if (!(err instanceof AzureLoginError)) {
                    throw err;
                }
            }
            finally {
                this.updateStatus();
            }
        });
    }
    beginLoggingIn() {
        if (this.api.status !== 'LoggedIn') {
            this.api.status = 'LoggingIn';
            this.onStatusChanged.fire(this.api.status);
        }
    }
    updateStatus() {
        const status = this.api.sessions.length ? 'LoggedIn' : 'LoggedOut';
        if (this.api.status !== status) {
            this.api.status = status;
            this.onStatusChanged.fire(this.api.status);
        }
    }
    updateSessions(tokenResponses) {
        return __awaiter(this, void 0, void 0, function* () {
            yield clearTokenCache(this.tokenCache);
            for (const tokenResponse of tokenResponses) {
                yield addTokenToCache(this.tokenCache, tokenResponse);
            }
            const sessions = this.api.sessions;
            sessions.splice(0, sessions.length, ...tokenResponses.map(tokenResponse => ({
                environment: defaultEnvironment,
                userId: tokenResponse.userId,
                tenantId: tokenResponse.tenantId,
                credentials: new ms_rest_azure_1.DeviceTokenCredentials({ username: tokenResponse.userId, clientId, tokenCache: this.tokenCache, domain: tokenResponse.tenantId })
            })));
            this.onSessionsChanged.fire();
        });
    }
    waitForSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.api.waitForLogin())) {
                return false;
            }
            yield this.subscriptions;
            return true;
        });
    }
    updateSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.waitForLogin();
            this.subscriptions = this.loadSubscriptions();
            this.api.subscriptions.splice(0, this.api.subscriptions.length, ...yield this.subscriptions);
            this.onSubscriptionsChanged.fire();
        });
    }
    askForLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.api.status === 'LoggedIn') {
                return;
            }
            const login = { title: localize('azure-account.login', "Sign In") };
            const cancel = { title: 'Cancel', isCloseAffordance: true };
            const result = yield vscode_1.window.showInformationMessage(localize('azure-account.loginFirst', "Not signed in, sign in first."), login, cancel);
            return result === login && vscode_1.commands.executeCommand('azure-account.login');
        });
    }
    selectSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.waitForSubscriptions())) {
                return vscode_1.commands.executeCommand('azure-account.askForLogin');
            }
            const azureConfig = vscode_1.workspace.getConfiguration('azure');
            const resourceFilter = (azureConfig.get('resourceFilter') || ['all']).slice();
            let changed = false;
            const subscriptions = this.subscriptions
                .then(list => this.asSubscriptionItems(list, resourceFilter));
            const items = subscriptions.then(list => {
                if (!list.length) {
                    return [
                        {
                            type: 'noSubscriptions',
                            label: localize('azure-account.noSubscriptionsSignUpFree', "No subscriptions found, select to sign up for a free account."),
                            description: '',
                        }
                    ];
                }
                return [
                    {
                        type: 'selectAll',
                        get label() {
                            const selected = resourceFilter[0] === 'all' || !list.find(item => {
                                const { session, subscription } = item.subscription;
                                return resourceFilter.indexOf(`${session.tenantId}/${subscription.subscriptionId}`) === -1;
                            });
                            return `${getCheckmark(selected)} Select All`;
                        },
                        description: '',
                    },
                    {
                        type: 'deselectAll',
                        get label() {
                            return `${getCheckmark(!resourceFilter.length)} Deselect All`;
                        },
                        description: '',
                    },
                    ...list
                ];
            });
            for (let pick = yield vscode_1.window.showQuickPick(items); pick; pick = yield vscode_1.window.showQuickPick(items)) {
                if (pick.type === 'noSubscriptions') {
                    vscode_1.commands.executeCommand('azure-account.createAccount');
                    break;
                }
                changed = true;
                switch (pick.type) {
                    case 'selectAll':
                        if (resourceFilter[0] !== 'all') {
                            for (const subscription of yield subscriptions) {
                                if (subscription.selected) {
                                    this.removeFilter(resourceFilter, subscription);
                                }
                            }
                            resourceFilter.push('all');
                        }
                        break;
                    case 'deselectAll':
                        if (resourceFilter[0] === 'all') {
                            resourceFilter.splice(0, 1);
                        }
                        else {
                            for (const subscription of yield subscriptions) {
                                if (subscription.selected) {
                                    this.removeFilter(resourceFilter, subscription);
                                }
                            }
                        }
                        break;
                    case 'item':
                        if (resourceFilter[0] === 'all') {
                            resourceFilter.splice(0, 1);
                            for (const subscription of yield subscriptions) {
                                this.addFilter(resourceFilter, subscription);
                            }
                        }
                        if (pick.selected) {
                            this.removeFilter(resourceFilter, pick);
                        }
                        else {
                            this.addFilter(resourceFilter, pick);
                        }
                        break;
                }
            }
            if (changed) {
                yield this.updateConfiguration(azureConfig, resourceFilter);
            }
        });
    }
    addFilter(resourceFilter, item) {
        const { session, subscription } = item.subscription;
        resourceFilter.push(`${session.tenantId}/${subscription.subscriptionId}`);
        item.selected = true;
    }
    removeFilter(resourceFilter, item) {
        const { session, subscription } = item.subscription;
        const remove = resourceFilter.indexOf(`${session.tenantId}/${subscription.subscriptionId}`);
        resourceFilter.splice(remove, 1);
        item.selected = false;
    }
    loadSubscriptions() {
        return __awaiter(this, void 0, void 0, function* () {
            const subscriptions = [];
            for (const session of this.api.sessions) {
                const credentials = session.credentials;
                const client = new azure_arm_resource_1.SubscriptionClient(credentials);
                const list = yield listAll(client.subscriptions, client.subscriptions.list());
                const items = list.map(subscription => ({
                    session,
                    subscription,
                }));
                subscriptions.push(...items);
            }
            subscriptions.sort((a, b) => a.subscription.displayName.localeCompare(b.subscription.displayName));
            return subscriptions;
        });
    }
    asSubscriptionItems(subscriptions, resourceFilter) {
        return subscriptions.map(subscription => {
            const selected = resourceFilter.indexOf(`${subscription.session.tenantId}/${subscription.subscription.subscriptionId}`) !== -1;
            return {
                type: 'item',
                get label() {
                    let selected = this.selected;
                    if (!selected) {
                        selected = resourceFilter[0] === 'all';
                    }
                    return `${getCheckmark(selected)} ${this.subscription.subscription.displayName}`;
                },
                description: subscription.subscription.subscriptionId,
                subscription,
                selected,
            };
        });
    }
    updateConfiguration(azureConfig, resourceFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const resourceFilterConfig = azureConfig.inspect('resourceFilter');
            let target = vscode_1.ConfigurationTarget.Global;
            if (resourceFilterConfig) {
                if (resourceFilterConfig.workspaceFolderValue) {
                    target = vscode_1.ConfigurationTarget.WorkspaceFolder;
                }
                else if (resourceFilterConfig.workspaceValue) {
                    target = vscode_1.ConfigurationTarget.Workspace;
                }
                else if (resourceFilterConfig.globalValue) {
                    target = vscode_1.ConfigurationTarget.Global;
                }
            }
            yield azureConfig.update('resourceFilter', resourceFilter[0] !== 'all' ? resourceFilter : undefined, target);
        });
    }
    updateFilters(configChange = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const azureConfig = vscode_1.workspace.getConfiguration('azure');
            let resourceFilter = azureConfig.get('resourceFilter');
            if (configChange && JSON.stringify(resourceFilter) === this.oldResourceFilter) {
                return;
            }
            this.filters = (() => __awaiter(this, void 0, void 0, function* () {
                yield this.waitForSubscriptions();
                this.oldResourceFilter = JSON.stringify(resourceFilter);
                if (resourceFilter && !Array.isArray(resourceFilter)) {
                    resourceFilter = [];
                }
                const filters = resourceFilter && resourceFilter.reduce((f, s) => {
                    if (typeof s === 'string') {
                        f[s] = true;
                    }
                    return f;
                }, {});
                const subscriptions = yield this.subscriptions;
                const newFilters = filters ? subscriptions.filter(s => filters[`${s.session.tenantId}/${s.subscription.subscriptionId}`]) : subscriptions;
                this.api.filters.splice(0, this.api.filters.length, ...newFilters);
                this.onFiltersChanged.fire();
                return this.api.filters;
            }))();
        });
    }
    waitForLogin() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.api.status) {
                case 'LoggedIn':
                    return true;
                case 'LoggedOut':
                    return false;
                case 'Initializing':
                case 'LoggingIn':
                    return new Promise(resolve => {
                        const subscription = this.api.onStatusChanged(() => {
                            subscription.dispose();
                            resolve(this.waitForLogin());
                        });
                    });
                default:
                    const status = this.api.status;
                    throw new Error(`Unexpected status '${status}'`);
            }
        });
    }
    waitForFilters() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.waitForSubscriptions())) {
                return false;
            }
            yield this.filters;
            return true;
        });
    }
}
exports.AzureLoginHelper = AzureLoginHelper;
function deviceLogin1() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const cache = new MemoryCache();
            const context = new AuthenticationContext(authorityUrl, validateAuthority, cache);
            context.acquireUserCode(resource, clientId, 'en-us', function (err, response) {
                if (err) {
                    reject(new AzureLoginError(localize('azure-account.userCodeFailed', "Acquiring user code failed"), err));
                }
                else {
                    resolve(response);
                }
            });
        });
    });
}
function deviceLogin2(deviceLogin) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const tokenCache = new MemoryCache();
            const context = new AuthenticationContext(authorityUrl, validateAuthority, tokenCache);
            context.acquireTokenWithDeviceCode(resource, clientId, deviceLogin, function (err, tokenResponse) {
                if (err) {
                    reject(new AzureLoginError(localize('azure-account.tokenFailed', "Acquiring token with device code failed"), err));
                }
                else {
                    resolve(tokenResponse);
                }
            });
        });
    });
}
function tokenFromRefreshToken(refreshToken, tenantId = commonTenantId) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const tokenCache = new MemoryCache();
            const context = new AuthenticationContext(`${authorityHostUrl}${tenantId}`, validateAuthority, tokenCache);
            context.acquireTokenWithRefreshToken(refreshToken, clientId, null, function (err, tokenResponse) {
                if (err) {
                    reject(new AzureLoginError(localize('azure-account.tokenFromRefreshTokenFailed', "Acquiring token with refresh token failed"), err));
                }
                else {
                    resolve(tokenResponse);
                }
            });
        });
    });
}
function tokensFromToken(firstTokenResponse) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenResponses = [firstTokenResponse];
        const tokenCache = new MemoryCache();
        yield addTokenToCache(tokenCache, firstTokenResponse);
        const credentials = new ms_rest_azure_1.DeviceTokenCredentials({ username: firstTokenResponse.userId, clientId, tokenCache });
        const client = new azure_arm_resource_1.SubscriptionClient(credentials);
        const tenants = yield listAll(client.tenants, client.tenants.list());
        for (const tenant of tenants) {
            if (tenant.tenantId !== firstTokenResponse.tenantId) {
                const tokenResponse = yield tokenFromRefreshToken(firstTokenResponse.refreshToken, tenant.tenantId);
                tokenResponses.push(tokenResponse);
            }
        }
        return tokenResponses;
    });
}
function addTokenToCache(tokenCache, tokenResponse) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const driver = new CacheDriver({ _logContext: createLogContext('') }, `${authorityHostUrl}${tokenResponse.tenantId}`, tokenResponse.resource, clientId, tokenCache, (entry, resource, callback) => {
                callback(null, entry);
            });
            driver.add(tokenResponse, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
function clearTokenCache(tokenCache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            tokenCache.find({}, (err, entries) => {
                if (err) {
                    reject(err);
                }
                else {
                    tokenCache.remove(entries, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                }
            });
        });
    });
}
function listAll(client, first) {
    return __awaiter(this, void 0, void 0, function* () {
        const all = [];
        for (let list = yield first; list.length || list.nextLink; list = list.nextLink ? yield client.listNext(list.nextLink) : []) {
            all.push(...list);
        }
        return all;
    });
}
exports.listAll = listAll;
function getCheckmark(selected) {
    // Check box: '\u2611' : '\u2610'
    // Check mark: '\u2713' : '\u2003'
    // Check square: '\u25A3' : '\u25A1'
    return selected ? '\u2713' : '\u2003';
}
function exitCode(command, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            cp.spawn(command, args)
                .on('error', err => resolve())
                .on('exit', code => resolve(code));
        });
    });
}
//# sourceMappingURL=azure-account.js.map