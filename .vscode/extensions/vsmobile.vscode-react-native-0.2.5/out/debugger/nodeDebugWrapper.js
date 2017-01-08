// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var path = require("path");
var http = require("http");
var fs = require("fs");
var stripJsonComments = require("strip-json-comments");
var telemetry_1 = require("../common/telemetry");
var telemetryHelper_1 = require("../common/telemetryHelper");
var remoteExtension_1 = require("../common/remoteExtension");
var iOSPlatform_1 = require("./ios/iOSPlatform");
var platformResolver_1 = require("./platformResolver");
var targetPlatformHelper_1 = require("../common/targetPlatformHelper");
var telemetryReporters_1 = require("../common/telemetryReporters");
var loggers_1 = require("../common/log/loggers");
var log_1 = require("../common/log/log");
var generalMobilePlatform_1 = require("../common/generalMobilePlatform");
var NodeDebugWrapper = (function () {
    function NodeDebugWrapper(appName, version, telemetryReporter, debugAdapter, debugSession, sourceMaps) {
        this.appName = appName;
        this.version = version;
        this.telemetryReporter = telemetryReporter;
        this.vscodeDebugAdapterPackage = debugAdapter;
        this.nodeDebugSession = debugSession;
        this.sourceMapsConstructor = sourceMaps;
        this.originalLaunchRequest = this.nodeDebugSession.prototype.launchRequest;
    }
    /**
     * Calls customize methods for all requests needed
     */
    NodeDebugWrapper.prototype.customizeNodeAdapterRequests = function () {
        this.customizeLaunchRequest();
        this.customizeAttachRequest();
        this.customizeDisconnectRequest();
    };
    /**
     * Intecept the "launchRequest" instance method of NodeDebugSession to interpret arguments.
     * Launch should:
     * - Run the packager if needed
     * - Compile and run application
     * - Prewarm bundle
     */
    NodeDebugWrapper.prototype.customizeLaunchRequest = function () {
        var nodeDebugWrapper = this;
        this.nodeDebugSession.prototype.launchRequest = function (request, args) {
            var _this = this;
            nodeDebugWrapper.requestSetup(this, args);
            nodeDebugWrapper.mobilePlatformOptions.target = args.target || "simulator";
            nodeDebugWrapper.mobilePlatformOptions.iosRelativeProjectPath = !nodeDebugWrapper.isNullOrUndefined(args.iosRelativeProjectPath) ?
                args.iosRelativeProjectPath :
                iOSPlatform_1.IOSPlatform.DEFAULT_IOS_PROJECT_RELATIVE_PATH;
            // We add the parameter if it's defined (adapter crashes otherwise)
            if (!nodeDebugWrapper.isNullOrUndefined(args.logCatArguments)) {
                nodeDebugWrapper.mobilePlatformOptions.logCatArguments = [nodeDebugWrapper.parseLogCatArguments(args.logCatArguments)];
            }
            return telemetryHelper_1.TelemetryHelper.generate("launch", function (generator) {
                var resolver = new platformResolver_1.PlatformResolver();
                return nodeDebugWrapper.remoteExtension.getPackagerPort()
                    .then(function (packagerPort) {
                    nodeDebugWrapper.mobilePlatformOptions.packagerPort = packagerPort;
                    var mobilePlatform = resolver.resolveMobilePlatform(args.platform, nodeDebugWrapper.mobilePlatformOptions);
                    return Q({})
                        .then(function () {
                        generator.step("checkPlatformCompatibility");
                        targetPlatformHelper_1.TargetPlatformHelper.checkTargetPlatformSupport(nodeDebugWrapper.mobilePlatformOptions.platform);
                        generator.step("startPackager");
                        return mobilePlatform.startPackager();
                    })
                        .then(function () {
                        // We've seen that if we don't prewarm the bundle cache, the app fails on the first attempt to connect to the debugger logic
                        // and the user needs to Reload JS manually. We prewarm it to prevent that issue
                        generator.step("prewarmBundleCache");
                        log_1.Log.logMessage("Prewarming bundle cache. This may take a while ...");
                        return mobilePlatform.prewarmBundleCache();
                    })
                        .then(function () {
                        generator.step("mobilePlatform.runApp");
                        log_1.Log.logMessage("Building and running application.");
                        return mobilePlatform.runApp();
                    })
                        .then(function () {
                        return nodeDebugWrapper.attachRequest(_this, request, args, mobilePlatform);
                    });
                }).catch(function (error) {
                    return nodeDebugWrapper.bailOut(_this, error.message);
                });
            });
        };
    };
    /**
     * Intecept the "attachRequest" instance method of NodeDebugSession to interpret arguments
     */
    NodeDebugWrapper.prototype.customizeAttachRequest = function () {
        var nodeDebugWrapper = this;
        this.nodeDebugSession.prototype.attachRequest = function (request, args) {
            nodeDebugWrapper.requestSetup(this, args);
            nodeDebugWrapper.attachRequest(this, request, args, new generalMobilePlatform_1.GeneralMobilePlatform(nodeDebugWrapper.mobilePlatformOptions));
        };
    };
    /**
     * Intecept the "disconnectRequest" instance method of NodeDebugSession to interpret arguments
     */
    NodeDebugWrapper.prototype.customizeDisconnectRequest = function () {
        var originalRequest = this.nodeDebugSession.prototype.disconnectRequest;
        var nodeDebugWrapper = this;
        this.nodeDebugSession.prototype.disconnectRequest = function (response, args) {
            // First we tell the extension to stop monitoring the logcat, and then we disconnect the debugging session
            var _this = this;
            if (nodeDebugWrapper.mobilePlatformOptions.platform === "android") {
                nodeDebugWrapper.remoteExtension.stopMonitoringLogcat()
                    .catch(function (reason) {
                    return log_1.Log.logError("WARNING: Couldn't stop monitoring logcat: " + (reason.message || reason) + "\n");
                })
                    .finally(function () {
                    return originalRequest.call(_this, response, args);
                });
            }
            else {
                originalRequest.call(this, response, args);
            }
        };
    };
    /**
     * Makes the required setup for request customization
     * - Enables telemetry
     * - Sets up mobilePlatformOptions, remote extension and projectRootPath
     * - Starts debug server
     * - Create global logger
     */
    NodeDebugWrapper.prototype.requestSetup = function (debugSession, args) {
        this.projectRootPath = this.getProjectRoot(args);
        this.remoteExtension = remoteExtension_1.RemoteExtension.atProjectRootPath(this.projectRootPath);
        this.mobilePlatformOptions = {
            projectRoot: this.projectRootPath,
            platform: args.platform,
        };
        // Start to send telemetry
        this.telemetryReporter.reassignTo(new telemetryReporters_1.ExtensionTelemetryReporter(this.appName, this.version, telemetry_1.Telemetry.APPINSIGHTS_INSTRUMENTATIONKEY, this.projectRootPath));
        // Create a server waiting for messages to re-initialize the debug session;
        var debugServerListeningPort = this.createReinitializeServer(debugSession, args.internalDebuggerPort, args.outDir);
        args.args = [debugServerListeningPort.toString()];
        log_1.Log.SetGlobalLogger(new loggers_1.NodeDebugAdapterLogger(this.vscodeDebugAdapterPackage, debugSession));
    };
    /**
     * Runs logic needed to attach.
     * Attach should:
     * - Enable js debugging
     */
    NodeDebugWrapper.prototype.attachRequest = function (debugSession, request, args, mobilePlatform) {
        var _this = this;
        return telemetryHelper_1.TelemetryHelper.generate("attach", function (generator) {
            return Q({})
                .then(function () {
                generator.step("mobilePlatform.enableJSDebuggingMode");
                if (mobilePlatform) {
                    return mobilePlatform.enableJSDebuggingMode();
                }
                else {
                    log_1.Log.logMessage("Debugger ready. Enable remote debugging in app.");
                }
            }).then(function () {
                return _this.originalLaunchRequest.call(debugSession, request, args);
            })
                .catch(function (error) {
                return _this.bailOut(debugSession, error.message);
            });
        });
    };
    /**
     * Creates internal debug server and returns the port that the server is hook up into.
     */
    NodeDebugWrapper.prototype.createReinitializeServer = function (debugSession, internalDebuggerPort, sourcesDir) {
        var _this = this;
        // Create the server
        var server = http.createServer(function (req, res) {
            res.statusCode = 404;
            if (req.url === "/refreshBreakpoints") {
                res.statusCode = 200;
                if (debugSession) {
                    var sourceMaps = debugSession._sourceMaps;
                    if (sourceMaps) {
                        // Flush any cached source maps
                        // Rather than cleaning internal caches we recreate
                        // SourceMaps to add downloaded bundle map to cache
                        var bundlePattern = path.join(sourcesDir, "*.bundle");
                        var sourceMaps_1 = new _this.sourceMapsConstructor(debugSession, sourcesDir, [bundlePattern]);
                        debugSession._sourceMaps = sourceMaps_1;
                    }
                    // Send an "initialized" event to trigger breakpoints to be re-sent
                    debugSession.sendEvent(new _this.vscodeDebugAdapterPackage.InitializedEvent());
                }
            }
            res.end();
        });
        // Setup listen port and on error response
        var port = parseInt(internalDebuggerPort, 10) || 9090;
        server.listen(port);
        server.on("error", function (err) {
            telemetryHelper_1.TelemetryHelper.sendSimpleEvent("reinitializeServerError");
            log_1.Log.logError("Error in debug adapter server: " + err.toString());
            log_1.Log.logMessage("Breakpoints may not update. Consider restarting and specifying a different 'internalDebuggerPort' in launch.json");
        });
        // Return listen port
        return port;
    };
    /**
     * Logs error to user and finishes the debugging process.
     */
    NodeDebugWrapper.prototype.bailOut = function (debugSession, message) {
        log_1.Log.logError("Could not debug. " + message);
        debugSession.sendEvent(new this.vscodeDebugAdapterPackage.TerminatedEvent());
        process.exit(1);
    };
    /**
     * Parses log cat arguments to a string
     */
    NodeDebugWrapper.prototype.parseLogCatArguments = function (userProvidedLogCatArguments) {
        return Array.isArray(userProvidedLogCatArguments)
            ? userProvidedLogCatArguments.join(" ") // If it's an array, we join the arguments
            : userProvidedLogCatArguments; // If not, we leave it as-is
    };
    /**
     * Helper method to know if a value is either null or undefined
     */
    NodeDebugWrapper.prototype.isNullOrUndefined = function (value) {
        return typeof value === "undefined" || value === null;
    };
    /**
     * Parses settings.json file for workspace root property
     */
    NodeDebugWrapper.prototype.getProjectRoot = function (args) {
        try {
            var vsCodeRoot = path.resolve(args.program, "../..");
            var settingsPath = path.resolve(vsCodeRoot, ".vscode/settings.json");
            var settingsContent = fs.readFileSync(settingsPath, "utf8");
            settingsContent = stripJsonComments(settingsContent);
            var parsedSettings = JSON.parse(settingsContent);
            var projectRootPath = parsedSettings["react-native-tools"].projectRoot;
            return path.resolve(vsCodeRoot, projectRootPath);
        }
        catch (e) {
            return path.resolve(args.program, "../..");
        }
    };
    return NodeDebugWrapper;
}());
exports.NodeDebugWrapper = NodeDebugWrapper;

//# sourceMappingURL=nodeDebugWrapper.js.map
