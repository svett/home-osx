// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var path = require("path");
var Q = require("q");
var errorHelper_1 = require("../../common/error/errorHelper");
var plistBuddy_1 = require("./plistBuddy");
var log_1 = require("../../common/log/log");
var logHelper_1 = require("../../common/log/logHelper");
var fileSystem_1 = require("../../common/node/fileSystem");
var childProcess_1 = require("../../common/node/childProcess");
var telemetryHelper_1 = require("../../common/telemetryHelper");
var SimulatorPlist = (function () {
    function SimulatorPlist(projectRoot, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.nodeFileSystem, nodeFileSystem = _c === void 0 ? new fileSystem_1.FileSystem() : _c, _d = _b.plistBuddy, plistBuddy = _d === void 0 ? new plistBuddy_1.PlistBuddy() : _d, _e = _b.nodeChildProcess, nodeChildProcess = _e === void 0 ? new childProcess_1.ChildProcess() : _e;
        this.projectRoot = projectRoot;
        this.nodeFileSystem = nodeFileSystem;
        this.plistBuddy = plistBuddy;
        this.nodeChildProcess = nodeChildProcess;
    }
    SimulatorPlist.prototype.findPlistFile = function () {
        var _this = this;
        return Q.all([
            this.plistBuddy.getBundleId(this.projectRoot),
            this.nodeChildProcess.exec("xcrun simctl getenv booted HOME").outcome,
        ]).spread(function (bundleId, pathBuffer) {
            var pathBefore = path.join(pathBuffer.toString().trim(), "Containers", "Data", "Application");
            var pathAfter = path.join("Library", "Preferences", bundleId + ".plist");
            // Look through $SIMULATOR_HOME/Containers/Data/Application/*/Library/Preferences to find $BUNDLEID.plist
            return _this.nodeFileSystem.readDir(pathBefore).then(function (apps) {
                log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "About to search for plist in base folder: " + pathBefore + " pathAfter: " + pathAfter + " in each of the apps: " + apps);
                var plistCandidates = apps.map(function (app) { return path.join(pathBefore, app, pathAfter); }).filter(function (filePath) {
                    return _this.nodeFileSystem.existsSync(filePath);
                });
                if (plistCandidates.length === 0) {
                    throw new Error("Unable to find plist file for " + bundleId);
                }
                else if (plistCandidates.length > 1) {
                    telemetryHelper_1.TelemetryHelper.sendSimpleEvent("multipleDebugPlistFound");
                    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Multiple plist candidates found. Application may not be in debug mode."));
                }
                return plistCandidates[0];
            });
        });
    };
    return SimulatorPlist;
}());
exports.SimulatorPlist = SimulatorPlist;

//# sourceMappingURL=simulatorPlist.js.map
