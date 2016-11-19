"use strict";
const LocalDebugServer_1 = require("./LocalDebugServer");
function CreateDebugServer(debugSession, pythonProcess) {
    return new LocalDebugServer_1.LocalDebugServer(debugSession, pythonProcess);
}
exports.CreateDebugServer = CreateDebugServer;
//# sourceMappingURL=DebugServerFactory.js.map