// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var log_1 = require("../common/log/log");
var remoteExtension_1 = require("../common/remoteExtension");
var GeneralMobilePlatform = (function () {
    function GeneralMobilePlatform(runOptions, _a) {
        var _b = (_a === void 0 ? {} : _a).remoteExtension, remoteExtension = _b === void 0 ? null : _b;
        this.runOptions = runOptions;
        this.platformName = this.runOptions.platform;
        this.projectPath = this.runOptions.projectRoot;
        this.remoteExtension = (remoteExtension) ? remoteExtension : remoteExtension_1.RemoteExtension.atProjectRootPath(runOptions.projectRoot);
    }
    GeneralMobilePlatform.prototype.runApp = function () {
        log_1.Log.logMessage("Conected to packager. You can now open your app in the simulator.");
        return Q.resolve(void 0);
    };
    GeneralMobilePlatform.prototype.enableJSDebuggingMode = function () {
        log_1.Log.logMessage("Debugger ready. Enable remote debugging in app.");
        return Q.resolve(void 0);
    };
    GeneralMobilePlatform.prototype.startPackager = function () {
        log_1.Log.logMessage("Starting React Native Packager.");
        return this.remoteExtension.startPackager();
    };
    GeneralMobilePlatform.prototype.prewarmBundleCache = function () {
        // generalMobilePlatform should do nothing here. Method should be overriden by children for specific behavior.
        return Q.resolve(void 0);
    };
    return GeneralMobilePlatform;
}());
exports.GeneralMobilePlatform = GeneralMobilePlatform;

//# sourceMappingURL=generalMobilePlatform.js.map
