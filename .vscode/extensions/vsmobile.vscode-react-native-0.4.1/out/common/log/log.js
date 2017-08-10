// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Logging utility class.
 */
const commandExecutor_1 = require("../commandExecutor");
const logHelper_1 = require("./logHelper");
const loggers_1 = require("./loggers");
var Log;
(function (Log) {
    /**
     * The global logger defaults to the Console logger.
     */
    let globalLogger = new loggers_1.ConsoleLogger();
    /**
     * Sets the global logger.
     */
    function SetGlobalLogger(logger) {
        globalLogger = logger;
    }
    Log.SetGlobalLogger = SetGlobalLogger;
    /**
     * Logs a message.
     */
    function logMessage(message, formatMessage = true) {
        globalLogger.logMessage(message, formatMessage);
    }
    Log.logMessage = logMessage;
    /**
     * Logs an error message.
     */
    function logError(error, logStack = true) {
        let errorMessageToLog = logHelper_1.LogHelper.getErrorString(error);
        globalLogger.logError(errorMessageToLog, error, logStack);
    }
    Log.logError = logError;
    /**
     * Logs a warning message.
     */
    function logWarning(error, logStack = true) {
        Log.logError(error, logStack);
    }
    Log.logWarning = logWarning;
    /**
     * Logs an internal message for when someone is debugging the extension itself.
     * Customers aren't interested in these messages, so we normally shouldn't show
     * them to them.
     */
    function logInternalMessage(logLevel, message) {
        if (logHelper_1.LogHelper.logLevel >= logLevel) {
            globalLogger.logInternalMessage(logLevel, message);
        }
    }
    Log.logInternalMessage = logInternalMessage;
    /**
     * Logs the status (Start/End) of a command.
     */
    function logCommandStatus(command, status) {
        console.assert(status >= commandExecutor_1.CommandStatus.Start && status <= commandExecutor_1.CommandStatus.End, "Unsupported Command Status");
        let statusMessage = Log.getCommandStatusString(command, status);
        globalLogger.logMessage(statusMessage);
    }
    Log.logCommandStatus = logCommandStatus;
    /**
     * Logs a stream data buffer.
     */
    function logStreamData(data, stream) {
        globalLogger.logStreamData(data, stream);
    }
    Log.logStreamData = logStreamData;
    /**
     * Logs string
     */
    function logString(data) {
        globalLogger.logString(data);
    }
    Log.logString = logString;
    /**
     * Brings the target output window to focus.
     */
    function setFocusOnLogChannel() {
        globalLogger.setFocusOnLogChannel();
    }
    Log.setFocusOnLogChannel = setFocusOnLogChannel;
    /**
     * Logs a message to the console.
     */
    function logWithLogger(logger, message, formatMessage) {
        logger.logMessage(message, formatMessage);
    }
    Log.logWithLogger = logWithLogger;
    /**
     * Logs a message to the console.
     */
    function logToStderr(message, formatMessage = true) {
        new loggers_1.StreamLogger(process.stderr).logMessage(message, formatMessage);
    }
    Log.logToStderr = logToStderr;
    /**
     * Logs a message to the console.
     */
    function logToStdout(message, formatMessage = true) {
        new loggers_1.StreamLogger(process.stdout).logMessage(message, formatMessage);
    }
    Log.logToStdout = logToStdout;
    function getCommandStatusString(command, status) {
        console.assert(status >= commandExecutor_1.CommandStatus.Start && status <= commandExecutor_1.CommandStatus.End, "Unsupported Command Status");
        switch (status) {
            case commandExecutor_1.CommandStatus.Start:
                return `Executing command: ${command}`;
            case commandExecutor_1.CommandStatus.End:
                return `Finished executing: ${command}`;
            default:
                throw new Error("Unsupported command status");
        }
    }
    Log.getCommandStatusString = getCommandStatusString;
})(Log = exports.Log || (exports.Log = {}));

//# sourceMappingURL=log.js.map
