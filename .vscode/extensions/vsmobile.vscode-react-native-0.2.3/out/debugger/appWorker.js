// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var vm = require("vm");
var Q = require("q");
var path = require("path");
var WebSocket = require("ws");
var scriptImporter_1 = require("./scriptImporter");
var packager_1 = require("../common/packager");
var errorHelper_1 = require("../common/error/errorHelper");
var log_1 = require("../common/log/log");
var logHelper_1 = require("../common/log/logHelper");
var fileSystem_1 = require("../common/node/fileSystem");
var executionsLimiter_1 = require("../common/executionsLimiter");
var Module = require("module");
function printDebuggingError(message, reason) {
    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getNestedWarning(reason, message + ". Debugging won't work: Try reloading the JS from inside the app, or Reconnect the VS Code debugger"));
}
var SandboxedAppWorker = (function () {
    function SandboxedAppWorker(packagerPort, sourcesStoragePath, debugAdapterPort, postReplyToApp, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.nodeFileSystem, nodeFileSystem = _c === void 0 ? new fileSystem_1.FileSystem() : _c, _d = _b.scriptImporter, scriptImporter = _d === void 0 ? new scriptImporter_1.ScriptImporter(packagerPort, sourcesStoragePath) : _d;
        this.pendingScriptImport = Q(void 0);
        this.packagerPort = packagerPort;
        this.sourcesStoragePath = sourcesStoragePath;
        this.debugAdapterPort = debugAdapterPort;
        this.postReplyToApp = postReplyToApp;
        this.scriptToReceiveMessageInSandbox = new vm.Script(SandboxedAppWorker.PROCESS_MESSAGE_INSIDE_SANDBOX);
        this.nodeFileSystem = nodeFileSystem;
        this.scriptImporter = scriptImporter;
    }
    SandboxedAppWorker.prototype.start = function () {
        var _this = this;
        // This is a temporary fix for https://github.com/Microsoft/vscode-react-native/issues/340
        // We need to disable lazy loading for regeneratorRuntime module to avoid infinite recursion
        var definePropertyInterceptor = "(" + function () {
            var definePropOriginal = Object.defineProperty;
            Object.defineProperty = function (object, name, desc) {
                if (name !== "regeneratorRuntime") {
                    // Behave as usual - as of now we only interested in workaround for regeneratorRuntime
                    return definePropOriginal(object, name, desc);
                }
                // Patch property descriptor - use static property rather than dynamic
                // getter to disable react's lazy-loading for regenerator
                return definePropOriginal(object, name, {
                    enumerable: desc.enumerable,
                    writable: desc.writable,
                    value: desc.get ? desc.get() : desc.value,
                });
            };
        }.toString() + ")()";
        var scriptToRunPath = require.resolve(path.join(this.sourcesStoragePath, scriptImporter_1.ScriptImporter.DEBUGGER_WORKER_FILE_BASENAME));
        this.initializeSandboxAndContext(scriptToRunPath);
        return Q.when()
            .then(function () { return _this.runInSandbox("definePropertyInterceptor.js", definePropertyInterceptor); })
            .then(function () { return _this.readFileContents(scriptToRunPath); })
            .then(function (fileContents) {
            // On a debugger worker the onmessage variable already exist. We need to declare it before the
            // javascript file can assign it. We do it in the first line without a new line to not break
            // the debugging experience of debugging debuggerWorker.js itself (as part of the extension)
            return _this.runInSandbox(scriptToRunPath, "var onmessage = null; " + fileContents);
        });
    };
    SandboxedAppWorker.prototype.postMessage = function (object) {
        this.sandbox.postMessageArgument = object;
        this.scriptToReceiveMessageInSandbox.runInContext(this.sandboxContext);
    };
    SandboxedAppWorker.prototype.initializeSandboxAndContext = function (scriptToRunPath) {
        var _this = this;
        var scriptToRunModule = new Module(scriptToRunPath);
        scriptToRunModule.paths = Module._nodeModulePaths(path.dirname(scriptToRunPath));
        // In order for __debug_.require("aNonInternalPackage") to work, we need to initialize where
        // node searches for packages. We invoke the same method that node does:
        // https://github.com/nodejs/node/blob/de1dc0ae2eb52842b5c5c974090123a64c3a594c/lib/module.js#L452
        this.sandbox = {
            __debug__: {
                require: function (filePath) { return scriptToRunModule.require(filePath); },
            },
            __filename: scriptToRunPath,
            __dirname: path.dirname(scriptToRunPath),
            self: null,
            console: console,
            require: function (filePath) { return scriptToRunModule.require(filePath); },
            importScripts: function (url) { return _this.importScripts(url); },
            postMessage: function (object) { return _this.gotResponseFromDebuggerWorker(object); },
            onmessage: null,
            postMessageArgument: null,
        };
        this.sandbox.self = this.sandbox;
        this.sandboxContext = vm.createContext(this.sandbox);
    };
    SandboxedAppWorker.prototype.runInSandbox = function (filename, fileContents) {
        var _this = this;
        var fileContentsPromise = fileContents
            ? Q(fileContents)
            : this.readFileContents(filename);
        return fileContentsPromise.then(function (contents) {
            vm.runInContext(contents, _this.sandboxContext, filename);
        });
    };
    SandboxedAppWorker.prototype.readFileContents = function (filename) {
        return this.nodeFileSystem.readFile(filename).then(function (contents) { return contents.toString(); });
    };
    SandboxedAppWorker.prototype.importScripts = function (url) {
        var _this = this;
        /* The debuggerWorker.js executes this code:
            importScripts(message.url);
            sendReply();

            In the original code importScripts is a sync call. In our code it's async, so we need to mess with sendReply() so we won't
            actually send the reply back to the application until after importScripts has finished executing. We use
            this.pendingScriptImport to make the gotResponseFromDebuggerWorker() method hold the reply back, until've finished importing
            and running the script */
        var defer = Q.defer();
        this.pendingScriptImport = defer.promise;
        // The next line converts to any due to the incorrect typing on node.d.ts of vm.runInThisContext
        this.scriptImporter.downloadAppScript(url, this.debugAdapterPort)
            .then(function (downloadedScript) {
            return _this.runInSandbox(downloadedScript.filepath, downloadedScript.contents);
        })
            .done(function () {
            // Now we let the reply to the app proceed
            defer.resolve({});
        }, function (reason) {
            printDebuggingError("Couldn't import script at <" + url + ">", reason);
        });
    };
    SandboxedAppWorker.prototype.gotResponseFromDebuggerWorker = function (object) {
        var _this = this;
        // We might need to hold the response until a script is imported. See comments on this.importScripts()
        this.pendingScriptImport.done(function () {
            return _this.postReplyToApp(object);
        }, function (reason) {
            printDebuggingError("Unexpected internal error while processing a message from the RN App.", reason);
        });
    };
    SandboxedAppWorker.PROCESS_MESSAGE_INSIDE_SANDBOX = "onmessage({ data: postMessageArgument });";
    return SandboxedAppWorker;
}());
exports.SandboxedAppWorker = SandboxedAppWorker;
var MultipleLifetimesAppWorker = (function () {
    function MultipleLifetimesAppWorker(packagerPort, sourcesStoragePath, debugAdapterPort, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.sandboxedAppConstructor, sandboxedAppConstructor = _c === void 0 ? function (path, port, messageFunc) {
            return new SandboxedAppWorker(packagerPort, path, port, messageFunc);
        } : _c, _d = _b.webSocketConstructor, webSocketConstructor = _d === void 0 ? function (url) { return new WebSocket(url); } : _d;
        this.executionLimiter = new executionsLimiter_1.ExecutionsLimiter();
        this.packagerPort = packagerPort;
        this.sourcesStoragePath = sourcesStoragePath;
        this.debugAdapterPort = debugAdapterPort;
        console.assert(!!this.sourcesStoragePath, "The sourcesStoragePath argument was null or empty");
        this.sandboxedAppConstructor = sandboxedAppConstructor;
        this.webSocketConstructor = webSocketConstructor;
    }
    MultipleLifetimesAppWorker.prototype.start = function (warnOnFailure) {
        var _this = this;
        if (warnOnFailure === void 0) { warnOnFailure = false; }
        return packager_1.Packager.isPackagerRunning(packager_1.Packager.getHostForPort(this.packagerPort))
            .then(function (running) {
            if (running) {
                return _this.createSocketToApp(warnOnFailure);
            }
            throw new Error("Cannot attach to packager. Are you sure there is a packager and it is running in the port " + _this.packagerPort + "? If your packager is configured to run in another port make sure to add that to the setting.json.");
        });
    };
    MultipleLifetimesAppWorker.prototype.startNewWorkerLifetime = function () {
        var _this = this;
        this.singleLifetimeWorker = this.sandboxedAppConstructor(this.sourcesStoragePath, this.debugAdapterPort, function (message) {
            _this.sendMessageToApp(message);
        });
        log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "A new app worker lifetime was created.");
        return this.singleLifetimeWorker.start();
    };
    MultipleLifetimesAppWorker.prototype.createSocketToApp = function (warnOnFailure) {
        var _this = this;
        if (warnOnFailure === void 0) { warnOnFailure = false; }
        var deferred = Q.defer();
        this.socketToApp = this.webSocketConstructor(this.debuggerProxyUrl());
        this.socketToApp.on("open", function () {
            _this.onSocketOpened();
        });
        this.socketToApp.on("close", function () {
            _this.executionLimiter.execute("onSocketClose.msg", /*limitInSeconds*/ 10, function () {
                /*
                 * It is not the best idea to compare with the message, but this is the only thing React Native gives that is unique when
                 * it closes the socket because it already has a connection to a debugger.
                 * https://github.com/facebook/react-native/blob/588f01e9982775f0699c7bfd56623d4ed3949810/local-cli/server/util/webSocketProxy.js#L38
                 */
                if (_this.socketToApp._closeMessage === "Another debugger is already connected") {
                    deferred.reject(new RangeError("Another debugger is already connected to packager. Please close it before trying to debug with VSCode."));
                }
                log_1.Log.logMessage("Disconnected from the Proxy (Packager) to the React Native application. Retrying reconnection soon...");
            });
            setTimeout(function () {
                _this.start(true /* retryAttempt */);
            }, 100);
        });
        this.socketToApp.on("message", function (message) { return _this.onMessage(message); });
        this.socketToApp.on("error", function (error) {
            if (warnOnFailure) {
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getNestedWarning(error, "Reconnection to the proxy (Packager) failed. Please check the output window for Packager errors, if any. If failure persists, please restart the React Native debugger."));
            }
            deferred.reject(error);
        });
        // In an attempt to catch failures in starting the packager on first attempt,
        // wait for 300 ms before resolving the promise
        Q.delay(300).done(function () { return deferred.resolve(void 0); });
        return deferred.promise;
    };
    MultipleLifetimesAppWorker.prototype.debuggerProxyUrl = function () {
        return "ws://" + packager_1.Packager.getHostForPort(this.packagerPort) + "/debugger-proxy?role=debugger&name=vscode";
    };
    MultipleLifetimesAppWorker.prototype.onSocketOpened = function () {
        this.executionLimiter.execute("onSocketOpened.msg", /*limitInSeconds*/ 10, function () {
            return log_1.Log.logMessage("Established a connection with the Proxy (Packager) to the React Native application");
        });
    };
    MultipleLifetimesAppWorker.prototype.onMessage = function (message) {
        try {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Trace, "From RN APP: " + message);
            var object = JSON.parse(message);
            if (object.method === "prepareJSRuntime") {
                // The MultipleLifetimesAppWorker will handle prepareJSRuntime aka create new lifetime
                this.gotPrepareJSRuntime(object);
            }
            else if (object.method === "$disconnected") {
                // We need to shutdown the current app worker, and create a new lifetime
                this.singleLifetimeWorker = null;
            }
            else if (object.method) {
                // All the other messages are handled by the single lifetime worker
                this.singleLifetimeWorker.postMessage(object);
            }
            else {
                // Message doesn't have a method. Ignore it. This is an info message instead of warn because it's normal and expected
                log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "The react-native app sent a message without specifying a method: " + message);
            }
        }
        catch (exception) {
            printDebuggingError("Failed to process message from the React Native app. Message:\n" + message, exception);
        }
    };
    MultipleLifetimesAppWorker.prototype.gotPrepareJSRuntime = function (message) {
        var _this = this;
        // Create the sandbox, and replay that we finished processing the message
        this.startNewWorkerLifetime().done(function () {
            _this.sendMessageToApp({ replyID: parseInt(message.id, 10) });
        }, function (error) { return printDebuggingError("Failed to prepare the JavaScript runtime environment. Message:\n" + message, error); });
    };
    MultipleLifetimesAppWorker.prototype.sendMessageToApp = function (message) {
        var stringified = null;
        try {
            stringified = JSON.stringify(message);
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Trace, "To RN APP: " + stringified);
            this.socketToApp.send(stringified);
        }
        catch (exception) {
            var messageToShow = stringified || ("" + message); // Try to show the stringified version, but show the toString if unavailable
            printDebuggingError("Failed to send message to the React Native app. Message:\n" + messageToShow, exception);
        }
    };
    return MultipleLifetimesAppWorker;
}());
exports.MultipleLifetimesAppWorker = MultipleLifetimesAppWorker;

//# sourceMappingURL=appWorker.js.map
