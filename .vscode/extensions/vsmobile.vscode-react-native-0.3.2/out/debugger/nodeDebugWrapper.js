// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const path = require("path");
const fs = require("fs");
const stripJsonComments = require("strip-json-comments");
const telemetry_1 = require("../common/telemetry");
const telemetryHelper_1 = require("../common/telemetryHelper");
const remoteExtension_1 = require("../common/remoteExtension");
const iOSPlatform_1 = require("./ios/iOSPlatform");
const platformResolver_1 = require("./platformResolver");
const targetPlatformHelper_1 = require("../common/targetPlatformHelper");
const telemetryReporters_1 = require("../common/telemetryReporters");
const loggers_1 = require("../common/log/loggers");
const log_1 = require("../common/log/log");
const logHelper_1 = require("../common/log/logHelper");
const appWorker_1 = require("./appWorker");
function makeSession(debugSessionClass, debugSessionOpts, debugAdapterPackage, telemetryReporter, appName, version) {
    return class extends debugSessionClass {
        constructor(debuggerLinesAndColumnsStartAt1, isServer) {
            super(debuggerLinesAndColumnsStartAt1, isServer, debugSessionOpts);
            this.appWorker = null;
        }
        // Override ChromeDebugSession's sendEvent to control what we will send to client
        sendEvent(event) {
            // Do not send "terminated" events signaling about session's restart to client as it would cause it
            // to restart adapter's process, while we want to stay alive and don't want to interrupt connection
            // to packager.
            if (event.event === "terminated" && event.body && event.body.restart === true) {
                return;
            }
            super.sendEvent(event);
        }
        dispatchRequest(request) {
            if (request.command === "disconnect")
                return this.disconnect(request);
            if (request.command === "attach")
                return this.attach(request);
            if (request.command === "launch")
                return this.launch(request);
            return super.dispatchRequest(request);
        }
        launch(request) {
            this.requestSetup(request.arguments);
            this.mobilePlatformOptions.target = request.arguments.target || "simulator";
            this.mobilePlatformOptions.iosRelativeProjectPath = !isNullOrUndefined(request.arguments.iosRelativeProjectPath) ?
                request.arguments.iosRelativeProjectPath :
                iOSPlatform_1.IOSPlatform.DEFAULT_IOS_PROJECT_RELATIVE_PATH;
            // We add the parameter if it's defined (adapter crashes otherwise)
            if (!isNullOrUndefined(request.arguments.logCatArguments)) {
                this.mobilePlatformOptions.logCatArguments = [parseLogCatArguments(request.arguments.logCatArguments)];
            }
            if (!isNullOrUndefined(request.arguments.variant)) {
                this.mobilePlatformOptions.variant = request.arguments.variant;
            }
            telemetryHelper_1.TelemetryHelper.generate("launch", (generator) => {
                return this.remoteExtension.getPackagerPort()
                    .then((packagerPort) => {
                    this.mobilePlatformOptions.packagerPort = packagerPort;
                    const mobilePlatform = new platformResolver_1.PlatformResolver()
                        .resolveMobilePlatform(request.arguments.platform, this.mobilePlatformOptions);
                    generator.step("checkPlatformCompatibility");
                    targetPlatformHelper_1.TargetPlatformHelper.checkTargetPlatformSupport(this.mobilePlatformOptions.platform);
                    generator.step("startPackager");
                    return mobilePlatform.startPackager()
                        .then(() => {
                        // We've seen that if we don't prewarm the bundle cache, the app fails on the first attempt to connect to the debugger logic
                        // and the user needs to Reload JS manually. We prewarm it to prevent that issue
                        generator.step("prewarmBundleCache");
                        log_1.Log.logMessage("Prewarming bundle cache. This may take a while ...");
                        return mobilePlatform.prewarmBundleCache();
                    })
                        .then(() => {
                        generator.step("mobilePlatform.runApp");
                        log_1.Log.logMessage("Building and running application.");
                        return mobilePlatform.runApp();
                    })
                        .then(() => {
                        return this.attachRequest(request, packagerPort, mobilePlatform);
                    });
                })
                    .catch(error => this.bailOut(error.message));
            });
        }
        attach(request) {
            this.requestSetup(request.arguments);
            this.remoteExtension.getPackagerPort()
                .then((packagerPort) => this.attachRequest(request, packagerPort));
        }
        disconnect(request) {
            // The client is about to disconnect so first we need to stop app worker
            if (this.appWorker) {
                this.appWorker.stop();
            }
            // Then we tell the extension to stop monitoring the logcat, and then we disconnect the debugging session
            if (this.mobilePlatformOptions.platform === "android") {
                this.remoteExtension.stopMonitoringLogcat()
                    .catch(reason => log_1.Log.logError(`WARNING: Couldn't stop monitoring logcat: ${reason.message || reason}\n`))
                    .finally(() => super.dispatchRequest(request));
            }
            else {
                super.dispatchRequest(request);
            }
        }
        requestSetup(args) {
            this.projectRootPath = getProjectRoot(args);
            this.remoteExtension = remoteExtension_1.RemoteExtension.atProjectRootPath(this.projectRootPath);
            this.mobilePlatformOptions = {
                projectRoot: this.projectRootPath,
                platform: args.platform,
            };
            // Start to send telemetry
            telemetryReporter.reassignTo(new telemetryReporters_1.ExtensionTelemetryReporter(appName, version, telemetry_1.Telemetry.APPINSIGHTS_INSTRUMENTATIONKEY, this.projectRootPath));
            log_1.Log.SetGlobalLogger(new loggers_1.NodeDebugAdapterLogger(debugAdapterPackage, this));
        }
        /**
         * Runs logic needed to attach.
         * Attach should:
         * - Enable js debugging
         */
        attachRequest(request, packagerPort, mobilePlatform) {
            return telemetryHelper_1.TelemetryHelper.generate("attach", (generator) => {
                return Q({})
                    .then(() => {
                    generator.step("mobilePlatform.enableJSDebuggingMode");
                    if (mobilePlatform) {
                        return mobilePlatform.enableJSDebuggingMode();
                    }
                    else {
                        log_1.Log.logMessage("Debugger ready. Enable remote debugging in app.");
                    }
                })
                    .then(() => {
                    log_1.Log.logMessage("Starting debugger app worker.");
                    // TODO: remove dependency on args.program - "program" property is technically
                    // no more required in launch configuration and could be removed
                    const workspaceRootPath = path.resolve(path.dirname(request.arguments.program), "..");
                    const sourcesStoragePath = path.join(workspaceRootPath, ".vscode", ".react");
                    // If launch is invoked first time, appWorker is undefined, so create it here
                    this.appWorker = new appWorker_1.MultipleLifetimesAppWorker(packagerPort, sourcesStoragePath);
                    this.appWorker.on("connected", (port) => {
                        log_1.Log.logMessage("Debugger worker loaded runtime on port " + port);
                        // Don't mutate original request to avoid side effects
                        let attachArguments = Object.assign({}, request.arguments, { port, restart: true, request: "attach" });
                        let attachRequest = Object.assign({}, request, { command: "attach", arguments: attachArguments });
                        // Reinstantiate debug adapter, as the current implementation of ChromeDebugAdapter
                        // doesn't allow us to reattach to another debug target easily. As of now it's easier
                        // to throw previous instance out and create a new one.
                        this._debugAdapter = new debugSessionOpts.adapter(debugSessionOpts, this);
                        super.dispatchRequest(attachRequest);
                    });
                    return this.appWorker.start();
                })
                    .catch(error => this.bailOut(error.message));
            });
        }
        /**
         * Logs error to user and finishes the debugging process.
         */
        bailOut(message) {
            log_1.Log.logError(`Could not debug. ${message}`);
            this.sendEvent(new debugAdapterPackage.TerminatedEvent());
        }
        ;
    };
}
exports.makeSession = makeSession;
function makeAdapter(debugAdapterClass) {
    return class extends debugAdapterClass {
        doAttach(port, targetUrl, address, timeout) {
            // We need to overwrite ChromeDebug's _attachMode to let Node2 adapter
            // to set up breakpoints on initial pause event
            this._attachMode = false;
            return super.doAttach(port, targetUrl, address, timeout);
        }
        setBreakpoints(args, requestSeq, ids) {
            // We need to overwrite ChromeDebug's setBreakpoints to get rid unhandled rejections
            // when breakpoints are being set up unsuccessfully
            return super.setBreakpoints(args, requestSeq, ids).catch((err) => {
                log_1.Log.logInternalMessage(logHelper_1.LogLevel.Error, err.message);
                return {
                    breakpoints: [],
                };
            });
        }
    };
}
exports.makeAdapter = makeAdapter;
/**
 * Parses log cat arguments to a string
 */
function parseLogCatArguments(userProvidedLogCatArguments) {
    return Array.isArray(userProvidedLogCatArguments)
        ? userProvidedLogCatArguments.join(" ") // If it's an array, we join the arguments
        : userProvidedLogCatArguments; // If not, we leave it as-is
}
/**
 * Helper method to know if a value is either null or undefined
 */
function isNullOrUndefined(value) {
    return typeof value === "undefined" || value === null;
}
/**
 * Parses settings.json file for workspace root property
 */
function getProjectRoot(args) {
    try {
        let vsCodeRoot = path.resolve(args.program, "../..");
        let settingsPath = path.resolve(vsCodeRoot, ".vscode/settings.json");
        let settingsContent = fs.readFileSync(settingsPath, "utf8");
        settingsContent = stripJsonComments(settingsContent);
        let parsedSettings = JSON.parse(settingsContent);
        let projectRootPath = parsedSettings["react-native-tools"].projectRoot;
        return path.resolve(vsCodeRoot, projectRootPath);
    }
    catch (e) {
        return path.resolve(args.program, "../..");
    }
}

//# sourceMappingURL=nodeDebugWrapper.js.map
