// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var fs = require("fs");
var path = require("path");
var telemetryHelper_1 = require("../common/telemetryHelper");
var entryPointHandler_1 = require("../common/entryPointHandler");
var errorHelper_1 = require("../common/error/errorHelper");
var internalErrorCode_1 = require("../common/error/internalErrorCode");
var telemetryReporters_1 = require("../common/telemetryReporters");
var nodeDebugWrapper_1 = require("./nodeDebugWrapper");
var version = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf-8")).version;
var telemetryReporter = new telemetryReporters_1.ReassignableTelemetryReporter(new telemetryReporters_1.NullTelemetryReporter());
var appName = "react-native-debug-adapter";
function bailOut(reason) {
    // Things have gone wrong in initialization: Report the error to telemetry and exit
    telemetryHelper_1.TelemetryHelper.sendSimpleEvent(reason);
    process.exit(1);
}
// Enable telemetry
new entryPointHandler_1.EntryPointHandler(entryPointHandler_1.ProcessType.Debugger).runApp(appName, function () { return version; }, errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.DebuggingFailed), telemetryReporter, function () {
    /**
     * For debugging React Native we basically want to debug node plus some other stuff.
     * There is no need to create a new adapter for node because ther already exists one.
     * We look for node debug adapter on client's computer so we can jump of on top of that.
     */
    var nodeDebugFolder;
    var vscodeDebugAdapterPackage;
    // nodeDebugLocation.json is dynamically generated on extension activation.
    // If it fails, we must not have been in a react native project
    try {
        /* tslint:disable:no-var-requires */
        nodeDebugFolder = require("./nodeDebugLocation.json").nodeDebugPath;
        vscodeDebugAdapterPackage = require(path.join(nodeDebugFolder, "node_modules", "vscode-debugadapter"));
    }
    catch (e) {
        // Nothing we can do here: can't even communicate back because we don't know how to speak debug adapter
        bailOut("cannotFindDebugAdapter");
    }
    /**
     * We did find node debug adapter. Lets get the debugSession from it.
     * And add our customizations to the requests.
     */
    // Temporarily dummy out the DebugSession.run function so we do not start the debug adapter until we are ready
    var originalDebugSessionRun = vscodeDebugAdapterPackage.DebugSession.run;
    vscodeDebugAdapterPackage.DebugSession.run = function () { };
    var nodeDebug;
    var sourceMaps;
    try {
        /* tslint:disable:no-var-requires */
        nodeDebug = require(path.join(nodeDebugFolder, "out", "node", "nodeDebug"));
        sourceMaps = require(path.join(nodeDebugFolder, "out", "node", "sourceMaps"));
    }
    catch (e) {
        // Unable to find nodeDebug, but we can make our own communication channel now
        var debugSession = new vscodeDebugAdapterPackage.DebugSession();
        // Note: this will not work in the context of debugging the debug adapter and communicating over a socket,
        // but in that case we have much better ways to investigate errors.
        debugSession.start(process.stdin, process.stdout);
        debugSession.sendEvent(new vscodeDebugAdapterPackage.OutputEvent("Unable to start debug adapter: " + e.toString(), "stderr"));
        debugSession.sendEvent(new vscodeDebugAdapterPackage.TerminatedEvent());
        bailOut("cannotFindNodeDebugAdapter");
    }
    vscodeDebugAdapterPackage.DebugSession.run = originalDebugSessionRun;
    // Customize node adapter requests
    try {
        var nodeDebugWrapper = new nodeDebugWrapper_1.NodeDebugWrapper(appName, version, telemetryReporter, vscodeDebugAdapterPackage, nodeDebug.NodeDebugSession, sourceMaps.SourceMaps);
        nodeDebugWrapper.customizeNodeAdapterRequests();
    }
    catch (e) {
        var debugSession = new vscodeDebugAdapterPackage.DebugSession();
        debugSession.sendEvent(new vscodeDebugAdapterPackage.OutputEvent("Unable to start debug adapter: " + e.toString(), "stderr"));
        debugSession.sendEvent(new vscodeDebugAdapterPackage.TerminatedEvent());
        bailOut(e.toString());
    }
    // Run the debug session for the node debug adapter with our modified requests
    vscodeDebugAdapterPackage.DebugSession.run(nodeDebug.NodeDebugSession);
});

//# sourceMappingURL=reactNativeDebugEntryPoint.js.map
