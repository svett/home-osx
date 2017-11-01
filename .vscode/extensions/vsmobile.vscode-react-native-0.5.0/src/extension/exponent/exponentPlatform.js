"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const errorHelper_1 = require("../../common/error/errorHelper");
const internalErrorCode_1 = require("../../common/error/internalErrorCode");
const generalMobilePlatform_1 = require("../generalMobilePlatform");
const exponentHelper_1 = require("./exponentHelper");
const vscode = require("vscode");
const Q = require("q");
const packager_1 = require("../../common/packager");
const packagerStatusIndicator_1 = require("../packagerStatusIndicator");
class ExponentPlatform extends generalMobilePlatform_1.GeneralMobilePlatform {
    constructor(runOptions, platformDeps = {}) {
        super(runOptions, platformDeps);
        this.exponentHelper = new exponentHelper_1.ExponentHelper(runOptions.workspaceRoot, runOptions.projectRoot);
        this.exponentTunnelPath = null;
    }
    runApp() {
        const outputMessage = `Application is running on Exponent. Open your exponent app at ${this.exponentTunnelPath} to see it.`;
        this.logger.info(outputMessage);
        return Q.resolve(void 0);
    }
    enableJSDebuggingMode() {
        this.logger.info("Application is running on Exponent. Please shake device and select 'Debug JS Remotely' to enable debugging.");
        return Q.resolve(void 0);
    }
    startPackager() {
        this.logger.info("Starting Exponent Packager.");
        return this.packager.isRunning().then((running) => {
            if (running) {
                if (this.packager.getRunningAs() !== packager_1.PackagerRunAs.EXPONENT) {
                    return this.packager.stop().then(() => this.packager.statusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED));
                }
                this.logger.info("Attaching to running Exponent packager");
            }
            return void 0;
        }).then(() => this.exponentHelper.configureExponentEnvironment()).then(() => this.exponentHelper.loginToExponent((message, password) => {
            return Q.Promise((resolve, reject) => {
                vscode.window.showInputBox({ placeHolder: message, password: password })
                    .then(login => {
                    resolve(login || "");
                }, reject);
            });
        }, (message) => {
            return Q.Promise((resolve, reject) => {
                vscode.window.showInformationMessage(message)
                    .then(password => {
                    resolve(password || "");
                }, reject);
            });
        }))
            .then(() => {
            return this.packager.startAsExponent();
        })
            .then(exponentUrl => {
            vscode.commands.executeCommand("vscode.previewHtml", vscode.Uri.parse(exponentUrl), 1, "Expo QR code");
            this.packager.statusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.EXPONENT_PACKAGER_STARTED);
            return exponentUrl;
        })
            .then(exponentUrl => {
            if (!exponentUrl) {
                return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedExponentTunnelPath, "No link provided by exponent. Is your project correctly setup?"));
            }
            this.exponentTunnelPath = exponentUrl;
            return Q.resolve(void 0);
        });
    }
}
exports.ExponentPlatform = ExponentPlatform;

//# sourceMappingURL=exponentPlatform.js.map
