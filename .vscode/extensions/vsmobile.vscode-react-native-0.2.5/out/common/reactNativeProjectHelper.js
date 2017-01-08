// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var semver = require("semver");
var fs = require("fs");
var path = require("path");
var commandExecutor_1 = require("./commandExecutor");
var ReactNativeProjectHelper = (function () {
    function ReactNativeProjectHelper(projectRoot) {
        this.projectRoot = projectRoot;
    }
    ReactNativeProjectHelper.prototype.getReactNativeVersion = function () {
        return new commandExecutor_1.CommandExecutor(this.projectRoot).getReactNativeVersion();
    };
    /**
     * Ensures that we are in a React Native project
     * Otherwise, displays an error message banner
     */
    ReactNativeProjectHelper.prototype.isReactNativeProject = function () {
        if (!this.projectRoot || !fs.existsSync(path.join(this.projectRoot, "package.json"))) {
            return Q(false);
        }
        return this.getReactNativeVersion().
            then(function (version) {
            return !!(version);
        });
    };
    ReactNativeProjectHelper.prototype.validateReactNativeVersion = function () {
        return this.getReactNativeVersion().then(function (version) {
            if (semver.gte(version, "0.19.0")) {
                return Q.resolve(void 0);
            }
            else {
                return Q.reject(new RangeError("Project version = " + version));
            }
        });
    };
    return ReactNativeProjectHelper;
}());
exports.ReactNativeProjectHelper = ReactNativeProjectHelper;

//# sourceMappingURL=reactNativeProjectHelper.js.map
