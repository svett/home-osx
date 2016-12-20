// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var fs = require("fs");
var path = require("path");
var appWorker_1 = require("./appWorker");
var errorHelper_1 = require("../common/error/errorHelper");
var internalErrorCode_1 = require("../common/error/internalErrorCode");
var scriptImporter_1 = require("./scriptImporter");
var telemetryHelper_1 = require("../common/telemetryHelper");
var log_1 = require("../common/log/log");
var remoteExtension_1 = require("../common/remoteExtension");
var entryPointHandler_1 = require("../common/entryPointHandler");
var Launcher = (function () {
    function Launcher(workspaceRootPath, projectRootPath) {
        this.workspaceRootPath = workspaceRootPath;
        this.projectRootPath = projectRootPath;
        this.remoteExtension = remoteExtension_1.RemoteExtension.atProjectRootPath(this.projectRootPath);
    }
    Launcher.prototype.launch = function () {
        var _this = this;
        var debugAdapterPort = parseInt(process.argv[2], 10) || 9090;
        // Enable telemetry
        new entryPointHandler_1.EntryPointHandler(entryPointHandler_1.ProcessType.Debugee).runApp("react-native-debug-process", function () { return _this.getAppVersion(); }, errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.DebuggingFailed), this.projectRootPath, function () {
            return telemetryHelper_1.TelemetryHelper.generate("launch", function (generator) {
                var sourcesStoragePath = path.join(_this.workspaceRootPath, ".vscode", ".react");
                return _this.remoteExtension.getPackagerPort().then(function (packagerPort) {
                    var scriptImporter = new scriptImporter_1.ScriptImporter(packagerPort, sourcesStoragePath);
                    return scriptImporter.downloadDebuggerWorker(sourcesStoragePath).then(function () {
                        log_1.Log.logMessage("Downloaded debuggerWorker.js (Logic to run the React Native app) from the Packager.");
                    }).then(function () {
                        generator.step("Starting App Worker");
                        log_1.Log.logMessage("Starting debugger app worker.");
                        return new appWorker_1.MultipleLifetimesAppWorker(packagerPort, sourcesStoragePath, debugAdapterPort).start();
                    }).then(function () {
                        return log_1.Log.logMessage("Debugging session started successfully.");
                    });
                });
            });
        });
    };
    Launcher.prototype.getAppVersion = function () {
        return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf-8")).version;
    };
    return Launcher;
}());
exports.Launcher = Launcher;

//# sourceMappingURL=launcher.js.map
