/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_debugadapter_1 = require('vscode-debugadapter');
var fs_1 = require('fs');
var path_1 = require('path');
var child_process_1 = require('child_process');
var json_rpc2_1 = require('json-rpc2');
var goPath_1 = require('../goPath');
require('console-stamp')(console);
// This enum should stay in sync with https://golang.org/pkg/reflect/#Kind
var GoReflectKind;
(function (GoReflectKind) {
    GoReflectKind[GoReflectKind["Invalid"] = 0] = "Invalid";
    GoReflectKind[GoReflectKind["Bool"] = 1] = "Bool";
    GoReflectKind[GoReflectKind["Int"] = 2] = "Int";
    GoReflectKind[GoReflectKind["Int8"] = 3] = "Int8";
    GoReflectKind[GoReflectKind["Int16"] = 4] = "Int16";
    GoReflectKind[GoReflectKind["Int32"] = 5] = "Int32";
    GoReflectKind[GoReflectKind["Int64"] = 6] = "Int64";
    GoReflectKind[GoReflectKind["Uint"] = 7] = "Uint";
    GoReflectKind[GoReflectKind["Uint8"] = 8] = "Uint8";
    GoReflectKind[GoReflectKind["Uint16"] = 9] = "Uint16";
    GoReflectKind[GoReflectKind["Uint32"] = 10] = "Uint32";
    GoReflectKind[GoReflectKind["Uint64"] = 11] = "Uint64";
    GoReflectKind[GoReflectKind["Uintptr"] = 12] = "Uintptr";
    GoReflectKind[GoReflectKind["Float32"] = 13] = "Float32";
    GoReflectKind[GoReflectKind["Float64"] = 14] = "Float64";
    GoReflectKind[GoReflectKind["Complex64"] = 15] = "Complex64";
    GoReflectKind[GoReflectKind["Complex128"] = 16] = "Complex128";
    GoReflectKind[GoReflectKind["Array"] = 17] = "Array";
    GoReflectKind[GoReflectKind["Chan"] = 18] = "Chan";
    GoReflectKind[GoReflectKind["Func"] = 19] = "Func";
    GoReflectKind[GoReflectKind["Interface"] = 20] = "Interface";
    GoReflectKind[GoReflectKind["Map"] = 21] = "Map";
    GoReflectKind[GoReflectKind["Ptr"] = 22] = "Ptr";
    GoReflectKind[GoReflectKind["Slice"] = 23] = "Slice";
    GoReflectKind[GoReflectKind["String"] = 24] = "String";
    GoReflectKind[GoReflectKind["Struct"] = 25] = "Struct";
    GoReflectKind[GoReflectKind["UnsafePointer"] = 26] = "UnsafePointer";
})(GoReflectKind || (GoReflectKind = {}));
;
// Note: Only turn this on when debugging the debugAdapter.
// See https://github.com/Microsoft/vscode-go/issues/206#issuecomment-194571950
var DEBUG = false;
function log(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (DEBUG) {
        console.warn.apply(console, [msg].concat(args));
    }
}
function logError(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (DEBUG) {
        console.error.apply(console, [msg].concat(args));
    }
}
var Delve = (function () {
    function Delve(mode, remotePath, port, host, program, args, showLog, cwd, env, buildFlags, init) {
        var _this = this;
        this.program = program;
        this.remotePath = remotePath;
        this.connection = new Promise(function (resolve, reject) {
            var serverRunning = false;
            if (mode === 'remote') {
                _this.debugProcess = null;
                serverRunning = true; // assume server is running when in remote mode
                connectClient(port, host);
                return;
            }
            var dlv = goPath_1.getBinPath('dlv');
            log('Using dlv at: ', dlv);
            if (!fs_1.existsSync(dlv)) {
                return reject('Cannot find Delve debugger. Ensure it is in your `GOPATH/bin` or `PATH`.');
            }
            var dlvEnv = null;
            if (env) {
                dlvEnv = {};
                for (var k in process.env) {
                    dlvEnv[k] = process.env[k];
                }
                for (var k in env) {
                    dlvEnv[k] = env[k];
                }
            }
            var dlvArgs = [mode || 'debug'];
            if (mode === 'exec') {
                dlvArgs = dlvArgs.concat([program]);
            }
            dlvArgs = dlvArgs.concat(['--headless=true', '--listen=' + host + ':' + port.toString()]);
            if (showLog) {
                dlvArgs = dlvArgs.concat(['--log=' + showLog.toString()]);
            }
            if (buildFlags) {
                dlvArgs = dlvArgs.concat(['--build-flags=' + buildFlags]);
            }
            if (init) {
                dlvArgs = dlvArgs.concat(['--init=' + init]);
            }
            if (args) {
                dlvArgs = dlvArgs.concat(['--'].concat(args));
            }
            var dlvCwd = path_1.dirname(program);
            try {
                if (fs_1.lstatSync(program).isDirectory()) {
                    dlvCwd = program;
                }
            }
            catch (e) { }
            _this.debugProcess = child_process_1.spawn(dlv, dlvArgs, {
                cwd: dlvCwd,
                env: dlvEnv,
            });
            function connectClient(port, host) {
                // Add a slight delay to avoid issues on Linux with
                // Delve failing calls made shortly after connection.
                setTimeout(function () {
                    var client = json_rpc2_1.Client.$create(port, host);
                    client.connectSocket(function (err, conn) {
                        if (err)
                            return reject(err);
                        return resolve(conn);
                    });
                }, 200);
            }
            _this.debugProcess.stderr.on('data', function (chunk) {
                var str = chunk.toString();
                if (_this.onstderr) {
                    _this.onstderr(str);
                }
                if (!serverRunning) {
                    serverRunning = true;
                    connectClient(port, host);
                }
            });
            _this.debugProcess.stdout.on('data', function (chunk) {
                var str = chunk.toString();
                if (_this.onstdout) {
                    _this.onstdout(str);
                }
                if (!serverRunning) {
                    serverRunning = true;
                    connectClient(port, host);
                }
            });
            _this.debugProcess.on('close', function (code) {
                // TODO: Report `dlv` crash to user.
                logError('Process exiting with code: ' + code);
            });
            _this.debugProcess.on('error', function (err) {
                reject(err);
            });
        });
    }
    Delve.prototype.call = function (command, args, callback) {
        this.connection.then(function (conn) {
            conn.call('RPCServer.' + command, args, callback);
        }, function (err) {
            callback(err, null);
        });
    };
    Delve.prototype.callPromise = function (command, args) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connection.then(function (conn) {
                conn.call('RPCServer.' + command, args, function (err, res) {
                    if (err)
                        return reject(err);
                    resolve(res);
                });
            }, function (err) {
                reject(err);
            });
        });
    };
    Delve.prototype.close = function () {
        var _this = this;
        if (!this.debugProcess) {
            this.call('Command', [{ name: 'halt' }], function (err, state) {
                if (err)
                    return logError('Failed to halt.');
                _this.call('Restart', [], function (err, state) {
                    if (err)
                        return logError('Failed to restart.');
                });
            });
        }
        else {
            this.debugProcess.kill();
        }
    };
    return Delve;
}());
var GoDebugSession = (function (_super) {
    __extends(GoDebugSession, _super);
    function GoDebugSession(debuggerLinesStartAt1, isServer) {
        var _this = this;
        if (isServer === void 0) { isServer = false; }
        _super.call(this, debuggerLinesStartAt1, isServer);
        this._variableHandles = new vscode_debugadapter_1.Handles();
        this.threads = new Set();
        this.debugState = null;
        this.delve = null;
        this.breakpoints = new Map();
        this.initialBreakpointsSetPromise = new Promise(function (resolve, reject) { return _this.signalInitialBreakpointsSet = resolve; });
    }
    GoDebugSession.prototype.initializeRequest = function (response, args) {
        log('InitializeRequest');
        // This debug adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        this.sendResponse(response);
        log('InitializeResponse');
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
        log('InitializeEvent');
    };
    GoDebugSession.prototype.launchRequest = function (response, args) {
        var _this = this;
        // Launch the Delve debugger on the program
        var remotePath = args.remotePath || '';
        var port = args.port || random(2000, 50000);
        var host = args.host || '127.0.0.1';
        if (remotePath.length > 0) {
            this.localPathSeparator = args.program.includes('/') ? '/' : '\\';
            this.remotePathSeparator = remotePath.includes('/') ? '/' : '\\';
            if ((remotePath.endsWith('\\')) || (remotePath.endsWith('/'))) {
                remotePath = remotePath.substring(0, remotePath.length - 1);
            }
        }
        this.delve = new Delve(args.mode, remotePath, port, host, args.program, args.args, args.showLog, args.cwd, args.env, args.buildFlags, args.init);
        this.delve.onstdout = function (str) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(str, 'stdout'));
        };
        this.delve.onstderr = function (str) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(str, 'stderr'));
        };
        this.delve.connection.then(function () {
            return _this.initialBreakpointsSetPromise;
        }).then(function () {
            if (args.stopOnEntry) {
                _this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', 0));
                log('StoppedEvent("breakpoint")');
                _this.sendResponse(response);
            }
            else {
                _this.continueRequest(response);
            }
        }, function (err) {
            _this.sendErrorResponse(response, 3000, 'Failed to continue: "{e}"', { e: err.toString() });
            log('ContinueResponse');
        });
    };
    GoDebugSession.prototype.disconnectRequest = function (response, args) {
        log('DisconnectRequest');
        this.delve.close();
        _super.prototype.disconnectRequest.call(this, response, args);
        log('DisconnectResponse');
    };
    GoDebugSession.prototype.configurationDoneRequest = function (response, args) {
        log('ConfigurationDoneRequest');
        this.signalInitialBreakpointsSet();
        this.sendResponse(response);
        log('ConfigurationDoneRequest');
    };
    GoDebugSession.prototype.toDebuggerPath = function (path) {
        if (this.delve.remotePath.length === 0) {
            return this.convertClientPathToDebugger(path);
        }
        return path.replace(this.delve.program, this.delve.remotePath).split(this.localPathSeparator).join(this.remotePathSeparator);
    };
    GoDebugSession.prototype.toLocalPath = function (path) {
        if (this.delve.remotePath.length === 0) {
            return this.convertDebuggerPathToClient(path);
        }
        return path.replace(this.delve.remotePath, this.delve.program).split(this.remotePathSeparator).join(this.localPathSeparator);
    };
    GoDebugSession.prototype.setBreakPointsRequest = function (response, args) {
        var _this = this;
        log('SetBreakPointsRequest');
        if (!this.breakpoints.get(args.source.path)) {
            this.breakpoints.set(args.source.path, []);
        }
        var file = args.source.path;
        var remoteFile = this.toDebuggerPath(file);
        var existingBPs = this.breakpoints.get(file);
        Promise.all(this.breakpoints.get(file).map(function (existingBP) {
            log('Clearing: ' + existingBP.id);
            return _this.delve.callPromise('ClearBreakpoint', [existingBP.id]);
        })).then(function () {
            log('All cleared');
            return Promise.all(args.lines.map(function (line) {
                if (_this.delve.remotePath.length === 0) {
                    log('Creating on: ' + file + ':' + line);
                }
                else {
                    log('Creating on: ' + file + ' (' + remoteFile + ') :' + line);
                }
                return _this.delve.callPromise('CreateBreakpoint', [{ file: remoteFile, line: line }]).then(null, function (err) {
                    log('Error on CreateBreakpoint');
                    return null;
                });
            }));
        }).then(function (newBreakpoints) {
            log('All set:' + JSON.stringify(newBreakpoints));
            var breakpoints = newBreakpoints.map(function (bp, i) {
                if (bp) {
                    return { verified: true, line: bp.line };
                }
                else {
                    return { verified: false, line: args.lines[i] };
                }
            });
            _this.breakpoints.set(args.source.path, newBreakpoints.filter(function (x) { return !!x; }));
            return breakpoints;
        }).then(function (breakpoints) {
            response.body = { breakpoints: breakpoints };
            _this.sendResponse(response);
            log('SetBreakPointsResponse');
        }, function (err) {
            _this.sendErrorResponse(response, 2002, 'Failed to set breakpoint: "{e}"', { e: err.toString() });
            logError(err);
        });
    };
    GoDebugSession.prototype.threadsRequest = function (response) {
        var _this = this;
        log('ThreadsRequest');
        this.delve.call('ListGoroutines', [], function (err, goroutines) {
            if (err) {
                logError('Failed to get threads.');
                return _this.sendErrorResponse(response, 2003, 'Unable to display threads: "{e}"', { e: err.toString() });
            }
            log(goroutines);
            var threads = goroutines.map(function (goroutine) {
                return new vscode_debugadapter_1.Thread(goroutine.id, goroutine.userCurrentLoc.function ? goroutine.userCurrentLoc.function.name : (goroutine.userCurrentLoc.file + '@' + goroutine.userCurrentLoc.line));
            });
            response.body = { threads: threads };
            _this.sendResponse(response);
            log('ThreadsResponse');
            log(threads);
        });
    };
    GoDebugSession.prototype.stackTraceRequest = function (response, args) {
        var _this = this;
        log('StackTraceRequest');
        this.delve.call('StacktraceGoroutine', [{ id: args.threadId, depth: args.levels }], function (err, locations) {
            if (err) {
                logError('Failed to produce stack trace!');
                return _this.sendErrorResponse(response, 2004, 'Unable to produce stack trace: "{e}"', { e: err.toString() });
            }
            log(locations);
            var stackFrames = locations.map(function (location, i) {
                return new vscode_debugadapter_1.StackFrame(i, location.function ? location.function.name : '<unknown>', new vscode_debugadapter_1.Source(path_1.basename(location.file), _this.toLocalPath(location.file)), location.line, 0);
            });
            response.body = { stackFrames: stackFrames };
            _this.sendResponse(response);
            log('StackTraceResponse');
        });
    };
    GoDebugSession.prototype.scopesRequest = function (response, args) {
        var _this = this;
        log('ScopesRequest');
        this.delve.call('ListLocalVars', [{ goroutineID: this.debugState.currentGoroutine.id, frame: args.frameId }], function (err, locals) {
            if (err) {
                logError('Failed to list local variables.');
                return _this.sendErrorResponse(response, 2005, 'Unable to list locals: "{e}"', { e: err.toString() });
            }
            log(locals);
            _this.delve.call('ListFunctionArgs', [{ goroutineID: _this.debugState.currentGoroutine.id, frame: args.frameId }], function (err, args) {
                if (err) {
                    logError('Failed to list function args.');
                    return _this.sendErrorResponse(response, 2006, 'Unable to list args: "{e}"', { e: err.toString() });
                }
                log(args);
                var vars = args.concat(locals);
                var scopes = new Array();
                var localVariables = {
                    name: 'Local',
                    addr: 0,
                    type: '',
                    realType: '',
                    kind: 0,
                    value: '',
                    len: 0,
                    cap: 0,
                    children: vars,
                    unreadable: ''
                };
                scopes.push(new vscode_debugadapter_1.Scope('Local', _this._variableHandles.create(localVariables), false));
                response.body = { scopes: scopes };
                _this.sendResponse(response);
                log('ScopesResponse');
            });
        });
    };
    GoDebugSession.prototype.convertDebugVariableToProtocolVariable = function (v, i) {
        if (v.kind === GoReflectKind.UnsafePointer) {
            return {
                result: "unsafe.Pointer(0x" + v.children[0].addr.toString(16) + ")",
                variablesReference: 0
            };
        }
        else if (v.kind === GoReflectKind.Ptr) {
            if (v.children[0].addr === 0) {
                return {
                    result: 'nil <' + v.type + '>',
                    variablesReference: 0
                };
            }
            else if (v.children[0].type === 'void') {
                return {
                    result: 'void',
                    variablesReference: 0
                };
            }
            else {
                return {
                    result: '<' + v.type + '>',
                    variablesReference: v.children[0].children.length > 0 ? this._variableHandles.create(v.children[0]) : 0
                };
            }
        }
        else if (v.kind === GoReflectKind.Slice) {
            return {
                result: '<' + v.type + '> (length: ' + v.len + ', cap: ' + v.cap + ')',
                variablesReference: this._variableHandles.create(v)
            };
        }
        else if (v.kind === GoReflectKind.Array) {
            return {
                result: '<' + v.type + '>',
                variablesReference: this._variableHandles.create(v)
            };
        }
        else if (v.kind === GoReflectKind.String) {
            var val = v.value;
            if (v.value && v.value.length < v.len) {
                val += "...+" + (v.len - v.value.length) + " more";
            }
            return {
                result: v.unreadable ? ('<' + v.unreadable + '>') : ('"' + val + '"'),
                variablesReference: 0
            };
        }
        else {
            return {
                result: v.value || ('<' + v.type + '>'),
                variablesReference: v.children.length > 0 ? this._variableHandles.create(v) : 0
            };
        }
    };
    GoDebugSession.prototype.variablesRequest = function (response, args) {
        var _this = this;
        log('VariablesRequest');
        var vari = this._variableHandles.get(args.variablesReference);
        var variables;
        if (vari.kind === GoReflectKind.Array || vari.kind === GoReflectKind.Slice || vari.kind === GoReflectKind.Map) {
            variables = vari.children.map(function (v, i) {
                var _a = _this.convertDebugVariableToProtocolVariable(v, i), result = _a.result, variablesReference = _a.variablesReference;
                return {
                    name: '[' + i + ']',
                    value: result,
                    variablesReference: variablesReference
                };
            });
        }
        else {
            variables = vari.children.map(function (v, i) {
                var _a = _this.convertDebugVariableToProtocolVariable(v, i), result = _a.result, variablesReference = _a.variablesReference;
                return {
                    name: v.name,
                    value: result,
                    variablesReference: variablesReference
                };
            });
        }
        log(JSON.stringify(variables, null, ' '));
        response.body = { variables: variables };
        this.sendResponse(response);
        log('VariablesResponse');
    };
    GoDebugSession.prototype.handleReenterDebug = function (reason) {
        var _this = this;
        if (this.debugState.exited) {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
            log('TerminatedEvent');
        }
        else {
            // [TODO] Can we avoid doing this? https://github.com/Microsoft/vscode/issues/40#issuecomment-161999881
            this.delve.call('ListGoroutines', [], function (err, goroutines) {
                if (err) {
                    logError('Failed to get threads.');
                }
                // Assume we need to stop all the threads we saw before...
                var needsToBeStopped = new Set();
                _this.threads.forEach(function (id) { return needsToBeStopped.add(id); });
                for (var _i = 0, goroutines_1 = goroutines; _i < goroutines_1.length; _i++) {
                    var goroutine = goroutines_1[_i];
                    // ...but delete from list of threads to stop if we still see it
                    needsToBeStopped.delete(goroutine.id);
                    if (!_this.threads.has(goroutine.id)) {
                        // Send started event if it's new
                        _this.sendEvent(new vscode_debugadapter_1.ThreadEvent('started', goroutine.id));
                    }
                    _this.threads.add(goroutine.id);
                }
                // Send existed event if it's no longer there
                needsToBeStopped.forEach(function (id) {
                    _this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', id));
                    _this.threads.delete(id);
                });
                var stoppedEvent = new vscode_debugadapter_1.StoppedEvent(reason, _this.debugState.currentGoroutine.id);
                stoppedEvent.body.allThreadsStopped = true;
                _this.sendEvent(stoppedEvent);
                log('StoppedEvent("' + reason + '")');
            });
        }
    };
    GoDebugSession.prototype.continueRequest = function (response) {
        var _this = this;
        log('ContinueRequest');
        this.delve.call('Command', [{ name: 'continue' }], function (err, state) {
            if (err) {
                logError('Failed to continue.');
            }
            log(state);
            _this.debugState = state;
            _this.handleReenterDebug('breakpoint');
        });
        this.sendResponse(response);
        log('ContinueResponse');
    };
    GoDebugSession.prototype.nextRequest = function (response) {
        var _this = this;
        log('NextRequest');
        this.delve.call('Command', [{ name: 'next' }], function (err, state) {
            if (err) {
                logError('Failed to next.');
            }
            log(state);
            _this.debugState = state;
            _this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        log('NextResponse');
    };
    GoDebugSession.prototype.stepInRequest = function (response) {
        var _this = this;
        log('StepInRequest');
        this.delve.call('Command', [{ name: 'step' }], function (err, state) {
            if (err) {
                logError('Failed to step.');
            }
            log(state);
            _this.debugState = state;
            _this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        log('StepInResponse');
    };
    GoDebugSession.prototype.stepOutRequest = function (response) {
        logError('Not yet implemented: stepOutRequest');
        this.sendErrorResponse(response, 2000, 'Step out is not yet supported');
    };
    GoDebugSession.prototype.pauseRequest = function (response) {
        var _this = this;
        log('PauseRequest');
        this.delve.call('Command', [{ name: 'halt' }], function (err, state) {
            if (err) {
                logError('Failed to halt.');
                return _this.sendErrorResponse(response, 2010, 'Unable to halt execution: "{e}"', { e: err.toString() });
            }
            log(state);
            _this.sendResponse(response);
            log('PauseResponse');
        });
    };
    GoDebugSession.prototype.evaluateRequest = function (response, args) {
        var _this = this;
        log('EvaluateRequest');
        var evalSymbolArgs = {
            symbol: args.expression,
            scope: {
                goroutineID: this.debugState.currentGoroutine.id,
                frame: args.frameId
            }
        };
        this.delve.call('EvalSymbol', [evalSymbolArgs], function (err, variable) {
            if (err) {
                logError('Failed to eval expression: ', JSON.stringify(evalSymbolArgs, null, ' '));
                return _this.sendErrorResponse(response, 2009, 'Unable to eval expression: "{e}"', { e: err.toString() });
            }
            response.body = _this.convertDebugVariableToProtocolVariable(variable, 0);
            _this.sendResponse(response);
            log('EvaluateResponse');
        });
    };
    return GoDebugSession;
}(vscode_debugadapter_1.DebugSession));
function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
vscode_debugadapter_1.DebugSession.run(GoDebugSession);
//# sourceMappingURL=goDebug.js.map