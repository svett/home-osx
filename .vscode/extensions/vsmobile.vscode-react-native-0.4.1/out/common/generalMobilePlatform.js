// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const log_1 = require("../common/log/log");
const remoteExtension_1 = require("../common/remoteExtension");
class GeneralMobilePlatform {
    constructor(runOptions, { remoteExtension = null } = {}) {
        this.runOptions = runOptions;
        this.platformName = this.runOptions.platform;
        this.projectPath = this.runOptions.projectRoot;
        this.remoteExtension = (remoteExtension) ? remoteExtension : remoteExtension_1.RemoteExtension.atProjectRootPath(runOptions.projectRoot);
    }
    runApp() {
        log_1.Log.logMessage("Conected to packager. You can now open your app in the simulator.");
        return Q.resolve(void 0);
    }
    enableJSDebuggingMode() {
        log_1.Log.logMessage("Debugger ready. Enable remote debugging in app.");
        return Q.resolve(void 0);
    }
    startPackager() {
        log_1.Log.logMessage("Starting React Native Packager.");
        return this.remoteExtension.startPackager();
    }
    prewarmBundleCache() {
        // generalMobilePlatform should do nothing here. Method should be overriden by children for specific behavior.
        return Q.resolve(void 0);
    }
}
exports.GeneralMobilePlatform = GeneralMobilePlatform;

//# sourceMappingURL=generalMobilePlatform.js.map
