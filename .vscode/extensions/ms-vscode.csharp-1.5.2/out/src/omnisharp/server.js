/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var events_1 = require('events');
var child_process_1 = require('child_process');
var readline_1 = require('readline');
var launcher_1 = require('./launcher');
var options_1 = require('./options');
var logger_1 = require('../logger');
var delayTracker_1 = require('./delayTracker');
var launcher_2 = require('./launcher');
var requestQueue_1 = require('./requestQueue');
var path = require('path');
var vscode = require('vscode');
var ServerState;
(function (ServerState) {
    ServerState[ServerState["Starting"] = 0] = "Starting";
    ServerState[ServerState["Started"] = 1] = "Started";
    ServerState[ServerState["Stopped"] = 2] = "Stopped";
})(ServerState || (ServerState = {}));
var Events;
(function (Events) {
    Events.StateChanged = 'stateChanged';
    Events.StdOut = 'stdout';
    Events.StdErr = 'stderr';
    Events.Error = 'Error';
    Events.ServerError = 'ServerError';
    Events.UnresolvedDependencies = 'UnresolvedDependencies';
    Events.PackageRestoreStarted = 'PackageRestoreStarted';
    Events.PackageRestoreFinished = 'PackageRestoreFinished';
    Events.ProjectChanged = 'ProjectChanged';
    Events.ProjectAdded = 'ProjectAdded';
    Events.ProjectRemoved = 'ProjectRemoved';
    Events.MsBuildProjectDiagnostics = 'MsBuildProjectDiagnostics';
    Events.BeforeServerInstall = 'BeforeServerInstall';
    Events.BeforeServerStart = 'BeforeServerStart';
    Events.ServerStart = 'ServerStart';
    Events.ServerStop = 'ServerStop';
    Events.MultipleLaunchTargets = 'server:MultipleLaunchTargets';
    Events.Started = 'started';
})(Events || (Events = {}));
var TelemetryReportingDelay = 2 * 60 * 1000; // two minutes
var OmniSharpServer = (function () {
    function OmniSharpServer(reporter) {
        var _this = this;
        this._debugMode = false;
        this._disposables = [];
        this._telemetryIntervalId = undefined;
        this._eventBus = new events_1.EventEmitter();
        this._state = ServerState.Stopped;
        this._isDebugEnable = false;
        this._reporter = reporter;
        this._channel = vscode.window.createOutputChannel('OmniSharp Log');
        this._logger = new logger_1.Logger(function (message) { return _this._channel.append(message); });
        var logger = this._debugMode
            ? this._logger
            : new logger_1.Logger(function (message) { });
        this._requestQueue = new requestQueue_1.RequestQueueCollection(logger, 8, function (request) { return _this._makeRequest(request); });
    }
    OmniSharpServer.prototype.isRunning = function () {
        return this._state === ServerState.Started;
    };
    OmniSharpServer.prototype._getState = function () {
        return this._state;
    };
    OmniSharpServer.prototype._setState = function (value) {
        if (typeof value !== 'undefined' && value !== this._state) {
            this._state = value;
            this._fireEvent(Events.StateChanged, this._state);
        }
    };
    OmniSharpServer.prototype._recordRequestDelay = function (requestName, elapsedTime) {
        var tracker = this._delayTrackers[requestName];
        if (!tracker) {
            tracker = new delayTracker_1.DelayTracker(requestName);
            this._delayTrackers[requestName] = tracker;
        }
        tracker.reportDelay(elapsedTime);
    };
    OmniSharpServer.prototype._reportTelemetry = function () {
        var delayTrackers = this._delayTrackers;
        for (var requestName in delayTrackers) {
            var tracker = delayTrackers[requestName];
            var eventName = 'omnisharp' + requestName;
            if (tracker.hasMeasures()) {
                var measures = tracker.getMeasures();
                tracker.clearMeasures();
                this._reporter.sendTelemetryEvent(eventName, null, measures);
            }
        }
    };
    OmniSharpServer.prototype.getSolutionPathOrFolder = function () {
        return this._launchTarget
            ? this._launchTarget.target
            : undefined;
    };
    OmniSharpServer.prototype.getChannel = function () {
        return this._channel;
    };
    OmniSharpServer.prototype.isDebugEnable = function () {
        return this._isDebugEnable;
    };
    // --- eventing
    OmniSharpServer.prototype.onStdout = function (listener, thisArg) {
        return this._addListener(Events.StdOut, listener, thisArg);
    };
    OmniSharpServer.prototype.onStderr = function (listener, thisArg) {
        return this._addListener(Events.StdErr, listener, thisArg);
    };
    OmniSharpServer.prototype.onError = function (listener, thisArg) {
        return this._addListener(Events.Error, listener, thisArg);
    };
    OmniSharpServer.prototype.onServerError = function (listener, thisArg) {
        return this._addListener(Events.ServerError, listener, thisArg);
    };
    OmniSharpServer.prototype.onUnresolvedDependencies = function (listener, thisArg) {
        return this._addListener(Events.UnresolvedDependencies, listener, thisArg);
    };
    OmniSharpServer.prototype.onBeforePackageRestore = function (listener, thisArg) {
        return this._addListener(Events.PackageRestoreStarted, listener, thisArg);
    };
    OmniSharpServer.prototype.onPackageRestore = function (listener, thisArg) {
        return this._addListener(Events.PackageRestoreFinished, listener, thisArg);
    };
    OmniSharpServer.prototype.onProjectChange = function (listener, thisArg) {
        return this._addListener(Events.ProjectChanged, listener, thisArg);
    };
    OmniSharpServer.prototype.onProjectAdded = function (listener, thisArg) {
        return this._addListener(Events.ProjectAdded, listener, thisArg);
    };
    OmniSharpServer.prototype.onProjectRemoved = function (listener, thisArg) {
        return this._addListener(Events.ProjectRemoved, listener, thisArg);
    };
    OmniSharpServer.prototype.onMsBuildProjectDiagnostics = function (listener, thisArg) {
        return this._addListener(Events.MsBuildProjectDiagnostics, listener, thisArg);
    };
    OmniSharpServer.prototype.onBeforeServerInstall = function (listener) {
        return this._addListener(Events.BeforeServerInstall, listener);
    };
    OmniSharpServer.prototype.onBeforeServerStart = function (listener) {
        return this._addListener(Events.BeforeServerStart, listener);
    };
    OmniSharpServer.prototype.onServerStart = function (listener) {
        return this._addListener(Events.ServerStart, listener);
    };
    OmniSharpServer.prototype.onServerStop = function (listener) {
        return this._addListener(Events.ServerStop, listener);
    };
    OmniSharpServer.prototype.onMultipleLaunchTargets = function (listener, thisArg) {
        return this._addListener(Events.MultipleLaunchTargets, listener, thisArg);
    };
    OmniSharpServer.prototype.onOmnisharpStart = function (listener) {
        return this._addListener(Events.Started, listener);
    };
    OmniSharpServer.prototype._addListener = function (event, listener, thisArg) {
        var _this = this;
        listener = thisArg ? listener.bind(thisArg) : listener;
        this._eventBus.addListener(event, listener);
        return new vscode.Disposable(function () { return _this._eventBus.removeListener(event, listener); });
    };
    OmniSharpServer.prototype._fireEvent = function (event, args) {
        this._eventBus.emit(event, args);
    };
    // --- start, stop, and connect
    OmniSharpServer.prototype._start = function (launchTarget) {
        var _this = this;
        this._setState(ServerState.Starting);
        this._launchTarget = launchTarget;
        var solutionPath = launchTarget.target;
        var cwd = path.dirname(solutionPath);
        var args = [
            '-s', solutionPath,
            '--hostPID', process.pid.toString(),
            '--stdio',
            'DotNet:enablePackageRestore=false',
            '--encoding', 'utf-8'
        ];
        this._options = options_1.Options.Read();
        if (this._options.loggingLevel === 'verbose') {
            args.push('-v');
        }
        this._logger.appendLine("Starting OmniSharp server at " + new Date().toLocaleString());
        this._logger.increaseIndent();
        this._logger.appendLine("Target: " + solutionPath);
        this._logger.decreaseIndent();
        this._logger.appendLine();
        this._fireEvent(Events.BeforeServerStart, solutionPath);
        return launcher_1.launchOmniSharp(cwd, args).then(function (value) {
            if (value.usingMono) {
                _this._logger.appendLine("OmniSharp server started wth Mono");
            }
            else {
                _this._logger.appendLine("OmniSharp server started");
            }
            _this._logger.increaseIndent();
            _this._logger.appendLine("Path: " + value.command);
            _this._logger.appendLine("PID: " + value.process.pid);
            _this._logger.decreaseIndent();
            _this._logger.appendLine();
            _this._serverProcess = value.process;
            _this._delayTrackers = {};
            _this._setState(ServerState.Started);
            _this._fireEvent(Events.ServerStart, solutionPath);
            return _this._doConnect();
        }).then(function () {
            return vscode.commands.getCommands()
                .then(function (commands) {
                if (commands.find(function (c) { return c === 'vscode.startDebug'; })) {
                    _this._isDebugEnable = true;
                }
            });
        }).then(function () {
            // Start telemetry reporting
            _this._telemetryIntervalId = setInterval(function () { return _this._reportTelemetry(); }, TelemetryReportingDelay);
        }).then(function () {
            _this._requestQueue.drain();
        }).catch(function (err) {
            _this._fireEvent(Events.ServerError, err);
            return _this.stop();
        });
    };
    OmniSharpServer.prototype.stop = function () {
        var _this = this;
        while (this._disposables.length) {
            this._disposables.pop().dispose();
        }
        var cleanupPromise;
        if (this._telemetryIntervalId !== undefined) {
            // Stop reporting telemetry
            clearInterval(this._telemetryIntervalId);
            this._telemetryIntervalId = undefined;
            this._reportTelemetry();
        }
        if (!this._serverProcess) {
            // nothing to kill
            cleanupPromise = Promise.resolve();
        }
        else if (process.platform === 'win32') {
            // when killing a process in windows its child
            // processes are *not* killed but become root
            // processes. Therefore we use TASKKILL.EXE
            cleanupPromise = new Promise(function (resolve, reject) {
                var killer = child_process_1.exec("taskkill /F /T /PID " + _this._serverProcess.pid, function (err, stdout, stderr) {
                    if (err) {
                        return reject(err);
                    }
                });
                killer.on('exit', resolve);
                killer.on('error', reject);
            });
        }
        else {
            // Kill Unix process
            this._serverProcess.kill('SIGTERM');
            cleanupPromise = Promise.resolve();
        }
        return cleanupPromise.then(function () {
            _this._serverProcess = null;
            _this._setState(ServerState.Stopped);
            _this._fireEvent(Events.ServerStop, _this);
        });
    };
    OmniSharpServer.prototype.restart = function (launchTarget) {
        var _this = this;
        if (launchTarget === void 0) { launchTarget = this._launchTarget; }
        if (launchTarget) {
            return this.stop().then(function () {
                _this._start(launchTarget);
            });
        }
    };
    OmniSharpServer.prototype.autoStart = function (preferredPath) {
        var _this = this;
        return launcher_2.findLaunchTargets().then(function (launchTargets) {
            // If there aren't any potential launch targets, we create file watcher and try to
            // start the server again once a *.sln, *.csproj or project.json file is created.
            if (launchTargets.length === 0) {
                return new Promise(function (resolve, reject) {
                    // 1st watch for files
                    var watcher = vscode.workspace.createFileSystemWatcher('{**/*.sln,**/*.csproj,**/project.json}', 
                    /*ignoreCreateEvents*/ false, 
                    /*ignoreChangeEvents*/ true, 
                    /*ignoreDeleteEvents*/ true);
                    watcher.onDidCreate(function (uri) {
                        watcher.dispose();
                        resolve();
                    });
                }).then(function () {
                    // 2nd try again
                    return _this.autoStart(preferredPath);
                });
            }
            // If there's more than one launch target, we start the server if one of the targets
            // matches the preferred path. Otherwise, we fire the "MultipleLaunchTargets" event,
            // which is handled in status.ts to display the launch target selector.
            if (launchTargets.length > 1 && preferredPath) {
                for (var _i = 0, launchTargets_1 = launchTargets; _i < launchTargets_1.length; _i++) {
                    var launchTarget = launchTargets_1[_i];
                    if (launchTarget.target === preferredPath) {
                        // start preferred path
                        return _this.restart(launchTarget);
                    }
                }
                _this._fireEvent(Events.MultipleLaunchTargets, launchTargets);
                return Promise.reject(undefined);
            }
            // If there's only one target, just start
            return _this.restart(launchTargets[0]);
        });
    };
    // --- requests et al
    OmniSharpServer.prototype.makeRequest = function (command, data, token) {
        var _this = this;
        if (this._getState() !== ServerState.Started) {
            return Promise.reject('server has been stopped or not started');
        }
        console.log("makeRequest: command=" + command);
        var startTime;
        var request;
        var promise = new Promise(function (resolve, reject) {
            startTime = Date.now();
            request = {
                command: command,
                data: data,
                onSuccess: function (value) { return resolve(value); },
                onError: function (err) { return reject(err); }
            };
            _this._requestQueue.enqueue(request);
        });
        if (token) {
            token.onCancellationRequested(function () {
                _this._requestQueue.cancelRequest(request);
            });
        }
        return promise.then(function (response) {
            var endTime = Date.now();
            var elapsedTime = endTime - startTime;
            _this._recordRequestDelay(command, elapsedTime);
            return response;
        });
    };
    OmniSharpServer.prototype._doConnect = function () {
        var _this = this;
        this._serverProcess.stderr.on('data', function (data) {
            _this._fireEvent('stderr', String(data));
        });
        this._readLine = readline_1.createInterface({
            input: this._serverProcess.stdout,
            output: this._serverProcess.stdin,
            terminal: false
        });
        var promise = new Promise(function (resolve, reject) {
            var listener;
            // Convert the timeout from the seconds to milliseconds, which is required by setTimeout().
            var timeoutDuration = _this._options.projectLoadTimeout * 1000;
            // timeout logic
            var handle = setTimeout(function () {
                if (listener) {
                    listener.dispose();
                }
                reject(new Error("OmniSharp server load timed out. Use the 'omnisharp.projectLoadTimeout' setting to override the default delay (one minute)."));
            }, timeoutDuration);
            // handle started-event
            listener = _this.onOmnisharpStart(function () {
                if (listener) {
                    listener.dispose();
                }
                clearTimeout(handle);
                resolve();
            });
        });
        var lineReceived = this._onLineReceived.bind(this);
        this._readLine.addListener('line', lineReceived);
        this._disposables.push(new vscode.Disposable(function () {
            _this._readLine.removeListener('line', lineReceived);
        }));
        return promise;
    };
    OmniSharpServer.prototype._onLineReceived = function (line) {
        if (line[0] !== '{') {
            this._logger.appendLine(line);
            return;
        }
        var packet;
        try {
            packet = JSON.parse(line);
        }
        catch (err) {
            // This isn't JSON
            return;
        }
        if (!packet.Type) {
            // Bogus packet
            return;
        }
        switch (packet.Type) {
            case 'response':
                this._handleResponsePacket(packet);
                break;
            case 'event':
                this._handleEventPacket(packet);
                break;
            default:
                console.warn("Unknown packet type: " + packet.Type);
                break;
        }
    };
    OmniSharpServer.prototype._handleResponsePacket = function (packet) {
        var request = this._requestQueue.dequeue(packet.Command, packet.Request_seq);
        if (!request) {
            this._logger.appendLine("Received response for " + packet.Command + " but could not find request.");
            return;
        }
        if (packet.Success) {
            request.onSuccess(packet.Body);
        }
        else {
            request.onError(packet.Message || packet.Body);
        }
        this._requestQueue.drain();
    };
    OmniSharpServer.prototype._handleEventPacket = function (packet) {
        if (packet.Event === 'log') {
            var entry = packet.Body;
            this._logOutput(entry.LogLevel, entry.Name, entry.Message);
        }
        else {
            // fwd all other events
            this._fireEvent(packet.Event, packet.Body);
        }
    };
    OmniSharpServer.prototype._makeRequest = function (request) {
        var id = OmniSharpServer._nextId++;
        var requestPacket = {
            Type: 'request',
            Seq: id,
            Command: request.command,
            Arguments: request.data
        };
        if (this._debugMode) {
            this._logger.appendLine("Making request: " + request.command + " (" + id + ")");
        }
        this._serverProcess.stdin.write(JSON.stringify(requestPacket) + '\n');
        return id;
    };
    OmniSharpServer.prototype._logOutput = function (logLevel, name, message) {
        var timing200Pattern = /^\[INFORMATION:OmniSharp.Middleware.LoggingMiddleware\] \/[\/\w]+: 200 \d+ms/;
        var output = "[" + logLevel + ":" + name + "] " + message;
        // strip stuff like: /codecheck: 200 339ms
        if (this._debugMode || !timing200Pattern.test(output)) {
            this._logger.appendLine(output);
        }
    };
    OmniSharpServer._nextId = 1;
    return OmniSharpServer;
}());
exports.OmniSharpServer = OmniSharpServer;
//# sourceMappingURL=server.js.map