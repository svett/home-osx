"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const log_1 = require("./log/log");
const node_1 = require("./node/node");
const hostPlatform_1 = require("./hostPlatform");
const errorHelper_1 = require("./error/errorHelper");
const internalErrorCode_1 = require("./error/internalErrorCode");
var CommandVerbosity;
(function (CommandVerbosity) {
    CommandVerbosity[CommandVerbosity["OUTPUT"] = 0] = "OUTPUT";
    CommandVerbosity[CommandVerbosity["SILENT"] = 1] = "SILENT";
    CommandVerbosity[CommandVerbosity["PROGRESS"] = 2] = "PROGRESS";
})(CommandVerbosity = exports.CommandVerbosity || (exports.CommandVerbosity = {}));
var CommandStatus;
(function (CommandStatus) {
    CommandStatus[CommandStatus["Start"] = 0] = "Start";
    CommandStatus[CommandStatus["End"] = 1] = "End";
})(CommandStatus = exports.CommandStatus || (exports.CommandStatus = {}));
class CommandExecutor {
    constructor(currentWorkingDirectory) {
        this.childProcess = new node_1.Node.ChildProcess();
        this.currentWorkingDirectory = currentWorkingDirectory || process.cwd();
    }
    execute(command, options = {}) {
        log_1.Log.logCommandStatus(command, CommandStatus.Start);
        return this.childProcess.execToString(command, { cwd: this.currentWorkingDirectory, env: options.env })
            .then(stdout => {
            log_1.Log.logMessage(stdout);
            log_1.Log.logCommandStatus(command, CommandStatus.End);
        }, (reason) => this.generateRejectionForCommand(command, reason));
    }
    /**
     * Spawns a child process with the params passed
     * This method waits until the spawned process finishes execution
     * {command} - The command to be invoked in the child process
     * {args} - Arguments to be passed to the command
     * {options} - additional options with which the child process needs to be spawned
     */
    spawn(command, args, options = {}) {
        return this.spawnChildProcess(command, args, options).outcome;
    }
    /**
     * Spawns the React Native packager in a child process.
     */
    spawnReactPackager(args, options = {}) {
        return this.spawnReactCommand("start", args, options);
    }
    /**
     * Uses the `react-native -v` command to get the version used on the project.
     * Returns null if the workspace is not a react native project
     */
    getReactNativeVersion() {
        let deferred = Q.defer();
        const reactCommand = hostPlatform_1.HostPlatform.getNpmCliCommand(CommandExecutor.ReactNativeCommand);
        let output = "";
        const result = this.childProcess.spawn(reactCommand, [CommandExecutor.ReactNativeVersionCommand], { cwd: this.currentWorkingDirectory });
        result.stdout.on("data", (data) => {
            output += data.toString();
        });
        result.stdout.on("end", () => {
            const match = output.match(/react-native: ([\d\.]+)/);
            deferred.resolve(match && match[1] || "");
        });
        return deferred.promise;
    }
    /**
     * Kills the React Native packager in a child process.
     */
    killReactPackager(packagerProcess) {
        if (packagerProcess) {
            return Q({}).then(() => {
                if (hostPlatform_1.HostPlatform.getPlatformId() === hostPlatform_1.HostPlatformId.WINDOWS) {
                    return this.childProcess.exec("taskkill /pid " + packagerProcess.pid + " /T /F").outcome;
                }
                else {
                    packagerProcess.kill();
                    return Q.resolve(void 0);
                }
            }).then(() => {
                log_1.Log.logMessage("Packager stopped");
            });
        }
        else {
            log_1.Log.logMessage("Packager not found");
            return Q.resolve(void 0);
        }
    }
    /**
     * Executes a react native command and waits for its completion.
     */
    spawnReactCommand(command, args = [], options = {}) {
        const reactCommand = hostPlatform_1.HostPlatform.getNpmCliCommand(CommandExecutor.ReactNativeCommand);
        return this.spawnChildProcess(reactCommand, [command, ...args], options);
    }
    /**
     * Spawns a child process with the params passed
     * This method has logic to do while the command is executing
     * {command} - The command to be invoked in the child process
     * {args} - Arguments to be passed to the command
     * {options} - additional options with which the child process needs to be spawned
     */
    spawnWithProgress(command, args, options = { verbosity: CommandVerbosity.OUTPUT }) {
        let deferred = Q.defer();
        const spawnOptions = Object.assign({}, { cwd: this.currentWorkingDirectory }, options);
        const commandWithArgs = command + " " + args.join(" ");
        const timeBetweenDots = 1500;
        let lastDotTime = 0;
        const printDot = () => {
            const now = Date.now();
            if (now - lastDotTime > timeBetweenDots) {
                lastDotTime = now;
                log_1.Log.logString(".");
            }
        };
        if (options.verbosity === CommandVerbosity.OUTPUT) {
            log_1.Log.logCommandStatus(commandWithArgs, CommandStatus.Start);
        }
        const result = this.childProcess.spawn(command, args, spawnOptions);
        result.stdout.on("data", (data) => {
            if (options.verbosity === CommandVerbosity.OUTPUT) {
                log_1.Log.logStreamData(data, process.stdout);
            }
            else if (options.verbosity === CommandVerbosity.PROGRESS) {
                printDot();
            }
        });
        result.stderr.on("data", (data) => {
            if (options.verbosity === CommandVerbosity.OUTPUT) {
                log_1.Log.logStreamData(data, process.stderr);
            }
            else if (options.verbosity === CommandVerbosity.PROGRESS) {
                printDot();
            }
        });
        result.outcome = result.outcome.then(() => {
            if (options.verbosity === CommandVerbosity.OUTPUT) {
                log_1.Log.logCommandStatus(commandWithArgs, CommandStatus.End);
            }
            log_1.Log.logString("\n");
            deferred.resolve(void 0);
        }, reason => {
            deferred.reject(reason);
            return this.generateRejectionForCommand(commandWithArgs, reason);
        });
        return deferred.promise;
    }
    spawnChildProcess(command, args, options = {}) {
        const spawnOptions = Object.assign({}, { cwd: this.currentWorkingDirectory }, options);
        const commandWithArgs = command + " " + args.join(" ");
        log_1.Log.logCommandStatus(commandWithArgs, CommandStatus.Start);
        const result = this.childProcess.spawn(command, args, spawnOptions);
        result.stderr.on("data", (data) => {
            log_1.Log.logStreamData(data, process.stderr);
        });
        result.stdout.on("data", (data) => {
            log_1.Log.logStreamData(data, process.stdout);
        });
        result.outcome = result.outcome.then(() => log_1.Log.logCommandStatus(commandWithArgs, CommandStatus.End), reason => this.generateRejectionForCommand(commandWithArgs, reason));
        return result;
    }
    generateRejectionForCommand(command, reason) {
        return Q.reject(errorHelper_1.ErrorHelper.getNestedError(reason, internalErrorCode_1.InternalErrorCode.CommandFailed, command));
    }
}
CommandExecutor.ReactNativeCommand = "react-native";
CommandExecutor.ReactNativeVersionCommand = "-v";
exports.CommandExecutor = CommandExecutor;

//# sourceMappingURL=commandExecutor.js.map