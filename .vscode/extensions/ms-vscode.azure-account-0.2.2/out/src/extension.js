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
const vscode_1 = require("vscode");
const azure_account_1 = require("./azure-account");
const cloudConsole_1 = require("./cloudConsole");
const telemetry_1 = require("./telemetry");
const opn = require("opn");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const enableLogging = false;
function activate(context) {
    const azureLogin = new azure_account_1.AzureLoginHelper(context);
    if (enableLogging) {
        logDiagnostics(context, azureLogin.api);
    }
    const subscriptions = context.subscriptions;
    const reporter = telemetry_1.createReporter(context);
    subscriptions.push(createStatusBarItem(azureLogin.api));
    subscriptions.push(vscode_1.commands.registerCommand('azure-account.createAccount', createAccount));
    subscriptions.push(vscode_1.commands.registerCommand('azure-account.openCloudConsoleLinux', cloudConsole_1.openCloudConsole(azureLogin.api, reporter, cloudConsole_1.OSes.Linux)));
    subscriptions.push(vscode_1.commands.registerCommand('azure-account.openCloudConsoleWindows', cloudConsole_1.openCloudConsole(azureLogin.api, reporter, cloudConsole_1.OSes.Windows)));
    return Promise.resolve(azureLogin.api); // Return promise to work around weird error in WinJS.
}
exports.activate = activate;
function logDiagnostics(context, api) {
    const subscriptions = context.subscriptions;
    subscriptions.push(api.onStatusChanged(status => {
        console.log(`onStatusChanged: ${status}`);
    }));
    subscriptions.push(api.onSessionsChanged(() => {
        console.log(`onSessionsChanged: ${api.sessions.length} ${api.status}`);
    }));
    (() => __awaiter(this, void 0, void 0, function* () {
        console.log(`waitForLogin: ${yield api.waitForLogin()} ${api.status}`);
    }))().catch(console.error);
    subscriptions.push(api.onSubscriptionsChanged(() => {
        console.log(`onSubscriptionsChanged: ${api.subscriptions.length}`);
    }));
    (() => __awaiter(this, void 0, void 0, function* () {
        console.log(`waitForSubscriptions: ${yield api.waitForSubscriptions()} ${api.subscriptions.length}`);
    }))().catch(console.error);
    subscriptions.push(api.onFiltersChanged(() => {
        console.log(`onFiltersChanged: ${api.filters.length}`);
    }));
    (() => __awaiter(this, void 0, void 0, function* () {
        console.log(`waitForFilters: ${yield api.waitForFilters()} ${api.filters.length}`);
    }))().catch(console.error);
}
function createAccount() {
    opn('https://azure.microsoft.com/en-us/free/?utm_source=campaign&utm_campaign=vscode-azure-account&mktingSource=vscode-azure-account');
}
function createStatusBarItem(api) {
    const statusBarItem = vscode_1.window.createStatusBarItem();
    statusBarItem.command = "azure-account.selectSubscriptions";
    function updateStatusBar() {
        switch (api.status) {
            case 'LoggingIn':
                statusBarItem.text = localize('azure-account.loggingIn', "Azure: Logging in...");
                statusBarItem.show();
                break;
            case 'LoggedIn':
                if (api.sessions.length) {
                    statusBarItem.text = localize('azure-account.loggedIn', "Azure: {0}", api.sessions[0].userId);
                    statusBarItem.show();
                }
                break;
            default:
                statusBarItem.hide();
                break;
        }
    }
    api.onStatusChanged(updateStatusBar);
    api.onSessionsChanged(updateStatusBar);
    updateStatusBar();
    return statusBarItem;
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map