// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var hostPlatform_1 = require("./hostPlatform");
var crypto_1 = require("./node/crypto");
/**
 * Defines the messages sent to the extension.
 * Add new messages to this enum.
 */
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
})(exports.ExtensionMessage || (exports.ExtensionMessage = {}));
var ExtensionMessage = exports.ExtensionMessage;
exports.ErrorMarker = "vscodereactnative-error-marker";
var MessagingChannel = (function () {
    function MessagingChannel(projectRootPath) {
        this.projectRootPath = projectRootPath;
        // Nothing needed here
    }
    MessagingChannel.prototype.getPath = function () {
        /* We need to use a different value for each VS Code window so the pipe names won't clash.
           We create the pipe path hashing the user id + project root path so both client and server
           will generate the same path, yet it's unique for each vs code instance */
        var userID = hostPlatform_1.HostPlatform.getUserID();
        var normalizedRootPath = this.projectRootPath.toLowerCase();
        var uniqueSeed = userID + ":" + normalizedRootPath;
        var hash = new crypto_1.Crypto().hash(uniqueSeed);
        return hostPlatform_1.HostPlatform.getPipePath("vscode-reactnative-" + hash);
    };
    return MessagingChannel;
}());
exports.MessagingChannel = MessagingChannel;

//# sourceMappingURL=extensionMessaging.js.map
