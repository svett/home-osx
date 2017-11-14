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
const WebSiteManagementClient = require("azure-arm-website");
const vscode = require("vscode");
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
function waitForWebSiteState(webSiteManagementClient, site, state, intervalMs = 5000, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
        const func = (count) => __awaiter(this, void 0, void 0, function* () {
            const currentSite = yield webSiteManagementClient.webApps.get(site.resourceGroup, site.name);
            if (currentSite.state.toLowerCase() === state.toLowerCase()) {
                resolve();
            }
            else {
                count += intervalMs;
                if (count < timeoutMs) {
                    setTimeout(func, intervalMs, count);
                }
                else {
                    reject(new Error(`Timeout waiting for Web Site "${site.name}" state "${state}".`));
                }
            }
        });
        setTimeout(func, intervalMs, intervalMs);
    });
}
exports.waitForWebSiteState = waitForWebSiteState;
function getSignInCommandString() {
    return 'azure-account.login';
}
exports.getSignInCommandString = getSignInCommandString;
function getWebAppPublishCredential(azureAccount, subscription, site) {
    const credentials = azureAccount.getCredentialByTenantId(subscription.tenantId);
    const websiteClient = new WebSiteManagementClient(credentials, subscription.subscriptionId);
    return websiteClient.webApps.listPublishingCredentials(site.resourceGroup, site.name);
}
exports.getWebAppPublishCredential = getWebAppPublishCredential;
// Output channel for the extension
const outputChannel = vscode.window.createOutputChannel("Azure App Service");
function getOutputChannel() {
    return outputChannel;
}
exports.getOutputChannel = getOutputChannel;
//# sourceMappingURL=util.js.map