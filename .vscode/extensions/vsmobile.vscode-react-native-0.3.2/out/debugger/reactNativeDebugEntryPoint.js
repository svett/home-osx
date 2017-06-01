// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const telemetryHelper_1 = require("../common/telemetryHelper");
const entryPointHandler_1 = require("../common/entryPointHandler");
const errorHelper_1 = require("../common/error/errorHelper");
const internalErrorCode_1 = require("../common/error/internalErrorCode");
const telemetryReporters_1 = require("../common/telemetryReporters");
const nodeDebugWrapper_1 = require("./nodeDebugWrapper");
const version = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf-8")).version;
const telemetryReporter = new telemetryReporters_1.ReassignableTelemetryReporter(new telemetryReporters_1.NullTelemetryReporter());
const extensionName = "react-native-debug-adapter";
function bailOut(reason) {
    // Things have gone wrong in initialization: Report the error to telemetry and exit
    telemetryHelper_1.TelemetryHelper.sendSimpleEvent(reason);
    process.exit(1);
}
// Enable telemetry
new entryPointHandler_1.EntryPointHandler(entryPointHandler_1.ProcessType.Debugger).runApp(extensionName, () => version, errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.DebuggingFailed), telemetryReporter, () => {
    /**
     * For debugging React Native we basically want to debug node plus some other stuff.
     * There is no need to create a new adapter for node because ther already exists one.
     * We look for node debug adapter on client's computer so we can jump of on top of that.
     */
    let nodeDebugFolder;
    let VSCodeDebugAdapter;
    let Node2DebugAdapter;
    let ChromeDebuggerPackage;
    // nodeDebugLocation.json is dynamically generated on extension activation.
    // If it fails, we must not have been in a react native project
    try {
        /* tslint:disable:no-var-requires */
        nodeDebugFolder = require("./nodeDebugLocation.json").nodeDebugPath;
        VSCodeDebugAdapter = require(path.join(nodeDebugFolder, "node_modules/vscode-debugadapter"));
        ChromeDebuggerPackage = require(path.join(nodeDebugFolder, "node_modules/vscode-chrome-debug-core"));
        Node2DebugAdapter = require(path.join(nodeDebugFolder, "out/src/nodeDebugAdapter")).NodeDebugAdapter;
        /* tslint:enable:no-var-requires */
    }
    catch (e) {
        // Nothing we can do here: can't even communicate back because we don't know how to speak debug adapter
        bailOut("cannotFindDebugAdapter");
    }
    /**
     * We did find chrome debugger package and node2 debug adapter. Lets create debug
     * session and adapter with our customizations.
     */
    let session;
    let adapter;
    try {
        /* Create customised react-native debug adapter based on Node-debug2 adapter */
        adapter = nodeDebugWrapper_1.makeAdapter(Node2DebugAdapter);
        // Create a debug session class based on ChromeDebugSession
        session = nodeDebugWrapper_1.makeSession(ChromeDebuggerPackage.ChromeDebugSession, { adapter, extensionName }, VSCodeDebugAdapter, telemetryReporter, extensionName, version);
    }
    catch (e) {
        const debugSession = new VSCodeDebugAdapter.DebugSession();
        // Start session before sending any events otherwise the client wouldn't receive them
        debugSession.start(process.stdin, process.stdout);
        debugSession.sendEvent(new VSCodeDebugAdapter.OutputEvent("Unable to start debug adapter: " + e.toString(), "stderr"));
        debugSession.sendEvent(new VSCodeDebugAdapter.TerminatedEvent());
        bailOut(e.toString());
    }
    // Run the debug session for the node debug adapter with our modified requests
    ChromeDebuggerPackage.ChromeDebugSession.run(session);
});

//# sourceMappingURL=reactNativeDebugEntryPoint.js.map
