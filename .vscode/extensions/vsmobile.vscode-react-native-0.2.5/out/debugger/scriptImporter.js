// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var fileSystem_1 = require("../common/node/fileSystem");
var log_1 = require("../common/log/log");
var logHelper_1 = require("../common/log/logHelper");
var packager_1 = require("../common/packager");
var path = require("path");
var Q = require("q");
var request_1 = require("../common/node/request");
var sourceMap_1 = require("./sourceMap");
var url = require("url");
var ScriptImporter = (function () {
    function ScriptImporter(packagerPort, sourcesStoragePath) {
        this.packagerPort = packagerPort;
        this.sourcesStoragePath = sourcesStoragePath;
        this.sourceMapUtil = new sourceMap_1.SourceMapUtil();
    }
    ScriptImporter.prototype.downloadAppScript = function (scriptUrlString, debugAdapterPort) {
        var _this = this;
        var parsedScriptUrl = url.parse(scriptUrlString);
        var overriddenScriptUrlString = (parsedScriptUrl.hostname === "localhost") ? this.overridePackagerPort(scriptUrlString) : scriptUrlString;
        // We'll get the source code, and store it locally to have a better debugging experience
        return new request_1.Request().request(overriddenScriptUrlString, true).then(function (scriptBody) {
            // Extract sourceMappingURL from body
            var scriptUrl = url.parse(overriddenScriptUrlString); // scriptUrl = "http://localhost:8081/index.ios.bundle?platform=ios&dev=true"
            var sourceMappingUrl = _this.sourceMapUtil.getSourceMapURL(scriptUrl, scriptBody); // sourceMappingUrl = "http://localhost:8081/index.ios.map?platform=ios&dev=true"
            var waitForSourceMapping = Q(null);
            if (sourceMappingUrl) {
                /* handle source map - request it and store it locally */
                waitForSourceMapping = _this.writeAppSourceMap(sourceMappingUrl, scriptUrl)
                    .then(function () {
                    scriptBody = _this.sourceMapUtil.updateScriptPaths(scriptBody, sourceMappingUrl);
                });
            }
            return waitForSourceMapping
                .then(function () { return _this.writeAppScript(scriptBody, scriptUrl); })
                .then(function (scriptFilePath) {
                log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "Script " + overriddenScriptUrlString + " downloaded to " + scriptFilePath);
                return { contents: scriptBody, filepath: scriptFilePath };
            }).finally(function () {
                // Request that the debug adapter update breakpoints and sourcemaps now that we have written them
                return new request_1.Request().request("http://localhost:" + debugAdapterPort + "/refreshBreakpoints");
            });
        });
    };
    ScriptImporter.prototype.downloadDebuggerWorker = function (sourcesStoragePath) {
        var _this = this;
        return packager_1.Packager.isPackagerRunning(packager_1.Packager.getHostForPort(this.packagerPort))
            .then(function (running) {
            if (running) {
                var debuggerWorkerURL = "http://" + packager_1.Packager.getHostForPort(_this.packagerPort) + "/" + ScriptImporter.DEBUGGER_WORKER_FILENAME;
                var debuggerWorkerLocalPath_1 = path.join(sourcesStoragePath, ScriptImporter.DEBUGGER_WORKER_FILENAME);
                log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "About to download: " + debuggerWorkerURL + " to: " + debuggerWorkerLocalPath_1);
                return new request_1.Request().request(debuggerWorkerURL, true).then(function (body) {
                    return new fileSystem_1.FileSystem().writeFile(debuggerWorkerLocalPath_1, body);
                });
            }
            throw new RangeError("Cannot attach to packager. Are you sure there is a packager and it is running in the port " + _this.packagerPort + "? If your packager is configured to run in another port make sure to add that to the setting.json.");
        });
    };
    /**
     * Writes the script file to the project temporary location.
     */
    ScriptImporter.prototype.writeAppScript = function (scriptBody, scriptUrl) {
        var scriptFilePath = path.join(this.sourcesStoragePath, path.basename(scriptUrl.pathname)); // scriptFilePath = "$TMPDIR/index.ios.bundle"
        return new fileSystem_1.FileSystem().writeFile(scriptFilePath, scriptBody)
            .then(function () { return scriptFilePath; });
    };
    /**
     * Writes the source map file to the project temporary location.
     */
    ScriptImporter.prototype.writeAppSourceMap = function (sourceMapUrl, scriptUrl) {
        var _this = this;
        return new request_1.Request().request(sourceMapUrl.href, true)
            .then(function (sourceMapBody) {
            var sourceMappingLocalPath = path.join(_this.sourcesStoragePath, path.basename(sourceMapUrl.pathname)); // sourceMappingLocalPath = "$TMPDIR/index.ios.map"
            var scriptFileRelativePath = path.basename(scriptUrl.pathname); // scriptFileRelativePath = "index.ios.bundle"
            var updatedContent = _this.sourceMapUtil.updateSourceMapFile(sourceMapBody, scriptFileRelativePath, _this.sourcesStoragePath);
            return new fileSystem_1.FileSystem().writeFile(sourceMappingLocalPath, updatedContent);
        });
    };
    /**
     * Changes the port of the url to be the one configured as this.packagerPort
     */
    ScriptImporter.prototype.overridePackagerPort = function (urlToOverride) {
        var components = url.parse(urlToOverride);
        components.port = this.packagerPort.toString();
        delete components.host; // We delete the host, if not the port change will be ignored
        return url.format(components);
    };
    ScriptImporter.DEBUGGER_WORKER_FILE_BASENAME = "debuggerWorker";
    ScriptImporter.DEBUGGER_WORKER_FILENAME = ScriptImporter.DEBUGGER_WORKER_FILE_BASENAME + ".js";
    return ScriptImporter;
}());
exports.ScriptImporter = ScriptImporter;

//# sourceMappingURL=scriptImporter.js.map
