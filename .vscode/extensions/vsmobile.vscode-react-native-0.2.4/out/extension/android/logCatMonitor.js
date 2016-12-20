// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var vscode = require("vscode");
var childProcess_1 = require("../../common/node/childProcess");
var outputChannelLogger_1 = require("../outputChannelLogger");
var executionsLimiter_1 = require("../../common/executionsLimiter");
/* This class will print the LogCat messages to an Output Channel. The configuration for logcat can be cutomized in
   the .vscode/launch.json file by defining a setting named logCatArguments for the configuration being used. The
   setting accepts values as:
      1. an array: ["*:S", "ReactNative:V", "ReactNativeJS:V"]
      2. a string: "*:S ReactNative:V ReactNativeJS:V"
   Type `adb logcat --help` to see the parameters and usage of logcat
*/
var LogCatMonitor = (function () {
    function LogCatMonitor(deviceId, userProvidedLogCatArguments, _a) {
        var _b = (_a === void 0 ? {} : _a).childProcess, childProcess = _b === void 0 ? new childProcess_1.ChildProcess() : _b;
        this._deviceId = deviceId;
        this._userProvidedLogCatArguments = userProvidedLogCatArguments;
        this._childProcess = childProcess;
        this._logger = new outputChannelLogger_1.OutputChannelLogger(vscode.window.createOutputChannel("LogCat - " + deviceId));
    }
    LogCatMonitor.prototype.start = function () {
        var _this = this;
        var logCatArguments = this.getLogCatArguments();
        var adbParameters = ["-s", this._deviceId, "logcat"].concat(logCatArguments);
        this._logger.logMessage("Monitoring LogCat for device " + this._deviceId + " with arguments: " + logCatArguments);
        this._logCatSpawn = new childProcess_1.ChildProcess().spawn("adb", adbParameters);
        /* LogCat has a buffer and prints old messages when first called. To ignore them,
            we won't print messages for the first 0.5 seconds */
        var filter = new executionsLimiter_1.ExecutionsFilterBeforeTimestamp(/*delayInSeconds*/ 0.5);
        this._logCatSpawn.stderr.on("data", function (data) {
            filter.execute(function () { return _this._logger.logMessage(data.toString(), /*formatMessage*/ false); });
        });
        this._logCatSpawn.stdout.on("data", function (data) {
            filter.execute(function () { return _this._logger.logMessage(data.toString(), /*formatMessage*/ false); });
        });
        return this._logCatSpawn.outcome.then(function () {
            return _this._logger.logMessage("LogCat monitoring stopped because the process exited.");
        }, function (reason) {
            if (!_this._logCatSpawn) {
                _this._logger.logMessage("LogCat monitoring stopped because the debugging session finished");
            }
            else {
                return Q.reject(reason); // Unkown error. Pass it up the promise chain
            }
        }).finally(function () {
            return _this._logCatSpawn = null;
        });
    };
    LogCatMonitor.prototype.dispose = function () {
        if (this._logCatSpawn) {
            var logCatSpawn = this._logCatSpawn;
            this._logCatSpawn = null;
            logCatSpawn.spawnedProcess.kill();
        }
    };
    LogCatMonitor.prototype.getLogCatArguments = function () {
        // We use the setting if it's defined, or the defaults if it's not
        return this.isNullOrUndefined(this._userProvidedLogCatArguments) // "" is a valid value, so we can't just if () this
            ? LogCatMonitor.DEFAULT_PARAMETERS
            : ("" + this._userProvidedLogCatArguments).split(" "); // Parse string and split into string[]
    };
    LogCatMonitor.prototype.isNullOrUndefined = function (value) {
        return typeof value === "undefined" || value === null;
    };
    LogCatMonitor.DEFAULT_PARAMETERS = ["*:S", "ReactNative:V", "ReactNativeJS:V"];
    return LogCatMonitor;
}());
exports.LogCatMonitor = LogCatMonitor;

//# sourceMappingURL=logCatMonitor.js.map
