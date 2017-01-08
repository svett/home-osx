// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var errorHelper_1 = require("../error/errorHelper");
var internalErrorCode_1 = require("../error/internalErrorCode");
var log_1 = require("../log/log");
var generalMobilePlatform_1 = require("../generalMobilePlatform");
var Q = require("q");
var ExponentPlatform = (function (_super) {
    __extends(ExponentPlatform, _super);
    function ExponentPlatform(runOptions, _a) {
        var _b = (_a === void 0 ? {} : _a).remoteExtension, remoteExtension = _b === void 0 ? null : _b;
        _super.call(this, runOptions, { remoteExtension: remoteExtension });
        this.exponentTunnelPath = null;
    }
    ExponentPlatform.prototype.runApp = function () {
        var outputMessage = "Application is running on Exponent. Open your exponent app at " + this.exponentTunnelPath + " to see it.";
        log_1.Log.logMessage(outputMessage);
        this.remoteExtension.showInformationMessage(outputMessage);
        return Q.resolve(void 0);
    };
    ExponentPlatform.prototype.enableJSDebuggingMode = function () {
        log_1.Log.logMessage("Application is running on Exponent. Please shake device and select 'Debug JS Remotely' to enable debugging.");
        return Q.resolve(void 0);
    };
    ExponentPlatform.prototype.startPackager = function () {
        var _this = this;
        log_1.Log.logMessage("Starting Exponent Packager.");
        return this.remoteExtension.startExponentPackager()
            .then(function (exponentUrl) {
            if (!exponentUrl) {
                return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ExpectedExponentTunnelPath, "No link provided by exponent. Is your project correctly setup?"));
            }
            _this.exponentTunnelPath = exponentUrl;
        });
    };
    return ExponentPlatform;
}(generalMobilePlatform_1.GeneralMobilePlatform));
exports.ExponentPlatform = ExponentPlatform;

//# sourceMappingURL=exponentPlatform.js.map
