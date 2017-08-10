// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHelper_1 = require("../error/errorHelper");
const internalErrorCode_1 = require("../error/internalErrorCode");
const log_1 = require("../log/log");
const generalMobilePlatform_1 = require("../generalMobilePlatform");
const Q = require("q");
class ExponentPlatform extends generalMobilePlatform_1.GeneralMobilePlatform {
    constructor(runOptions, { remoteExtension = null } = {}) {
        super(runOptions, { remoteExtension: remoteExtension });
        this.exponentTunnelPath = null;
    }
    runApp() {
        const outputMessage = `Application is running on Exponent. Open your exponent app at ${this.exponentTunnelPath} to see it.`;
        log_1.Log.logMessage(outputMessage);
        return Q.resolve(void 0);
    }
    enableJSDebuggingMode() {
        log_1.Log.logMessage("Application is running on Exponent. Please shake device and select 'Debug JS Remotely' to enable debugging.");
        return Q.resolve(void 0);
    }
    startPackager() {
        log_1.Log.logMessage("Starting Exponent Packager.");
        return this.remoteExtension.startExponentPackager()
            .then(exponentUrl => {
            if (!exponentUrl) {
                return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedExponentTunnelPath, "No link provided by exponent. Is your project correctly setup?"));
            }
            this.exponentTunnelPath = exponentUrl;
        });
    }
}
exports.ExponentPlatform = ExponentPlatform;

//# sourceMappingURL=exponentPlatform.js.map
