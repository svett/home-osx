"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const os = require("os");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const json_rpc2_1 = require("json-rpc2");
const goPath_1 = require("../goPath");
const logger = require("vscode-debug-logger");
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
process.on('uncaughtException', (err) => {
    const errMessage = err && (err.stack || err.message);
    logger.error(`Unhandled error in debug adapter: ${errMessage}`);
    throw err;
});
function logArgsToString(args) {
    return args.map(arg => {
        return typeof arg === 'string' ?
            arg :
            JSON.stringify(arg);
    }).join(' ');
}
function verbose(...args) {
    logger.verbose(logArgsToString(args));
}
function log(...args) {
    logger.log(logArgsToString(args));
}
function logError(...args) {
    logger.error(logArgsToString(args));
}
function normalizePath(filePath) {
    if (process.platform === 'win32') {
        filePath = path.normalize(filePath);
        let i = filePath.indexOf(':');
        if (i >= 0) {
            return filePath.slice(0, i).toUpperCase() + filePath.slice(i);
        }
    }
    return filePath;
}
class Delve {
    constructor(remotePath, port, host, program, launchArgs) {
        this.program = program;
        this.remotePath = remotePath;
        let mode = launchArgs.mode;
        let dlvCwd = path_1.dirname(program);
        let isProgramDirectory = false;
        this.connection = new Promise((resolve, reject) => {
            // Validations on the program
            if (!program) {
                return reject('The program attribute is missing in launch.json');
            }
            try {
                let pstats = fs_1.lstatSync(program);
                if (pstats.isDirectory()) {
                    if (mode === 'exec') {
                        logError(`The program "${program}" must not be a directory in exec mode`);
                        return reject('The program attribute must be an executable in exec mode');
                    }
                    dlvCwd = program;
                    isProgramDirectory = true;
                }
                else if (mode !== 'exec' && path_1.extname(program) !== '.go') {
                    logError(`The program "${program}" must be a valid go file in debug mode`);
                    return reject('The program attribute must be a directory or .go file in debug mode');
                }
            }
            catch (e) {
                logError(`The program "${program}" does not exist: ${e}`);
                return reject('The program attribute must point to valid directory, .go file or executable.');
            }
            // read env from disk and merge into env variables
            let fileEnv = {};
            try {
                fileEnv = goPath_1.parseEnvFile(launchArgs.envFile);
            }
            catch (e) {
                return reject(e);
            }
            let env = Object.assign({}, process.env, fileEnv, launchArgs.env);
            if (!!launchArgs.noDebug) {
                if (mode === 'debug' && !isProgramDirectory) {
                    this.noDebug = true;
                    this.debugProcess = child_process_1.spawn(goPath_1.getGoRuntimePath(), ['run', program], { env });
                    this.debugProcess.stderr.on('data', chunk => {
                        let str = chunk.toString();
                        if (this.onstderr) {
                            this.onstderr(str);
                        }
                    });
                    this.debugProcess.stdout.on('data', chunk => {
                        let str = chunk.toString();
                        if (this.onstdout) {
                            this.onstdout(str);
                        }
                    });
                    this.debugProcess.on('close', (code) => {
                        logError('Process exiting with code: ' + code);
                        if (this.onclose) {
                            this.onclose(code);
                        }
                    });
                    this.debugProcess.on('error', function (err) {
                        reject(err);
                    });
                    resolve();
                    return;
                }
            }
            this.noDebug = false;
            let serverRunning = false;
            if (mode === 'remote') {
                this.debugProcess = null;
                serverRunning = true; // assume server is running when in remote mode
                connectClient(port, host);
                return;
            }
            let dlv = goPath_1.getBinPathWithPreferredGopath('dlv', goPath_1.resolvePath(env['GOPATH']));
            if (!fs_1.existsSync(dlv)) {
                verbose(`Couldnt find dlv at ${process.env['GOPATH']}${env['GOPATH'] ? ', ' + env['GOPATH'] : ''} or ${process.env['PATH']}`);
                return reject(`Cannot find Delve debugger. Install from https://github.com/derekparker/delve & ensure it is in your "GOPATH/bin" or "PATH".`);
            }
            verbose('Using dlv at: ' + dlv);
            let dlvArgs = [mode || 'debug'];
            if (mode === 'exec') {
                dlvArgs = dlvArgs.concat([program]);
            }
            dlvArgs = dlvArgs.concat(['--headless=true', '--listen=' + host + ':' + port.toString()]);
            if (launchArgs.showLog) {
                dlvArgs = dlvArgs.concat(['--log=' + launchArgs.showLog.toString()]);
            }
            if (launchArgs.cwd) {
                dlvArgs = dlvArgs.concat(['--wd=' + launchArgs.cwd]);
            }
            if (launchArgs.buildFlags) {
                dlvArgs = dlvArgs.concat(['--build-flags=' + launchArgs.buildFlags]);
            }
            if (launchArgs.init) {
                dlvArgs = dlvArgs.concat(['--init=' + launchArgs.init]);
            }
            if (launchArgs.backend) {
                dlvArgs = dlvArgs.concat(['--backend=' + launchArgs.backend]);
            }
            if (launchArgs.args) {
                dlvArgs = dlvArgs.concat(['--', ...launchArgs.args]);
            }
            this.debugProcess = child_process_1.spawn(dlv, dlvArgs, {
                cwd: dlvCwd,
                env,
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
            this.debugProcess.on('close', (code) => {
                // TODO: Report `dlv` crash to user.
                logError('Process exiting with code: ' + code);
                if (this.onclose) {
                    this.onclose(code);
                }
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
            killTree(this.debugProcess.pid);
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
        const logPath = path.join(os.tmpdir(), 'vscode-go-debug.txt');
        logger.init(e => this.sendEvent(e), logPath, isServer);
    }
    initializeRequest(response, args) {
        verbose('InitializeRequest');
        // This debug adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        this.sendResponse(response);
        verbose('InitializeResponse');
    }
    findPathSeperator(path) {
        if (/^(\w:[\\/]|\\\\)/.test(path))
            return '\\';
        return path.includes('/') ? '/' : '\\';
    }
    launchRequest(response, args) {
        this.launchArgs = args;
        const logLevel = args.trace === 'verbose' ?
            logger.LogLevel.Verbose :
            args.trace ? logger.LogLevel.Log :
                logger.LogLevel.Error;
        logger.setMinLogLevel(logLevel);
        // Launch the Delve debugger on the program
        let localPath = args.program;
        let remotePath = args.remotePath || '';
        let port = args.port || random(2000, 50000);
        let host = args.host || '127.0.0.1';
        if (remotePath.length > 0) {
            this.localPathSeparator = this.findPathSeperator(localPath);
            this.remotePathSeparator = this.findPathSeperator(remotePath);
            let llist = localPath.split(/\/|\\/).reverse();
            let rlist = remotePath.split(/\/|\\/).reverse();
            let i = 0;
            for (; i < llist.length; i++)
                if (llist[i] !== rlist[i])
                    break;
            if (i) {
                localPath = llist.reverse().slice(0, -i).join(this.localPathSeparator) + this.localPathSeparator;
                remotePath = rlist.reverse().slice(0, -i).join(this.remotePathSeparator) + this.remotePathSeparator;
            }
            else if ((remotePath.endsWith('\\')) || (remotePath.endsWith('/'))) {
                remotePath = remotePath.substring(0, remotePath.length - 1);
            }
        }
        this.delve = new Delve(remotePath, port, host, localPath, args);
        this.delve.onstdout = (str) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(str, 'stdout'));
        };
        this.delve.onstderr = (str) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(str, 'stderr'));
        };
        this.delve.onclose = (code) => {
            if (code !== 0) {
                this.sendErrorResponse(response, 3000, 'Failed to continue: Check the debug console for details.');
            }
            else {
                this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
                verbose('TerminatedEvent');
            }
            verbose('Delve is closed');
        };
        this.delve.connection.then(() => {
            if (!this.delve.noDebug) {
                this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
                verbose('InitializeEvent');
            }
            this.sendResponse(response);
        }, err => {
            this.sendErrorResponse(response, 3000, 'Failed to continue: "{e}"', { e: err.toString() });
            verbose('ContinueResponse');
        });
    }
    disconnectRequest(response, args) {
        verbose('DisconnectRequest');
        this.delve.close();
        super.disconnectRequest(response, args);
        verbose('DisconnectResponse');
    }
    configurationDoneRequest(response, args) {
        verbose('ConfigurationDoneRequest');
        if (this.launchArgs.stopOnEntry) {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', 0));
            verbose('StoppedEvent("breakpoint")');
            this.sendResponse(response);
        }
        else {
            this.continueRequest(response);
        }
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
        verbose('SetBreakPointsRequest');
        let file = normalizePath(args.source.path);
        if (!this.breakpoints.get(file)) {
            this.breakpoints.set(file, []);
        }
        let remoteFile = this.toDebuggerPath(file);
        Promise.all(this.breakpoints.get(file).map(existingBP => {
            verbose('Clearing: ' + existingBP.id);
            return this.delve.callPromise('ClearBreakpoint', [existingBP.id]);
        })).then(() => {
            verbose('All cleared');
            return Promise.all(args.lines.map(line => {
                if (this.delve.remotePath.length === 0) {
                    verbose('Creating on: ' + file + ':' + line);
                }
                else {
                    verbose('Creating on: ' + file + ' (' + remoteFile + ') :' + line);
                }
                return this.delve.callPromise('CreateBreakpoint', [{ file: remoteFile, line }]).then(null, err => {
                    verbose('Error on CreateBreakpoint');
                    return null;
                });
            }));
        }).then(newBreakpoints => {
            verbose('All set:' + JSON.stringify(newBreakpoints));
            let breakpoints = newBreakpoints.map((bp, i) => {
                if (bp) {
                    return { verified: true, line: bp.line };
                }
                else {
                    return { verified: false, line: args.lines[i] };
                }
            });
            this.breakpoints.set(file, newBreakpoints.filter(x => !!x));
            return breakpoints;
        }).then(breakpoints => {
            response.body = { breakpoints };
            this.sendResponse(response);
            verbose('SetBreakPointsResponse');
        }, err => {
            this.sendErrorResponse(response, 2002, 'Failed to set breakpoint: "{e}"', { e: err.toString() });
            logError(err);
        });
    }
    threadsRequest(response) {
        verbose('ThreadsRequest');
        this.delve.call('ListGoroutines', [], (err, goroutines) => {
            if (this.debugState.exited) {
                // If the program exits very quickly, the initial threadsRequest will complete after it has exited.
                // A TerminatedEvent has already been sent. Ignore the err returned in this case.
                response.body = { threads: [] };
                return this.sendResponse(response);
            }
            if (err) {
                logError('Failed to get threads.');
                return this.sendErrorResponse(response, 2003, 'Unable to display threads: "{e}"', { e: err.toString() });
            }
            verbose('goroutines', goroutines);
            let threads = goroutines.map(goroutine => new vscode_debugadapter_1.Thread(goroutine.id, goroutine.userCurrentLoc.function ? goroutine.userCurrentLoc.function.name : (goroutine.userCurrentLoc.file + '@' + goroutine.userCurrentLoc.line)));
            response.body = { threads };
            this.sendResponse(response);
            verbose('ThreadsResponse', threads);
        });
    }
    stackTraceRequest(response, args) {
        verbose('StackTraceRequest');
        this.delve.call('StacktraceGoroutine', [{ id: args.threadId, depth: args.levels }], (err, locations) => {
            if (err) {
                logError('Failed to produce stack trace!');
                return this.sendErrorResponse(response, 2004, 'Unable to produce stack trace: "{e}"', { e: err.toString() });
            }
            verbose('locations', locations);
            let stackFrames = locations.map((location, i) => new vscode_debugadapter_1.StackFrame(i, location.function ? location.function.name : '<unknown>', new vscode_debugadapter_1.Source(path_1.basename(location.file), this.toLocalPath(location.file)), location.line, 0));
            response.body = { stackFrames };
            this.sendResponse(response);
            verbose('StackTraceResponse');
        });
    }
    scopesRequest(response, args) {
        verbose('ScopesRequest');
        this.delve.call('ListLocalVars', [{ goroutineID: this.debugState.currentGoroutine.id, frame: args.frameId }], (err, locals) => {
            if (err) {
                logError('Failed to list local variables.');
                return this.sendErrorResponse(response, 2005, 'Unable to list locals: "{e}"', { e: err.toString() });
            }
            verbose('locals', locals);
            this.delve.call('ListFunctionArgs', [{ goroutineID: this.debugState.currentGoroutine.id, frame: args.frameId }], (err, args) => {
                if (err) {
                    logError('Failed to list function args.');
                    return this.sendErrorResponse(response, 2006, 'Unable to list args: "{e}"', { e: err.toString() });
                }
                verbose('functionArgs', args);
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
                verbose('ScopesResponse');
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
        verbose('VariablesRequest');
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
        response.body = { variables };
        this.sendResponse(response);
        verbose('VariablesResponse', JSON.stringify(variables, null, ' '));
    }
    handleReenterDebug(reason) {
        if (this.debugState.exited) {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
            verbose('TerminatedEvent');
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
                verbose('StoppedEvent("' + reason + '")');
            });
        }
    }
    continueRequest(response) {
        verbose('ContinueRequest');
        this.delve.call('Command', [{ name: 'continue' }], (err, state) => {
            if (err) {
                logError('Failed to continue.');
            }
            verbose('state', state);
            this.debugState = state;
            this.handleReenterDebug('breakpoint');
        });
        this.sendResponse(response);
        verbose('ContinueResponse');
    }
    nextRequest(response) {
        verbose('NextRequest');
        this.delve.call('Command', [{ name: 'next' }], (err, state) => {
            if (err) {
                logError('Failed to next.');
            }
            verbose('state', state);
            this.debugState = state;
            this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        verbose('NextResponse');
    }
    stepInRequest(response) {
        verbose('StepInRequest');
        this.delve.call('Command', [{ name: 'step' }], (err, state) => {
            if (err) {
                logError('Failed to step.');
            }
            verbose('state', state);
            this.debugState = state;
            this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        verbose('StepInResponse');
    }
    stepOutRequest(response) {
        verbose('StepOutRequest');
        this.delve.call('Command', [{ name: 'stepOut' }], (err, state) => {
            if (err) {
                logError('Failed to stepout.');
            }
            verbose('state', state);
            this.debugState = state;
            this.handleReenterDebug('step');
        });
        this.sendResponse(response);
        verbose('StepOutResponse');
    }
    pauseRequest(response) {
        verbose('PauseRequest');
        this.delve.call('Command', [{ name: 'halt' }], (err, state) => {
            if (err) {
                logError('Failed to halt.');
                return this.sendErrorResponse(response, 2010, 'Unable to halt execution: "{e}"', { e: err.toString() });
            }
            verbose('state', state);
            this.sendResponse(response);
            verbose('PauseResponse');
        });
    }
    evaluateRequest(response, args) {
        verbose('EvaluateRequest');
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
            verbose('EvaluateResponse');
        });
    }
}
function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
function killTree(processId) {
    if (process.platform === 'win32') {
        const TASK_KILL = 'C:\\Windows\\System32\\taskkill.exe';
        // when killing a process in Windows its child processes are *not* killed but become root processes.
        // Therefore we use TASKKILL.EXE
        try {
            child_process_1.execSync(`${TASK_KILL} /F /T /PID ${processId}`);
        }
        catch (err) {
        }
    }
    else {
        // on linux and OS X we kill all direct and indirect child processes as well
        try {
            const cmd = path.join(__dirname, '../../../scripts/terminateProcess.sh');
            child_process_1.spawnSync(cmd, [processId.toString()]);
        }
        catch (err) {
        }
    }
}
vscode_debugadapter_1.DebugSession.run(GoDebugSession);
//# sourceMappingURL=goDebug.js.map