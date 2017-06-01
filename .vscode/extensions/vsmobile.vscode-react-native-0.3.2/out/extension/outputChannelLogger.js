// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logHelper_1 = require("../common/log/logHelper");
const settingsHelper_1 = require("./settingsHelper");
const vscode = require("vscode");
class DelayedOutputChannelLogger {
    constructor(channelName) {
        this.channelName = channelName;
    }
    logInternalMessage(logLevel, message) {
        this.logger.logInternalMessage(logLevel, message);
    }
    logMessage(message, formatMessage = true) {
        this.logger.logMessage(message, formatMessage);
    }
    logError(errorMessage, error, logStack = true) {
        this.logger.logError(errorMessage, error, logStack);
    }
    logStreamData(data, stream) {
        this.logger.logStreamData(data, stream);
    }
    logString(data) {
        this.logger.logString(data);
    }
    setFocusOnLogChannel() {
        this.logger.setFocusOnLogChannel();
    }
    get logger() {
        if (!this.outputChannelLogger) {
            this.outputChannelLogger = new OutputChannelLogger(vscode.window.createOutputChannel(this.channelName));
        }
        return this.outputChannelLogger;
    }
}
exports.DelayedOutputChannelLogger = DelayedOutputChannelLogger;
class OutputChannelLogger {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
        this.outputChannel.show();
    }
    logInternalMessage(logLevel, message) {
        if (settingsHelper_1.SettingsHelper.getShowInternalLogs()) {
            this.logMessage(this.getFormattedInternalMessage(logLevel, message));
            return;
        }
        console.log(this.getFormattedInternalMessage(logLevel, message));
    }
    logMessage(message, formatMessage = true) {
        this.outputChannel.appendLine(formatMessage ?
            this.getFormattedMessage(message) :
            message);
    }
    logError(errorMessage, error, logStack = true) {
        this.logMessage(errorMessage, /* formatMessage */ false);
    }
    logStreamData(data, stream) {
        this.outputChannel.append(data.toString());
    }
    logString(data) {
        this.outputChannel.append(data);
    }
    setFocusOnLogChannel() {
        this.outputChannel.show();
    }
    getFormattedMessage(message) {
        return `######### ${message} ##########`;
    }
    getFormattedInternalMessage(logLevel, message) {
        return (`${logHelper_1.LogHelper.INTERNAL_TAG} [${logHelper_1.LogLevel[logLevel]}] ${message}`);
    }
}
exports.OutputChannelLogger = OutputChannelLogger;

//# sourceMappingURL=outputChannelLogger.js.map
