// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var extensionMessaging_1 = require("./extensionMessaging");
var interProcessMessageSender_1 = require("./interProcessMessageSender");
var RemoteExtension = (function () {
    function RemoteExtension(interProcessMessageSender) {
        this.interProcessMessageSender = interProcessMessageSender;
    }
    RemoteExtension.atProjectRootPath = function (projectRootPath) {
        var remoteExtensionServerPath = new extensionMessaging_1.MessagingChannel(projectRootPath).getPath();
        var interProcessMessageSender = new interProcessMessageSender_1.InterProcessMessageSender(remoteExtensionServerPath);
        return new RemoteExtension(interProcessMessageSender);
    };
    RemoteExtension.prototype.startPackager = function () {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.START_PACKAGER);
    };
    RemoteExtension.prototype.startExponentPackager = function () {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.START_EXPONENT_PACKAGER);
    };
    RemoteExtension.prototype.prewarmBundleCache = function (platform) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.PREWARM_BUNDLE_CACHE, [platform]);
    };
    RemoteExtension.prototype.startMonitoringLogcat = function (debugTarget, logCatArguments) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.START_MONITORING_LOGCAT, [debugTarget, logCatArguments]);
    };
    RemoteExtension.prototype.stopMonitoringLogcat = function () {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.STOP_MONITORING_LOGCAT);
    };
    RemoteExtension.prototype.sendTelemetry = function (extensionId, extensionVersion, appInsightsKey, eventName, properties, measures) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.SEND_TELEMETRY, [extensionId, extensionVersion, appInsightsKey, eventName, properties, measures]);
    };
    RemoteExtension.prototype.openFileAtLocation = function (filename, lineNumber) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.OPEN_FILE_AT_LOCATION, [filename, lineNumber]);
    };
    RemoteExtension.prototype.getPackagerPort = function () {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.GET_PACKAGER_PORT);
    };
    RemoteExtension.prototype.showInformationMessage = function (infoMessage) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.SHOW_INFORMATION_MESSAGE, [infoMessage]);
    };
    return RemoteExtension;
}());
exports.RemoteExtension = RemoteExtension;

//# sourceMappingURL=remoteExtension.js.map
