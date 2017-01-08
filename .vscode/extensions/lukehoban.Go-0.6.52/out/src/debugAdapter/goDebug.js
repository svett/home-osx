/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
"use strict";
const vscode_debugadapter_1 = require("vscode-debugadapter");
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const json_rpc2_1 = require("json-rpc2");
const goPath_1 = require("../goPath");
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
const DEBUG = false;
function log(msg, ...args) {
    if (DEBUG) {
        console.warn(msg, ...args);
    }
}
function logError(msg, ...args) {
    if (DEBUG) {
        console.error(msg, ...args);
    }
}
class Delve {
    constructor(mode, remotePath, port, host, program, args, showLog, cwd, env, buildFlags, init) {
        this.program = program;
        this.remotePath = remotePath;
        this.connection = new Promise((resolve, reject) => {
            let serverRunning = false;
            if (mode === 'remote') {
                this.debugProcess = null;
                serverRunning = true; // assume server is running when in remote mode
                connectClient(port, host);
                return;
            }
            let dlv = goPath_1.getBinPath('dlv');
            log('Using dlv at: ', dlv);
            if (!fs_1.existsSync(dlv)) {
                return reject(`Cannot find Delve debugger at ${dlv}. Ensure it is in your "GOPATH/bin" or "PATH".`);
            }
            let dlvEnv = null;
            if (env) {
                dlvEnv = {};
                for (let k in process.env) {
                    dlvEnv[k] = process.env[k];
                }
                for (let k in env) {
                    dlvEnv[k] = env[k];
                }
            }
            let dlvArgs = [mode || 'debug'];
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
                dlvArgs = dlvArgs.concat(['--', ...args]);
            }
            let dlvCwd = path_1.dirname(program);
            try {
                if (fs_1.lstatSync(program).isDirectory()) {
                    dlvCwd = program;
                }
            }
            catch (e) { }
            this.debugProcess = child_process_1.spawn(dlv, dlvArgs, {
                cwd: dlvCwd,
                env: dlvEnv,
            });
            function connectClient(port, host) {
                // Add a slight delay to avoid issues on Linux with
                // Delve failing calls made shortly after connection.
                setTimeout(() => {
                    let client = json_rpc2_1.Client.$create(port, host);
                    client.connectSocket((err, conn) => {
                        if (err)
                            return reject(err);
                        return resolve(conn);
                    });
                }, 200);
            }
            this.debugProcess.stderr.on('data', chunk => {
                let str = chunk.toString();
                if (this.onstderr) {
                    this.onstderr(str);
                }
                if (!serverRunning) {
                    serverRunning = true;
                    connectClient(port, host);
                }
            });
            this.debugProcess.stdout.on('data', chunk => {
                let str = chunk.toString();
                if (this.onstdout) {
                    this.onstdout(str);
                }
                if (!serverRunning) {
                    serverRunning = true;
                    connectClient(port, host);
                }
            });
            this.debugProcess.on('close', function (code) {
                // TODO: Report `dlv` crash to user.
                logError('Process exiting with code: ' + code);
            });
            this.debugProcess.on('error', function (err) {
                reject(err);
            });
        });
    }
    call(command, args, callback) {
        this.connection.then(conn => {
            conn.call('RPCServer.' + command, args, callback);
        }, err => {
            callback(err, null);
        });
    }
    callPromise(command, args) {
        return new Promise((resolve, reject) => {
            this.connection.then(conn => {
                conn.call('RPCServer.' + command, args, (err, res) => {
                    if (err)
                        return reject(err);
                    resolve(res);
                });
            }, err => {
                reject(err);
            });
        });
    }
    close() {
        if (!this.debugProcess) {
            this.call('Command', [{ name: 'halt' }], (err, state) => {
                if (err)
                    return logError('Failed to halt.');
                this.call('Restart', [], (err, state) => {
                    if (err)
                        return logError('Failed to restart.');
                });
            });
        }
        else {
            this.debugProcess.kill();
        }
    }
}
class GoDebugSession extends vscode_debugadapter_1.DebugSession {
    constructor(debuggerLinesStartAt1, isServer = false) {
        super(debuggerLinesStartAt1, isServer);
        this._variableHandles = new vscode_debugadapter_1.Handles();
        this.threads = new Set();
        this.debugState = null;
        this.delve = null;
        this.breakpoints = new Map();
        this.initialBreakpointsSetPromise = new Promise((resolve, reject) => this.signalInitialBreakpointsSet = resolve);
    }
    initializeRequest(response, args) {
        log('InitializeRequest');
        // This debug adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        this.sendResponse(response);
        log('InitializeResponse');
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
        log('InitializeEvent');
    }
    launchRequest(response, args) {
        // Launch the Delve debugger on the program
        let remotePath = args.remotePath || '';
        let port = args.port || random(2000, 50000);
        let host = args.host || '127.0.0.1';
        if (remotePath.length > 0) {
            this.localPathSeparator = args.program.includes('/') ? '/' : '\\';
            this.remotePathSeparator = remotePath.includes('/') ? '/' : '\\';
            if ((remotePath.endsWith('\\')) || (remotePath.endsWith('/'))) {
                remotePath = remotePath.substring(0, remotePath.length - 1);
            }
        }
        this.delve = new Delve(args.mode, remotePath, port, host, args.program, args.args, args.showLog, args.cwd, args.env, args.buildFlags, args.init);
        this.delve.onstdout = (str) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(str, 'stdout'));
        };
        this.delve.onstderr = (str) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(str, 'stderr'));
        };
        this.delve.connection.then(() => this.initialBreakpointsSetPromise).then(() => {
            if (args.stopOnEntry) {
                this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', 0));
                log('StoppedEvent("breakpoint")');
                this.sendResponse(response);
            }
            else {
                this.continueRequest(response);
            }
        }, err => {
            this.sendErrorResponse(response, 3000, 'Failed to continue: "{e}"', { e: err.toString() });
            log('ContinueResponse');
        });
    }
    disconnectRequest(response, args) {
        log('DisconnectRequest');
        this.delve.close();
        super.disconnectRequest(response, args);
        log('DisconnectResponse');
    }
    configurationDoneRequest(response, args) {
        log('ConfigurationDoneRequest');
        this.signalInitialBreakpointsSet();
        this.sendResponse(response);
        log('ConfigurationDoneRequest');
    }
    toDebuggerPath(path) {
        if (this.delve.remotePath.length === 0) {
            return this.convertClientPathToDebugger(path);
        }
        return path.replace(this.delve.program, this.delve.remotePath).split(this.localPathSeparator).join(this.remotePathSeparator);
    }
    toLocalPath(path) {
        if (this.delve.remotePath.length === 0) {
            return this.convertDebuggerPathToClient(path);
        }
        return path.replace(this.delve.remotePath, this.delve.program).split(this.remotePathSeparator).join(this.localPathSeparator);
    }
    setBreakPointsRequest(response, args) {
        log('SetBreakPointsRequest');
        if (!this.breakpoints.get(args.source.path)) {
            this.breakpoints.set(args.source.path, []);
        }
        let file = args.source.path;
        let remoteFile = this.toDebuggerPath(file);
        let existingBPs = this.breakpoints.get(file);
        Promise.all(this.breakpoints.get(file).map(existingBP => {
            log('Clearing: ' + existingBP.id);
            return this.delve.callPromise('ClearBreakpoint', [existingBP.id]);
        })).then(() => {
            log('All cleared');
            return Promise.all(args.lines.map(line => {
                if (this.delve.remotePath.length === 0) {
                    log('Creating on: ' + file + ':' + line);
                }
                else {
                    log('Creating on: ' + file + ' (' + remoteFile + ') :' + line);
                }
                return this.delve.callPromise('CreateBreakpoint', [{ file: remoteFile, line }]).then(null, err => {
                    log('Error on CreateBreakpoint');
                    return null;
                });
            }));
        }).then(newBreakpoints => {
            log('All set:' + JSON.stringify(newBreakpoints));
            let breakpoints = newBreakpoints.map((bp, i) => {
                if (bp) {
                    return { verified: true, line: bp.line };
                }
                else {
                    return { verified: false, line: args.lines[i] };
                }
            });
            this.breakpoints.set(args.source.path, newBreakpoints.filter(x => !!x));
            return breakpoints;
        }).then(breakpoints => {
            response.body = { breakpoints };
            this.sendResponse(response);
            log('SetBreakPointsResponse');
        }, err => {
            this.sendErrorResponse(response, 2002, 'Failed to set breakpoint: "{e}"', { e: err.toString() });
            logError(err);
        });
    }
    threadsRequest(response) {
        log('ThreadsRequest');
        this.delve.call('ListGoroutines', [], (err, goroutines) => {
            if (err) {
                logError('Failed to get threads.');
                return this.sendErrorResponse(response, 2003, 'Unable to display threads: "{e}"', { e: err.toString() });
            }
            log(goroutines);
            let threads = goroutines.map(goroutine => new vscode_debugadapter_1.Thread(goroutine.id, goroutine.userCurrentLoc.function ? goroutine.userCurrentLoc.function.name : (goroutine.userCurrentLoc.file + '@' + goroutine.userCurrentLoc.line)));
            response.body = { threads };
            this.sendResponse(response);
            log('ThreadsResponse');
            log(threads);
        });
    }
    stackTraceRequest(response, args) {
        log('StackTraceRequest');
        this.delve.call('StacktraceGoroutine', [{ id: args.threadId, depth: args.levels }], (err, locations) => {
            if (err) {
                logError('Failed to produce stack trace!');
                return this.sendErrorResponse(response, 2004, 'Unable to produce stack trace: "{e}"', { e: err.toString() });
            }
            log(locations);
            let stackFrames = locations.map((location, i) => new vscode_debugadapter_1.StackFrame(i, location.function ? location.function.name : '<unknown>', new vscode_debugadapter_1.Source(path_1.basename(location.file), this.toLocalPath(location.file)), location.line, 0));
            response.body = { stackFrames };
            this.sendResponse(response);
            log('StackTraceResponse');
        });
    }
    scopesRequest(response, args) {
        log('ScopesRequest');
        this.delve.call('ListLocalVars', [{ goroutineID: this.debugState.currentGoroutine.id, frame: args.frameId }], (err, locals) => {
            if (err) {
                logError('Failed to list local variables.');
                return this.sendErrorResponse(response, 2005, 'Unable to list locals: "{e}"', { e: err.toString() });
            }
            log(locals);
            this.delve.call('ListFunctionArgs', [{ goroutineID: this.debugState.currentGoroutine.id, frame: args.frameId }], (err, args) => {
                if (err) {
                    logError('Failed to list function args.');
                    return this.sendErrorResponse(response, 2006, 'Unable to list args: "{e}"', { e: err.toString() });
                }
                log(args);
                let vars = args.concat(locals);
                let scopes = new Array();
                let localVariables = {
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
                scopes.push(new vscode_debugadapter_1.Scope('Local', this._variableHandles.create(localVariables), false));
                response.body = { scopes };
                this.sendResponse(response);
                log('ScopesResponse');
            });
        });
    }
    convertDebugVariableToProtocolVariable(v, i) {
        if (v.kind === GoReflectKind.UnsafePointer) {
            return {
                result: `unsafe.Pointer(0x${v.children[0].addr.toString(16)})`,
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
            let val = v.value;
            if (v.value && v.value.length < v.len) {
                val += `...+${v.len - v.value.length} more`;
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
    }
    variablesRequest(response, args) {
        log('VariablesRequest');
        let vari = this._variableHandles.get(args.variablesReference);
        let variables;
        if (vari.kind === GoReflectKind.Array || vari.kind === GoReflectKind.Slice || vari.kind === GoReflectKind.Map) {
            variables = vari.children.map((v, i) => {
                let { result, variablesReference } = this.convertDebugVariableToProtocolVariable(v, i);
                return {
                    name: '[' + i + ']',
                    value: result,
                    variablesReference
                };
            });
        }
        else {
            variables = vari.children.map((v, i) => {
                let { result, variablesReference } = this.convertDebugVariableToProtocolVariable(v, i);
                return {
                    name: v.name,
                    value: result,
                    variablesReference
                };
            });
        }
        log(JSON.stringify(variables, null, ' '));
        response.body = { variables };
        this.sendResponse(response);
        log('VariablesResponse');
    }
    handleReenterDebug(reason) {
        if (this.debugState.exited) {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
            log('TerminatedEvent');
        }
        else {
            // [TODO] Can we avoid doing this? https://github.com/Microsoft/vscode/issues/40#issuecomment-161999881
            this.delve.call('ListGoroutines', [], (err, goroutines) => {
                if (err) {
                    logError('Failed to get threads.');
                }
                // Assume we need to stop all the threads we saw before...
                let needsToBeStopped = new Set();
                this.threads.forEach(id => needsToBeStopped.add(id));
                for (let goroutine of goroutines) {
                    // ...but delete from list of threads to stop if we still see it
                    needsToBeStopped.delete(goroutine.id);
                    if (!this.threads.has(goroutine.id)) {
                        // Send started event if it's new
                        this.sendEvent(new vscode_debugadapter_1.ThreadEvent('started', goroutine.id));
                    }
                    this.threads.add(goroutine.id);
                }
                // Send existed event if it's no longer there
                needsToBeStopped.forEach(id => {
                    this.sendEvent(new vscode_debugadapter_1.ThreadEvent('exited', id));
                    this.threads.delete(id);
                });
                let stoppedEvent = new vscode_debugadapter_1.StoppedEvent(reason, this.debugState.currentGoroutine.id);
                stoppedEvent.body.allThreadsStopped = true;
                this.sendEvent(stoppedEvent);
                log('StoppedEvent("' + reason + '")');
            });
        }
    }
    continueRequest(response) {
        log('ContinueRequest');
        this.delve.call('Command', [{ name: 'continue' }], (err, state) => {
            if (err) {
                logError('Failed to continue.');
            }
            log(state);
            this.debugState = state;
            this.handleReenterDebug('breakpoint');
        });
        this.sendResponse(response);
        log('ContinueResponse');
    }
    nextRequest(response) {
        log('NextRequest');
        this.delve.call('Command', [{ name: 'next' }], (err, state) => {
            if (err) {
                logError('Failed to next.');
            }
            log(state);
            this.debugState = state;
            this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        log('NextResponse');
    }
    stepInRequest(response) {
        log('StepInRequest');
        this.delve.call('Command', [{ name: 'step' }], (err, state) => {
            if (err) {
                logError('Failed to step.');
            }
            log(state);
            this.debugState = state;
            this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        log('StepInResponse');
    }
    stepOutRequest(response) {
        log('StepOutRequest');
        this.delve.call('Command', [{ name: 'stepOut' }], (err, state) => {
            if (err) {
                logError('Failed to stepout.');
            }
            log(state);
            this.debugState = state;
            this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        log('StepOutResponse');
    }
    pauseRequest(response) {
        log('PauseRequest');
        this.delve.call('Command', [{ name: 'halt' }], (err, state) => {
            if (err) {
                logError('Failed to halt.');
                return this.sendErrorResponse(response, 2010, 'Unable to halt execution: "{e}"', { e: err.toString() });
            }
            log(state);
            this.sendResponse(response);
            log('PauseResponse');
        });
    }
    evaluateRequest(response, args) {
        log('EvaluateRequest');
        let evalSymbolArgs = {
            symbol: args.expression,
            scope: {
                goroutineID: this.debugState.currentGoroutine.id,
                frame: args.frameId
            }
        };
        this.delve.call('EvalSymbol', [evalSymbolArgs], (err, variable) => {
            if (err) {
                logError('Failed to eval expression: ', JSON.stringify(evalSymbolArgs, null, ' '));
                return this.sendErrorResponse(response, 2009, 'Unable to eval expression: "{e}"', { e: err.toString() });
            }
            response.body = this.convertDebugVariableToProtocolVariable(variable, 0);
            this.sendResponse(response);
            log('EvaluateResponse');
        });
    }
}
function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
vscode_debugadapter_1.DebugSession.run(GoDebugSession);
//# sourceMappingURL=goDebug.js.map