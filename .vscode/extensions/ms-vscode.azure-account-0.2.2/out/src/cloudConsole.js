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
const cloudConsoleLauncher_1 = require("./cloudConsoleLauncher");
const nls = require("vscode-nls");
const path = require("path");
const opn = require("opn");
const cp = require("child_process");
const semver = require("semver");
const localize = nls.loadMessageBundle();
exports.OSes = {
    Linux: {
        id: 'linux',
        shellName: localize('azure-account.bash', "Bash"),
        get otherOS() { return exports.OSes.Windows; },
    },
    Windows: {
        id: 'windows',
        shellName: localize('azure-account.powershell', "PowerShell"),
        get otherOS() { return exports.OSes.Linux; },
    }
};
function openCloudConsole(api, reporter, os) {
    return () => {
        return (function retry() {
            return __awaiter(this, void 0, void 0, function* () {
                const isWindows = process.platform === 'win32';
                if (isWindows) {
                    // See below
                    try {
                        const { stdout } = yield exec('node.exe --version');
                        const version = stdout[0] === 'v' && stdout.substr(1).trim();
                        if (version && semver.valid(version) && !semver.gte(version, '6.0.0')) {
                            return requiresNode(reporter);
                        }
                    }
                    catch (err) {
                        return requiresNode(reporter);
                    }
                }
                if (!(yield api.waitForLogin())) {
                    reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'requiresLogin' });
                    return vscode_1.commands.executeCommand('azure-account.askForLogin');
                }
                const tokens = yield Promise.all(api.sessions.map(session => acquireToken(session)));
                const result = yield findUserSettings(tokens);
                if (!result) {
                    return requiresSetUp(reporter);
                }
                let consoleUri;
                const armEndpoint = result.token.session.environment.resourceManagerEndpointUrl;
                const inProgress = delayed(() => vscode_1.window.showInformationMessage(localize('azure-account.provisioningInProgress', "Provisioning {0} in Cloud Shell may take a few seconds.", os.shellName)), 2000);
                try {
                    consoleUri = yield cloudConsoleLauncher_1.provisionConsole(result.token.accessToken, armEndpoint, result.userSettings, os.id);
                    inProgress.cancel();
                }
                catch (err) {
                    inProgress.cancel();
                    if (err && err.message === cloudConsoleLauncher_1.Errors.DeploymentOsTypeConflict) {
                        return deploymentConflict(reporter, retry, os, result.token.accessToken, armEndpoint);
                    }
                    throw err;
                }
                // TODO: How to update the access token when it expires?
                let shellPath = path.join(__dirname, `../../bin/node.${isWindows ? 'bat' : 'sh'}`);
                let modulePath = path.join(__dirname, 'cloudConsoleLauncher');
                if (isWindows) {
                    modulePath = modulePath.replace(/\\/g, '\\\\');
                }
                const shellArgs = [
                    process.argv0,
                    '-e',
                    `require('${modulePath}').main()`,
                ];
                if (isWindows) {
                    // Work around https://github.com/electron/electron/issues/4218 https://github.com/nodejs/node/issues/11656
                    shellPath = 'node.exe';
                    shellArgs.shift();
                }
                vscode_1.window.createTerminal({
                    name: localize('azure-account.cloudConsole', "{0} in Cloud Shell", os.shellName),
                    shellPath,
                    shellArgs,
                    env: {
                        CLOUD_CONSOLE_ACCESS_TOKEN: result.token.accessToken,
                        CLOUD_CONSOLE_URI: consoleUri
                    }
                }).show();
                reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'provisioned' });
            });
        })().catch(err => {
            reporter.sendTelemetryEvent('openCloudConsole', {
                outcome: 'error',
                message: String(err && err.message || err)
            });
            throw err;
        });
    };
}
exports.openCloudConsole = openCloudConsole;
function findUserSettings(tokens) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const token of tokens) {
            const userSettings = yield cloudConsoleLauncher_1.getUserSettings(token.accessToken, token.session.environment.resourceManagerEndpointUrl);
            if (userSettings && userSettings.storageProfile) {
                return { userSettings, token };
            }
        }
    });
}
function requiresSetUp(reporter) {
    return __awaiter(this, void 0, void 0, function* () {
        reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'requiresSetUp' });
        const open = { title: localize('azure-account.open', "Open") };
        const close = { title: localize('azure-account.close', "Close"), isCloseAffordance: true };
        const message = localize('azure-account.setUpInPortal', "First launch of Cloud Shell requires setup in the Azure portal (https://portal.azure.com).");
        const response = yield vscode_1.window.showInformationMessage(message, open, close);
        if (response === open) {
            reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'requiresSetUpOpen' });
            opn('https://portal.azure.com');
        }
        else {
            reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'requiresSetUpCancel' });
        }
    });
}
function requiresNode(reporter) {
    return __awaiter(this, void 0, void 0, function* () {
        reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'requiresNode' });
        const open = { title: localize('azure-account.open', "Open") };
        const close = { title: localize('azure-account.close', "Close"), isCloseAffordance: true };
        const message = localize('azure-account.requiresNode', "Opening a Cloud Shell currently requires Node.js 6 or later being installed (https://nodejs.org).");
        const response = yield vscode_1.window.showInformationMessage(message, open, close);
        if (response === open) {
            reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'requiresNodeOpen' });
            opn('https://nodejs.org');
        }
        else {
            reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'requiresNodeCancel' });
        }
    });
}
function deploymentConflict(reporter, retry, os, accessToken, armEndpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'deploymentConflict' });
        const ok = { title: localize('azure-account.ok', "OK") };
        const cancel = { title: localize('azure-account.cancel', "Cancel"), isCloseAffordance: true };
        const message = localize('azure-account.deploymentConflict', "Starting a {0} session will terminate all active {1} sessions. Any running processes in active {1} sessions will be terminated.", os.shellName, os.otherOS.shellName);
        const response = yield vscode_1.window.showWarningMessage(message, ok, cancel);
        if (response === ok) {
            reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'deploymentConflictReset' });
            yield cloudConsoleLauncher_1.resetConsole(accessToken, armEndpoint);
            return retry();
        }
        reporter.sendTelemetryEvent('openCloudConsole', { outcome: 'deploymentConflictCancel' });
    });
}
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
                        session,
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken
                    });
                }
            });
        });
    });
}
function delayed(fun, delay) {
    const handle = setTimeout(fun, delay);
    return {
        cancel: () => clearTimeout(handle)
    };
}
function exec(command) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            cp.exec(command, (error, stdout, stderr) => {
                (error || stderr ? reject : resolve)({ error, stdout, stderr });
            });
        });
    });
}
//# sourceMappingURL=cloudConsole.js.map