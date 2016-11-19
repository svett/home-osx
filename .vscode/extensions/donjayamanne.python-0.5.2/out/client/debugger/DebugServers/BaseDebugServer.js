"use strict";
const events_1 = require("events");
const helpers_1 = require('../../common/helpers');
class BaseDebugServer extends events_1.EventEmitter {
    constructor(debugSession, pythonProcess) {
        super();
        this.debugSession = debugSession;
        this.pythonProcess = pythonProcess;
        this.debugClientConnected = helpers_1.createDeferred();
    }
    get IsRunning() {
        return this.isRunning;
    }
    get DebugClientConnected() {
        return this.debugClientConnected.promise;
    }
}
exports.BaseDebugServer = BaseDebugServer;
//# sourceMappingURL=BaseDebugServer.js.map