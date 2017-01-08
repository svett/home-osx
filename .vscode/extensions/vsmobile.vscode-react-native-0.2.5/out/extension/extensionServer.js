// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var net = require("net");
var Q = require("q");
var vscode = require("vscode");
var em = require("../common/extensionMessaging");
var log_1 = require("../common/log/log");
var logHelper_1 = require("../common/log/logHelper");
var packager_1 = require("../common/packager");
var packagerStatusIndicator_1 = require("./packagerStatusIndicator");
var logCatMonitor_1 = require("./android/logCatMonitor");
var fileSystem_1 = require("../common/node/fileSystem");
var configurationReader_1 = require("../common/configurationReader");
var settingsHelper_1 = require("./settingsHelper");
var telemetry_1 = require("../common/telemetry");
var ExtensionServer = (function () {
    function ExtensionServer(projectRootPath, reactNativePackager, packagerStatusIndicator, exponentHelper) {
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
    ExtensionServer.prototype.setup = function () {
        var _this = this;
        var deferred = Q.defer();
        var launchCallback = function (error) {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "Extension messaging server started at " + _this.pipePath + ".");
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
    };
    /**
     * Stops the server.
     */
    ExtensionServer.prototype.dispose = function () {
        if (this.serverInstance) {
            this.serverInstance.close();
            this.serverInstance = null;
        }
        this.stopMonitoringLogCat();
    };
    /**
     * Message handler for GET_PACKAGER_PORT.
     */
    ExtensionServer.prototype.getPackagerPort = function () {
        return Q(settingsHelper_1.SettingsHelper.getPackagerPort());
    };
    /**
     * Message handler for START_PACKAGER.
     */
    ExtensionServer.prototype.startPackager = function (port) {
        var _this = this;
        return this.reactNativePackager.isRunning().then(function (running) {
            if (running) {
                if (_this.reactNativePackager.getRunningAs() !== packager_1.PackagerRunAs.REACT_NATIVE) {
                    return _this.reactNativePackager.stop().then(function () {
                        return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED);
                    });
                }
                log_1.Log.logMessage("Attaching to running React Native packager");
            }
        }).then(function () {
            return _this.exponentHelper.configureReactNativeEnvironment();
        }).then(function () {
            var portToUse = configurationReader_1.ConfigurationReader.readIntWithDefaultSync(port, settingsHelper_1.SettingsHelper.getPackagerPort());
            return _this.reactNativePackager.startAsReactNative(portToUse);
        })
            .then(function () {
            return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED);
        });
    };
    /**
     * Message handler for START_EXPONENT_PACKAGER.
     */
    ExtensionServer.prototype.startExponentPackager = function (port) {
        var _this = this;
        return this.reactNativePackager.isRunning().then(function (running) {
            if (running) {
                if (_this.reactNativePackager.getRunningAs() !== packager_1.PackagerRunAs.EXPONENT) {
                    return _this.reactNativePackager.stop().then(function () {
                        return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED);
                    });
                }
                log_1.Log.logMessage("Attaching to running Exponent packager");
            }
        }).then(function () {
            return _this.exponentHelper.configureExponentEnvironment();
        }).then(function () {
            return _this.exponentHelper.loginToExponent(function (message, password) { return Q(vscode.window.showInputBox({ placeHolder: message, password: password })); }, function (message) { return Q(vscode.window.showInformationMessage(message)); });
        })
            .then(function () {
            var portToUse = configurationReader_1.ConfigurationReader.readIntWithDefaultSync(port, settingsHelper_1.SettingsHelper.getPackagerPort());
            return _this.reactNativePackager.startAsExponent(portToUse);
        })
            .then(function (exponentUrl) {
            _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.EXPONENT_PACKAGER_STARTED);
            return exponentUrl;
        });
    };
    /**
     * Message handler for STOP_PACKAGER.
     */
    ExtensionServer.prototype.stopPackager = function () {
        var _this = this;
        return this.reactNativePackager.stop()
            .then(function () { return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STOPPED); });
    };
    /**
     * Message handler for RESTART_PACKAGER.
     */
    ExtensionServer.prototype.restartPackager = function (port) {
        var _this = this;
        var portToUse = configurationReader_1.ConfigurationReader.readIntWithDefaultSync(port, settingsHelper_1.SettingsHelper.getPackagerPort());
        return this.reactNativePackager.restart(portToUse)
            .then(function () {
            return _this.reactNativePackageStatusIndicator.updatePackagerStatus(packagerStatusIndicator_1.PackagerStatus.PACKAGER_STARTED);
        });
    };
    /**
     * Message handler for PREWARM_BUNDLE_CACHE.
     */
    ExtensionServer.prototype.prewarmBundleCache = function (platform) {
        return this.reactNativePackager.prewarmBundleCache(platform);
    };
    /**
     * Message handler for START_MONITORING_LOGCAT.
     */
    ExtensionServer.prototype.startMonitoringLogCat = function (deviceId, logCatArguments) {
        this.stopMonitoringLogCat(); // Stop previous logcat monitor if it's running
        // this.logCatMonitor can be mutated, so we store it locally too
        var logCatMonitor = this.logCatMonitor = new logCatMonitor_1.LogCatMonitor(deviceId, logCatArguments);
        logCatMonitor.start() // The LogCat will continue running forever, so we don't wait for it
            .catch(function (error) {
            return log_1.Log.logWarning("Error while monitoring LogCat", error);
        })
            .done();
        return Q.resolve(void 0);
    };
    /**
     * Message handler for OPEN_FILE_AT_LOCATION
     */
    ExtensionServer.prototype.openFileAtLocation = function (filename, lineNumber) {
        return Q(vscode.workspace.openTextDocument(vscode.Uri.file(filename)).then(function (document) {
            return vscode.window.showTextDocument(document).then(function (editor) {
                var range = editor.document.lineAt(lineNumber - 1).range;
                editor.selection = new vscode.Selection(range.start, range.end);
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            });
        }));
    };
    ExtensionServer.prototype.stopMonitoringLogCat = function () {
        if (this.logCatMonitor) {
            this.logCatMonitor.dispose();
            this.logCatMonitor = null;
        }
        return Q.resolve(void 0);
    };
    /**
     * Sends telemetry
     */
    ExtensionServer.prototype.sendTelemetry = function (extensionId, extensionVersion, appInsightsKey, eventName, properties, measures) {
        telemetry_1.Telemetry.sendExtensionTelemetry(extensionId, extensionVersion, appInsightsKey, eventName, properties, measures);
        return Q.resolve({});
    };
    /**
     * Extension message handler.
     */
    ExtensionServer.prototype.handleExtensionMessage = function (messageWithArgs) {
        var handler = this.messageHandlerDictionary[messageWithArgs.message];
        if (handler) {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "Handling message: " + em.ExtensionMessage[messageWithArgs.message]);
            return handler.apply(this, messageWithArgs.args);
        }
        else {
            return Q.reject("Invalid message: " + messageWithArgs.message);
        }
    };
    /**
     * Handles connections to the server.
     */
    ExtensionServer.prototype.handleSocket = function (socket) {
        var _this = this;
        var handleError = function (e) {
            log_1.Log.logError(e);
            socket.end(em.ErrorMarker);
        };
        var dataCallback = function (data) {
            try {
                var messageWithArgs = JSON.parse(data);
                _this.handleExtensionMessage(messageWithArgs)
                    .then(function (result) {
                    socket.end(JSON.stringify(result));
                })
                    .catch(function (e) { handleError(e); })
                    .done();
            }
            catch (e) {
                handleError(e);
            }
        };
        socket.on("data", dataCallback);
    };
    ;
    /**
     * Recovers the server in case the named socket we use already exists, but no other instance of VSCode is active.
     */
    ExtensionServer.prototype.recoverServer = function (error) {
        var _this = this;
        var errorHandler = function (e) {
            /* The named socket is not used. */
            if (e.code === "ECONNREFUSED") {
                new fileSystem_1.FileSystem().removePathRecursivelyAsync(_this.pipePath)
                    .then(function () {
                    _this.serverInstance.listen(_this.pipePath);
                })
                    .done();
            }
        };
        /* The named socket already exists. */
        if (error.code === "EADDRINUSE") {
            var clientSocket_1 = new net.Socket();
            clientSocket_1.on("error", errorHandler);
            clientSocket_1.connect(this.pipePath, function () {
                clientSocket_1.end();
            });
        }
    };
    /**
     * Message handler for SHOW_INFORMATION_MESSAGE
     */
    ExtensionServer.prototype.showInformationMessage = function (message) {
        return Q(vscode.window.showInformationMessage(message)).then(function () { });
    };
    return ExtensionServer;
}());
exports.ExtensionServer = ExtensionServer;

//# sourceMappingURL=extensionServer.js.map
