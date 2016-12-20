// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var logHelper_1 = require("../common/log/logHelper");
var settingsHelper_1 = require("./settingsHelper");
var vscode = require("vscode");
var DelayedOutputChannelLogger = (function () {
    function DelayedOutputChannelLogger(channelName) {
        this.channelName = channelName;
    }
    DelayedOutputChannelLogger.prototype.logInternalMessage = function (logLevel, message) {
        this.logger.logInternalMessage(logLevel, message);
    };
    DelayedOutputChannelLogger.prototype.logMessage = function (message, formatMessage) {
        if (formatMessage === void 0) { formatMessage = true; }
        this.logger.logMessage(message, formatMessage);
    };
    DelayedOutputChannelLogger.prototype.logError = function (errorMessage, error, logStack) {
        if (logStack === void 0) { logStack = true; }
        this.logger.logError(errorMessage, error, logStack);
    };
    DelayedOutputChannelLogger.prototype.logStreamData = function (data, stream) {
        this.logger.logStreamData(data, stream);
    };
    DelayedOutputChannelLogger.prototype.logString = function (data) {
        this.logger.logString(data);
    };
    DelayedOutputChannelLogger.prototype.setFocusOnLogChannel = function () {
        this.logger.setFocusOnLogChannel();
    };
    Object.defineProperty(DelayedOutputChannelLogger.prototype, "logger", {
        get: function () {
            if (!this.outputChannelLogger) {
                this.outputChannelLogger = new OutputChannelLogger(vscode.window.createOutputChannel(this.channelName));
            }
            return this.outputChannelLogger;
        },
        enumerable: true,
        configurable: true
    });
    return DelayedOutputChannelLogger;
}());
exports.DelayedOutputChannelLogger = DelayedOutputChannelLogger;
var OutputChannelLogger = (function () {
    function OutputChannelLogger(outputChannel) {
        this.outputChannel = outputChannel;
        this.outputChannel.show();
    }
    OutputChannelLogger.prototype.logInternalMessage = function (logLevel, message) {
        if (settingsHelper_1.SettingsHelper.getShowInternalLogs()) {
            this.logMessage(this.getFormattedInternalMessage(logLevel, message));
            return;
        }
        console.log(this.getFormattedInternalMessage(logLevel, message));
    };
    OutputChannelLogger.prototype.logMessage = function (message, formatMessage) {
        if (formatMessage === void 0) { formatMessage = true; }
        this.outputChannel.appendLine(formatMessage ?
            this.getFormattedMessage(message) :
            message);
    };
    OutputChannelLogger.prototype.logError = function (errorMessage, error, logStack) {
        if (logStack === void 0) { logStack = true; }
        this.logMessage(errorMessage, /* formatMessage */ false);
    };
    OutputChannelLogger.prototype.logStreamData = function (data, stream) {
        this.outputChannel.append(data.toString());
    };
    OutputChannelLogger.prototype.logString = function (data) {
        this.outputChannel.append(data);
    };
    OutputChannelLogger.prototype.setFocusOnLogChannel = function () {
        this.outputChannel.show();
    };
    OutputChannelLogger.prototype.getFormattedMessage = function (message) {
        return "######### " + message + " ##########";
    };
    OutputChannelLogger.prototype.getFormattedInternalMessage = function (logLevel, message) {
        return (logHelper_1.LogHelper.INTERNAL_TAG + " [" + logHelper_1.LogLevel[logLevel] + "] " + message);
    };
    return OutputChannelLogger;
}());
exports.OutputChannelLogger = OutputChannelLogger;

//# sourceMappingURL=outputChannelLogger.js.map
