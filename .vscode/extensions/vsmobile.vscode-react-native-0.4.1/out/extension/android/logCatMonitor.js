// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const vscode = require("vscode");
const childProcess_1 = require("../../common/node/childProcess");
const outputChannelLogger_1 = require("../outputChannelLogger");
const executionsLimiter_1 = require("../../common/executionsLimiter");
/* This class will print the LogCat messages to an Output Channel. The configuration for logcat can be cutomized in
   the .vscode/launch.json file by defining a setting named logCatArguments for the configuration being used. The
   setting accepts values as:
      1. an array: ["*:S", "ReactNative:V", "ReactNativeJS:V"]
      2. a string: "*:S ReactNative:V ReactNativeJS:V"
   Type `adb logcat --help` to see the parameters and usage of logcat
*/
class LogCatMonitor {
    constructor(deviceId, userProvidedLogCatArguments, { childProcess = new childProcess_1.ChildProcess() } = {}) {
        this._deviceId = deviceId;
        this._userProvidedLogCatArguments = userProvidedLogCatArguments;
        this._childProcess = childProcess;
        this._logger = LogCatMonitor.getLogger(`LogCat - ${deviceId}`);
    }
    start() {
        const logCatArguments = this.getLogCatArguments();
        const adbParameters = ["-s", this._deviceId, "logcat"].concat(logCatArguments);
        this._logger.logMessage(`Monitoring LogCat for device ${this._deviceId} with arguments: ${logCatArguments}`);
        this._logCatSpawn = new childProcess_1.ChildProcess().spawn("adb", adbParameters);
        /* LogCat has a buffer and prints old messages when first called. To ignore them,
            we won't print messages for the first 0.5 seconds */
        const filter = new executionsLimiter_1.ExecutionsFilterBeforeTimestamp(/*delayInSeconds*/ 0.5);
        this._logCatSpawn.stderr.on("data", (data) => {
            filter.execute(() => this._logger.logMessage(data.toString(), /*formatMessage*/ false));
        });
        this._logCatSpawn.stdout.on("data", (data) => {
            filter.execute(() => this._logger.logMessage(data.toString(), /*formatMessage*/ false));
        });
        return this._logCatSpawn.outcome.then(() => this._logger.logMessage("LogCat monitoring stopped because the process exited."), reason => {
            if (!this._logCatSpawn) {
                this._logger.logMessage("LogCat monitoring stopped because the debugging session finished");
            }
            else {
                return Q.reject(reason); // Unkown error. Pass it up the promise chain
            }
        }).finally(() => this._logCatSpawn = null);
    }
    dispose() {
        if (this._logCatSpawn) {
            const logCatSpawn = this._logCatSpawn;
            this._logCatSpawn = null;
            logCatSpawn.spawnedProcess.kill();
        }
        for (let name of Object.keys(LogCatMonitor.loggers)) {
            LogCatMonitor.loggers[name].getOutputChannel().dispose();
        }
    }
    getLogCatArguments() {
        // We use the setting if it's defined, or the defaults if it's not
        return this.isNullOrUndefined(this._userProvidedLogCatArguments) // "" is a valid value, so we can't just if () this
            ? LogCatMonitor.DEFAULT_PARAMETERS
            : ("" + this._userProvidedLogCatArguments).split(" "); // Parse string and split into string[]
    }
    isNullOrUndefined(value) {
        return typeof value === "undefined" || value === null;
    }
    /**
     * Fabric method to create new output channels and reuse old
     */
    static getLogger(name) {
        if (!LogCatMonitor.loggers[name]) {
            LogCatMonitor.loggers[name] = new outputChannelLogger_1.OutputChannelLogger(vscode.window.createOutputChannel(name));
        }
        LogCatMonitor.loggers[name].getOutputChannel().clear();
        return LogCatMonitor.loggers[name];
    }
}
LogCatMonitor.DEFAULT_PARAMETERS = ["*:S", "ReactNative:V", "ReactNativeJS:V"];
LogCatMonitor.loggers = {};
exports.LogCatMonitor = LogCatMonitor;

//# sourceMappingURL=logCatMonitor.js.map
