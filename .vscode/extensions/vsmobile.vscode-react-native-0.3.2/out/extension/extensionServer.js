// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const Q = require("q");
const vscode = require("vscode");
const em = require("../common/extensionMessaging");
const log_1 = require("../common/log/log");
const logHelper_1 = require("../common/log/logHelper");
const packager_1 = require("../common/packager");
const packagerStatusIndicator_1 = require("./packagerStatusIndicator");
const logCatMonitor_1 = require("./android/logCatMonitor");
const fileSystem_1 = require("../common/node/fileSystem");
const configurationReader_1 = require("../common/configurationReader");
const settingsHelper_1 = require("./settingsHelper");
const telemetry_1 = require("../common/telemetry");
class ExtensionServer {
    constructor(projectRootPath, reactNativePackager, packagerStatusIndicator, exponentHelper) {
        this.serverInstance = null;
        this.messageHandlerDictionary = {};
        this.logCatMonitor = null;
        this.pipePath = new em.MessagingChannel(projectRootPath).getPath();
        this.reactNativePackager = reactNativePackager;
        this.reactNativePackageStatusIndicator = packagerStatusIndicator;
        this.exponentHelper = exponentHelper;
        /* register handlers for all messages */
        this.messageHandlerDictionary[em.ExtensionMessage.START_PACKAGER] = this.startPackager;
        this.messageHandlerDictionary[em.ExtensionMessage.STOP_PACKAGER] = this.stopPackager;
        this.messageHandlerDictionary[em.ExtensionMessage.RESTART_PACKAGER] = this.restartPackager;
        this.messageHandlerDictionary[em.ExtensionMessage.PREWARM_BUNDLE_CACHE] = this.prewarmBundleCache;
        this.messageHandlerDictionary[em.ExtensionMessage.START_MONITORING_LOGCAT] = this.startMonitoringLogCat;
        this.messageHandlerDictionary[em.ExtensionMessage.STOP_MONITORING_LOGCAT] = this.stopMonitoringLogCat;
        this.messageHandlerDictionary[em.ExtensionMessage.GET_PACKAGER_PORT] = this.getPackagerPort;
        this.messageHandlerDictionary[em.ExtensionMessage.SEND_TELEMETRY] = this.sendTelemetry;
        this.messageHandlerDictionary[em.ExtensionMessage.OPEN_FILE_AT_LOCATION] = this.openFileAtLocation;
        this.messageHandlerDictionary[em.ExtensionMessage.START_EXPONENT_PACKAGER] = this.startExponentPackager;
        this.messageHandlerDictionary[em.ExtensionMessage.SHOW_INFORMATION_MESSAGE] = this.showInformationMessage;
    }
    /**
     * Starts the server.
     */
    setup() {
        let deferred = Q.defer();
        let launchCallback = (error) => {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, `Extension messaging server started at ${this.pipePath}.`);
            if (error) {
                deferred.reject(error);
            }
            else {
                deferred.resolve(null);
            }
        };
        this.serverInstance = net.createServer(this.handleSocket.bind(this));
        this.serverInstance.on("error", this.recoverServer.bind(this));
        this.serverInstance.listen(this.pipePath, launchCallback);
        return deferred.promise;
    }
    /**
     * Stops the server.
     */
    dispose() {
        if (this.serverInstance) {
            this.serverInstance.close();
            this.serverInstance = null;
        }
        this.stopMonitoringLogCat();
    }
    /**
     * Message handler for GET_PACKAGER_PORT.
     */
    getPackagerPort() {
        return Q(settingsHelper_1.SettingsHelper.getPackagerPort());
    }
    /**
     * Message handler for START_PACKAGER.
     */
    startPackager(port) {
        return this.reactNativePackager.isRunning().then((running) => {
            if (running) {
                if (this.reactNativePackager.getRunningAs() !== packager_1.PackagerRunAs.REACT_NATIVE) {
                    return this.reactNativePackager.stop().then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED));
                }
                log_1.Log.logMessage("Attaching to running React Native packager");
            }
        }).then(() => this.exponentHelper.configureReactNativeEnvironment()).then(() => {
            const portToUse = configurationReader_1.ConfigurationReader.readIntWithDefaultSync(port, settingsHelper_1.SettingsHelper.getPackagerPort());
            return this.reactNativePackager.startAsReactNative(portToUse);
        })
            .then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED));
    }
    /**
     * Message handler for START_EXPONENT_PACKAGER.
     */
    startExponentPackager(port) {
        return this.reactNativePackager.isRunning().then((running) => {
            if (running) {
                if (this.reactNativePackager.getRunningAs() !== packager_1.PackagerRunAs.EXPONENT) {
                    return this.reactNativePackager.stop().then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED));
                }
                log_1.Log.logMessage("Attaching to running Exponent packager");
            }
        }).then(() => this.exponentHelper.configureExponentEnvironment()).then(() => this.exponentHelper.loginToExponent((message, password) => { return Q(vscode.window.showInputBox({ placeHolder: message, password: password })); }, (message) => { return Q(vscode.window.showInformationMessage(message)); }))
            .then(() => {
            const portToUse = configurationReader_1.ConfigurationReader.readIntWithDefaultSync(port, settingsHelper_1.SettingsHelper.getPackagerPort());
            return this.reactNativePackager.startAsExponent(portToUse);
        })
            .then(exponentUrl => {
            vscode.commands.executeCommand("vscode.previewHtml", vscode.Uri.parse(exponentUrl), 1, "Expo QR code");
            this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.EXPONENT_PACKAGER_STARTED);
            return exponentUrl;
        });
    }
    /**
     * Message handler for STOP_PACKAGER.
     */
    stopPackager() {
        return this.reactNativePackager.stop()
            .then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED));
    }
    /**
     * Message handler for RESTART_PACKAGER.
     */
    restartPackager(port) {
        const portToUse = configurationReader_1.ConfigurationReader.readIntWithDefaultSync(port, settingsHelper_1.SettingsHelper.getPackagerPort());
        return this.reactNativePackager.restart(portToUse)
            .then(() => this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED));
    }
    /**
     * Message handler for PREWARM_BUNDLE_CACHE.
     */
    prewarmBundleCache(platform) {
        return this.reactNativePackager.prewarmBundleCache(platform);
    }
    /**
     * Message handler for START_MONITORING_LOGCAT.
     */
    startMonitoringLogCat(deviceId, logCatArguments) {
        this.stopMonitoringLogCat(); // Stop previous logcat monitor if it's running
        // this.logCatMonitor can be mutated, so we store it locally too
        const logCatMonitor = this.logCatMonitor = new logCatMonitor_1.LogCatMonitor(deviceId, logCatArguments);
        logCatMonitor.start() // The LogCat will continue running forever, so we don't wait for it
            .catch(error => log_1.Log.logWarning("Error while monitoring LogCat", error))
            .done();
        return Q.resolve(void 0);
    }
    /**
     * Message handler for OPEN_FILE_AT_LOCATION
     */
    openFileAtLocation(filename, lineNumber) {
        return Q(vscode.workspace.openTextDocument(vscode.Uri.file(filename)).then((document) => {
            return vscode.window.showTextDocument(document).then((editor) => {
                let range = editor.document.lineAt(lineNumber - 1).range;
                editor.selection = new vscode.Selection(range.start, range.end);
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            });
        }));
    }
    stopMonitoringLogCat() {
        if (this.logCatMonitor) {
            this.logCatMonitor.dispose();
            this.logCatMonitor = null;
        }
        return Q.resolve(void 0);
    }
    /**
     * Sends telemetry
     */
    sendTelemetry(extensionId, extensionVersion, appInsightsKey, eventName, properties, measures) {
        telemetry_1.Telemetry.sendExtensionTelemetry(extensionId, extensionVersion, appInsightsKey, eventName, properties, measures);
        return Q.resolve({});
    }
    /**
     * Extension message handler.
     */
    handleExtensionMessage(messageWithArgs) {
        let handler = this.messageHandlerDictionary[messageWithArgs.message];
        if (handler) {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "Handling message: " + em.ExtensionMessage[messageWithArgs.message]);
            return handler.apply(this, messageWithArgs.args);
        }
        else {
            return Q.reject("Invalid message: " + messageWithArgs.message);
        }
    }
    /**
     * Handles connections to the server.
     */
    handleSocket(socket) {
        let handleError = (e) => {
            log_1.Log.logError(e);
            socket.end(em.ErrorMarker);
        };
        let dataCallback = (data) => {
            try {
                let messageWithArgs = JSON.parse(data);
                this.handleExtensionMessage(messageWithArgs)
                    .then(result => {
                    socket.end(JSON.stringify(result));
                })
                    .catch((e) => { handleError(e); })
                    .done();
            }
            catch (e) {
                handleError(e);
            }
        };
        socket.on("data", dataCallback);
    }
    ;
    /**
     * Recovers the server in case the named socket we use already exists, but no other instance of VSCode is active.
     */
    recoverServer(error) {
        let errorHandler = (e) => {
            /* The named socket is not used. */
            if (e.code === "ECONNREFUSED") {
                new fileSystem_1.FileSystem().removePathRecursivelyAsync(this.pipePath)
                    .then(() => {
                    this.serverInstance.listen(this.pipePath);
                })
                    .done();
            }
        };
        /* The named socket already exists. */
        if (error.code === "EADDRINUSE") {
            let clientSocket = new net.Socket();
            clientSocket.on("error", errorHandler);
            clientSocket.connect(this.pipePath, function () {
                clientSocket.end();
            });
        }
    }
    /**
     * Message handler for SHOW_INFORMATION_MESSAGE
     */
    showInformationMessage(message) {
        return Q(vscode.window.showInformationMessage(message)).then(() => { });
    }
}
exports.ExtensionServer = ExtensionServer;

//# sourceMappingURL=extensionServer.js.map
