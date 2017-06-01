// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hostPlatform_1 = require("./hostPlatform");
const crypto_1 = require("./node/crypto");
/**
 * Defines the messages sent to the extension.
 * Add new messages to this enum.
 */
var ExtensionMessage;
(function (ExtensionMessage) {
    ExtensionMessage[ExtensionMessage["START_PACKAGER"] = 0] = "START_PACKAGER";
    ExtensionMessage[ExtensionMessage["STOP_PACKAGER"] = 1] = "STOP_PACKAGER";
    ExtensionMessage[ExtensionMessage["RESTART_PACKAGER"] = 2] = "RESTART_PACKAGER";
    ExtensionMessage[ExtensionMessage["PREWARM_BUNDLE_CACHE"] = 3] = "PREWARM_BUNDLE_CACHE";
    ExtensionMessage[ExtensionMessage["START_MONITORING_LOGCAT"] = 4] = "START_MONITORING_LOGCAT";
    ExtensionMessage[ExtensionMessage["STOP_MONITORING_LOGCAT"] = 5] = "STOP_MONITORING_LOGCAT";
    ExtensionMessage[ExtensionMessage["GET_PACKAGER_PORT"] = 6] = "GET_PACKAGER_PORT";
    ExtensionMessage[ExtensionMessage["SEND_TELEMETRY"] = 7] = "SEND_TELEMETRY";
    ExtensionMessage[ExtensionMessage["OPEN_FILE_AT_LOCATION"] = 8] = "OPEN_FILE_AT_LOCATION";
    ExtensionMessage[ExtensionMessage["START_EXPONENT_PACKAGER"] = 9] = "START_EXPONENT_PACKAGER";
    ExtensionMessage[ExtensionMessage["SHOW_INFORMATION_MESSAGE"] = 10] = "SHOW_INFORMATION_MESSAGE";
})(ExtensionMessage = exports.ExtensionMessage || (exports.ExtensionMessage = {}));
exports.ErrorMarker = "vscodereactnative-error-marker";
class MessagingChannel {
    constructor(projectRootPath) {
        this.projectRootPath = projectRootPath;
        // Nothing needed here
    }
    getPath() {
        /* We need to use a different value for each VS Code window so the pipe names won't clash.
           We create the pipe path hashing the user id + project root path so both client and server
           will generate the same path, yet it's unique for each vs code instance */
        const userID = hostPlatform_1.HostPlatform.getUserID();
        const normalizedRootPath = this.projectRootPath.toLowerCase();
        const uniqueSeed = `${userID}:${normalizedRootPath}`;
        const hash = new crypto_1.Crypto().hash(uniqueSeed);
        return hostPlatform_1.HostPlatform.getPipePath(`vscode-reactnative-${hash}`);
    }
}
exports.MessagingChannel = MessagingChannel;

//# sourceMappingURL=extensionMessaging.js.map
