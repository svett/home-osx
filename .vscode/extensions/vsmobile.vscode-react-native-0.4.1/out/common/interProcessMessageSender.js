// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const net = require("net");
const Q = require("q");
const log_1 = require("./log/log");
const logHelper_1 = require("./log/logHelper");
const errorHelper_1 = require("./error/errorHelper");
const internalErrorCode_1 = require("./error/internalErrorCode");
const extensionMessaging_1 = require("./extensionMessaging");
// TODO: Refactor this class to make ExtensionMessage a generic parameter instead
/**
 * Sends messages to the extension.
 */
class InterProcessMessageSender {
    constructor(serverPath) {
        this.serverPath = serverPath;
        assert(this.serverPath, "serverPath shouldn't be null");
    }
    sendMessage(message, args) {
        let deferred = Q.defer();
        let messageWithArguments = { message: message, args: args };
        let body = "";
        let socket = net.connect(this.serverPath, () => {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, `Connected to socket at ${this.serverPath}`);
            let messageJson = JSON.stringify(messageWithArguments);
            socket.write(messageJson);
        });
        socket.on("data", function (data) {
            body += data;
        });
        const failPromise = (reason) => {
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
                    let responseBody = body ? JSON.parse(body) : null;
                    deferred.resolve(responseBody);
                }
            }
            catch (e) {
                deferred.reject(e);
            }
        });
        return deferred.promise;
    }
}
exports.InterProcessMessageSender = InterProcessMessageSender;

//# sourceMappingURL=interProcessMessageSender.js.map
