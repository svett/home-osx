"use strict";
const events_1 = require('events');
(function (DebugType) {
    DebugType[DebugType["Local"] = 0] = "Local";
    DebugType[DebugType["Remote"] = 1] = "Remote";
    DebugType[DebugType["RunLocal"] = 2] = "RunLocal";
})(exports.DebugType || (exports.DebugType = {}));
var DebugType = exports.DebugType;
class DebugClient extends events_1.EventEmitter {
    constructor(args, debugSession) {
        super();
        this.debugSession = debugSession;
    }
    get DebugType() {
        return DebugType.Local;
    }
    Stop() {
    }
    LaunchApplicationToDebug(dbgServer, processErrored) {
        return Promise.resolve();
    }
}
exports.DebugClient = DebugClient;
//# sourceMappingURL=DebugClient.js.map