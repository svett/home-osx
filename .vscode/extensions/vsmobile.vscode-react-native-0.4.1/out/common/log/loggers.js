// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Formatter for the Output channel.
 */
const logHelper_1 = require("./logHelper");
class ConsoleLogger {
    logMessage(message, formatMessage = true) {
        console.log(formatMessage ?
            this.getFormattedMessage(message) :
            message);
    }
    logError(errorMessage, error, logStack = true) {
        console.error(this.getFormattedMessage(errorMessage));
        // Print the error stack if necessary
        if (logStack && error && error.stack) {
            console.error(`Stack: ${error.stack}`);
        }
    }
    logStreamData(data, stream) {
        stream.write(data.toString());
    }
    logString(data) {
        this.logMessage(data, false);
    }
    logInternalMessage(logLevel, message) {
        this.logMessage(this.getFormattedInternalMessage(logLevel, message), /* formatMessage */ false);
    }
    setFocusOnLogChannel() {
        // Do nothing - console takes focus automatically upon logging
        return;
    }
    getFormattedMessage(message) {
        return `${logHelper_1.LogHelper.MESSAGE_TAG} ${message}\n`;
    }
    getFormattedInternalMessage(logLevel, message) {
        return (`${logHelper_1.LogHelper.INTERNAL_TAG} [${logHelper_1.LogLevel[logLevel]}] ${message}\n`);
    }
}
exports.ConsoleLogger = ConsoleLogger;
class StreamLogger {
    constructor(stream) {
        this.stream = stream;
    }
    logMessage(message, formatMessage = true) {
        this.stream.write(formatMessage ?
            this.getFormattedMessage(message) :
            message);
    }
    logError(errorMessage, error, logStack = true) {
        this.logMessage(errorMessage);
        if (logStack && error && error.stack) {
            this.logMessage(`Stack: ${error.stack}`, /* formatMessage */ false);
        }
    }
    logStreamData(data, stream) {
        stream.write(data.toString());
    }
    logString(data) {
        this.logMessage(data, false);
    }
    logInternalMessage(logLevel, message) {
        this.logMessage(this.getFormattedInternalMessage(logLevel, message), /* formatMessage */ false);
    }
    getFormattedMessage(message) {
        return `${logHelper_1.LogHelper.MESSAGE_TAG} ${message}\n`;
    }
    getFormattedInternalMessage(logLevel, message) {
        return (`${logHelper_1.LogHelper.INTERNAL_TAG} [${logLevel}] ${message}\n`);
    }
    setFocusOnLogChannel() {
        // Do nothing
        return;
    }
}
exports.StreamLogger = StreamLogger;
class NodeDebugAdapterLogger {
    constructor(adapterPackage, debugSession) {
        this.debugAdapterPackage = adapterPackage;
        this.debugSession = debugSession;
    }
    logMessage(message, formatMessage = true, destination = "stdout") {
        const outputEventMessage = formatMessage ? this.getFormattedMessage(message) : message;
        this.debugSession.sendEvent(new this.debugAdapterPackage.OutputEvent(outputEventMessage, destination));
    }
    logError(errorMessage, error, logStack = true) {
        this.logMessage(`${logHelper_1.LogHelper.ERROR_TAG} ${errorMessage}\n`, false, "stderr");
        if (logStack && error && error.stack) {
            this.logMessage(`Stack: ${error.stack}`, false);
        }
    }
    logStreamData(data, stream) {
        this.logMessage(data.toString(), false);
    }
    logString(data) {
        this.logMessage(data, false);
    }
    logInternalMessage(logLevel, message) {
        this.logMessage(this.getFormattedInternalMessage(logLevel, message), false);
    }
    getFormattedMessage(message) {
        return `${logHelper_1.LogHelper.MESSAGE_TAG} ${message}\n`;
    }
    getFormattedInternalMessage(logLevel, message) {
        return (`${logHelper_1.LogHelper.INTERNAL_TAG} [${logLevel}] ${message}\n`);
    }
    setFocusOnLogChannel() {
        // Do nothing
        return;
    }
}
exports.NodeDebugAdapterLogger = NodeDebugAdapterLogger;

//# sourceMappingURL=loggers.js.map
