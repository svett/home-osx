// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
/**
 * Helper for the log utility.
 */
var util = require("util");
var internalError_1 = require("../error/internalError");
(function (LogLevel) {
    LogLevel[LogLevel["None"] = 0] = "None";
    LogLevel[LogLevel["Error"] = 1] = "Error";
    LogLevel[LogLevel["Warning"] = 2] = "Warning";
    LogLevel[LogLevel["Info"] = 3] = "Info";
    LogLevel[LogLevel["Debug"] = 4] = "Debug";
    LogLevel[LogLevel["Trace"] = 5] = "Trace";
})(exports.LogLevel || (exports.LogLevel = {}));
var LogLevel = exports.LogLevel;
var LogHelper = (function () {
    function LogHelper() {
    }
    Object.defineProperty(LogHelper, "logLevel", {
        get: function () {
            var valName = process.env[LogHelper.LOG_LEVEL_NAME];
            if (typeof (valName) === "undefined") {
                valName = "None"; // Set the default LogLevel to LogLevel.None
            }
            return LogLevel[valName];
        },
        set: function (level) {
            if (!level) {
                return;
            }
            // Set the process env value
            process.env[LogHelper.LOG_LEVEL_NAME] = LogLevel[level];
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Gets the message of a non null error, if any. Otherwise it returns the empty string.
     */
    LogHelper.getErrorString = function (e) {
        if (e.isInternalError) {
            var errorMessage = e.message;
            var errorMessagePrefix = LogHelper.getErrorMessagePrefix(e);
            return errorMessagePrefix + " " + errorMessage;
        }
        else {
            var message = e.message || e.error && e.error.message;
            if (!message) {
                try {
                    return JSON.stringify(e);
                }
                catch (exception) {
                    // This is a best-effort feature, so we ignore any exceptions. If possible we'll print the error stringified.
                    // If not, we'll just use one of the fallbacks
                    return e.error || e.toString() || "";
                }
            }
            else {
                return message;
            }
        }
    };
    LogHelper.getErrorMessagePrefix = function (error) {
        if (!error) {
            return "";
        }
        switch (error.errorLevel) {
            case internalError_1.InternalErrorLevel.Error:
                // Encode the error code to a four-char code - ex, 0198
                var errorCodeString = (LogHelper.ERROR_CODE_WIDTH + error.errorCode).slice(-LogHelper.ERROR_CODE_WIDTH.length);
                return util.format(LogHelper.ERROR_TAG_FORMATSTRING, errorCodeString);
            case internalError_1.InternalErrorLevel.Warning:
                return "" + LogHelper.WARN_TAG;
            default:
                return "" + LogHelper.WARN_TAG;
        }
    };
    LogHelper.MESSAGE_TAG = "[vscode-react-native]";
    LogHelper.INTERNAL_TAG = "[Internal]";
    LogHelper.ERROR_TAG_FORMATSTRING = "[Error : %s] ";
    LogHelper.ERROR_TAG = "[Error]";
    LogHelper.WARN_TAG = "[Warning]";
    LogHelper.ERROR_CODE_WIDTH = "0000";
    LogHelper.LOG_LEVEL_NAME = "RN_LOG_LEVEL";
    return LogHelper;
}());
exports.LogHelper = LogHelper;

//# sourceMappingURL=logHelper.js.map
