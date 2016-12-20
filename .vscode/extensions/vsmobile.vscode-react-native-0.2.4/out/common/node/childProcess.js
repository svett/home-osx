// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var nodeChildProcess = require("child_process");
var Q = require("q");
var errorHelper_1 = require("../error/errorHelper");
var internalErrorCode_1 = require("../error/internalErrorCode");
var ChildProcess = (function () {
    function ChildProcess(_a) {
        var _b = (_a === void 0 ? {} : _a).childProcess, childProcess = _b === void 0 ? nodeChildProcess : _b;
        this.childProcess = childProcess;
    }
    ChildProcess.prototype.exec = function (command, options) {
        if (options === void 0) { options = {}; }
        var outcome = Q.defer();
        var execProcess = this.childProcess.exec(command, options, function (error, stdout, stderr) {
            if (error) {
                outcome.reject(errorHelper_1.ErrorHelper.getNestedError(error, internalErrorCode_1.InternalErrorCode.CommandFailed, command));
            }
            else {
                outcome.resolve(stdout);
            }
        });
        return { process: execProcess, outcome: outcome.promise };
    };
    ChildProcess.prototype.execToString = function (command, options) {
        if (options === void 0) { options = {}; }
        return this.exec(command, options).outcome.then(function (stdout) { return stdout.toString(); });
    };
    ChildProcess.prototype.spawn = function (command, args, options) {
        if (args === void 0) { args = []; }
        if (options === void 0) { options = {}; }
        var startup = Q.defer();
        var outcome = Q.defer();
        var spawnedProcess = this.childProcess.spawn(command, args, options);
        spawnedProcess.once("error", function (error) {
            startup.reject(error);
            outcome.reject(error);
        });
        Q.delay(ChildProcess.ERROR_TIMEOUT_MILLISECONDS).done(function () {
            return startup.resolve(void 0);
        });
        startup.promise.done(function () { }, function () { }); // Most callers don't use startup, and Q prints a warning if we don't attach any .done()
        spawnedProcess.once("exit", function (code) {
            if (code === 0) {
                outcome.resolve(void 0);
            }
            else {
                var commandWithArgs = command + " " + args.join(" ");
                outcome.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.CommandFailed, commandWithArgs, code));
            }
        });
        return {
            spawnedProcess: spawnedProcess,
            stdin: spawnedProcess.stdin,
            stdout: spawnedProcess.stdout,
            stderr: spawnedProcess.stderr,
            startup: startup.promise,
            outcome: outcome.promise,
        };
    };
    ChildProcess.ERROR_TIMEOUT_MILLISECONDS = 300;
    return ChildProcess;
}());
exports.ChildProcess = ChildProcess;

//# sourceMappingURL=childProcess.js.map
