// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var assert = require("assert");
var net = require("net");
var Q = require("q");
var log_1 = require("./log/log");
var logHelper_1 = require("./log/logHelper");
var errorHelper_1 = require("./error/errorHelper");
var internalErrorCode_1 = require("./error/internalErrorCode");
var extensionMessaging_1 = require("./extensionMessaging");
// TODO: Refactor this class to make ExtensionMessage a generic parameter instead
/**
 * Sends messages to the extension.
 */
var InterProcessMessageSender = (function () {
    function InterProcessMessageSender(serverPath) {
        this.serverPath = serverPath;
        assert(this.serverPath, "serverPath shouldn't be null");
    }
    InterProcessMessageSender.prototype.sendMessage = function (message, args) {
        var _this = this;
        var deferred = Q.defer();
        var messageWithArguments = { message: message, args: args };
        var body = "";
        var socket = net.connect(this.serverPath, function () {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "Connected to socket at " + _this.serverPath);
            var messageJson = JSON.stringify(messageWithArguments);
            socket.write(messageJson);
        });
        socket.on("data", function (data) {
            body += data;
        });
        var failPromise = function (reason) {
            if (reason) {
                if (reason.code === "ENOENT") {
                    deferred.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ErrorNoPipeFound));
                }
                else {
                    deferred.reject(errorHelper_1.ErrorHelper.getNestedError(reason, internalErrorCode_1.InternalErrorCode.ErrorWhileProcessingMessageInIPMSServer, extensionMessaging_1.ExtensionMessage[message]));
                }
            }
            else {
                deferred.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ErrorWhileProcessingMessageInIPMSServer, extensionMessaging_1.ExtensionMessage[message]));
            }
        };
        socket.on("error", function (reason) {
            failPromise(reason);
        });
        socket.on("end", function () {
            try {
                if (body === extensionMessaging_1.ErrorMarker) {
                    failPromise();
                }
                else {
                    var responseBody = body ? JSON.parse(body) : null;
                    deferred.resolve(responseBody);
                }
            }
            catch (e) {
                deferred.reject(e);
            }
        });
        return deferred.promise;
    };
    return InterProcessMessageSender;
}());
exports.InterProcessMessageSender = InterProcessMessageSender;

//# sourceMappingURL=interProcessMessageSender.js.map
