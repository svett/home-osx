// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extensionMessaging_1 = require("./extensionMessaging");
const interProcessMessageSender_1 = require("./interProcessMessageSender");
class RemoteExtension {
    constructor(interProcessMessageSender) {
        this.interProcessMessageSender = interProcessMessageSender;
    }
    static atProjectRootPath(projectRootPath) {
        const remoteExtensionServerPath = new extensionMessaging_1.MessagingChannel(projectRootPath).getPath();
        const interProcessMessageSender = new interProcessMessageSender_1.InterProcessMessageSender(remoteExtensionServerPath);
        return new RemoteExtension(interProcessMessageSender);
    }
    startPackager() {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.START_PACKAGER);
    }
    startExponentPackager() {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.START_EXPONENT_PACKAGER);
    }
    prewarmBundleCache(platform) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.PREWARM_BUNDLE_CACHE, [platform]);
    }
    startMonitoringLogcat(debugTarget, logCatArguments) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.START_MONITORING_LOGCAT, [debugTarget, logCatArguments]);
    }
    stopMonitoringLogcat() {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.STOP_MONITORING_LOGCAT);
    }
    sendTelemetry(extensionId, extensionVersion, appInsightsKey, eventName, properties, measures) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.SEND_TELEMETRY, [extensionId, extensionVersion, appInsightsKey, eventName, properties, measures]);
    }
    openFileAtLocation(filename, lineNumber) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.OPEN_FILE_AT_LOCATION, [filename, lineNumber]);
    }
    getPackagerPort() {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.GET_PACKAGER_PORT);
    }
    showInformationMessage(infoMessage) {
        return this.interProcessMessageSender.sendMessage(extensionMessaging_1.ExtensionMessage.SHOW_INFORMATION_MESSAGE, [infoMessage]);
    }
}
exports.RemoteExtension = RemoteExtension;

//# sourceMappingURL=remoteExtension.js.map
