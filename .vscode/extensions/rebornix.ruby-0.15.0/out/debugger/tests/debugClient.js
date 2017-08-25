/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const assert = require("assert");
const net = require("net");
const path = require("path");
const protocolClient_1 = require("./protocolClient");
class DebugClient extends protocolClient_1.ProtocolClient {
    /**
     * Creates a DebugClient object that provides a promise-based API to write
     * debug adapter tests.
     * A simple mocha example for setting and hitting a breakpoint in line 15 of a program 'test.js' looks like this:
     *
     * var dc;
     * setup(done => {
     *     dc = new DebugClient('node', './out/node/nodeDebug.js', 'node');
     *     dc.start(done);
     * });
     * teardown(done => {
     *     dc.stop(done);
     * });
     * test('should stop on a breakpoint', () => {
     *     return dc.hitBreakpoint({ program: "test.js" }, "test.js", 15);
     * });
     */
    constructor(runtime, executable, debugType) {
        super();
        this._runtime = runtime;
        this._executable = executable;
        this._enableStderr = false;
        this._debugType = debugType;
        this._supportsConfigurationDoneRequest = false;
    }
    // ---- life cycle --------------------------------------------------------------------------------------------------------
    /**
     * Starts a new debug adapter and sets up communication via stdin/stdout.
     * If a port number is specified the adapter is not launched but a connection to
     * a debug adapter running in server mode is established. This is useful for debugging
     * the adapter while running tests. For this reason all timeouts are disabled in server mode.
     */
    start(done, port) {
        if (typeof port === "number") {
            this._socket = net.createConnection(port, '127.0.0.1', () => {
                this.connect(this._socket, this._socket);
                done();
            });
        }
        else {
            this._adapterProcess = cp.spawn(this._runtime, [this._executable], {
                stdio: [
                    'pipe',
                    'pipe',
                    'pipe' // stderr
                ],
            });
            const sanitize = (s) => s.toString().replace(/\r?\n$/mg, '');
            this._adapterProcess.stderr.on('data', (data) => {
                if (this._enableStderr) {
                    console.log(sanitize(data));
                }
            });
            this._adapterProcess.on('error', (err) => {
                console.log(err);
            });
            this._adapterProcess.on('exit', (code, signal) => {
                if (code) {
                    // done(new Error("debug adapter exit code: " + code));
                }
            });
            this.connect(this._adapterProcess.stdout, this._adapterProcess.stdin);
            done();
        }
    }
    /**
     * Shutdown the debug adapter (or disconnect if in server mode).
     */
    stop(done) {
        if (this._adapterProcess) {
            this._adapterProcess.kill();
            this._adapterProcess = null;
        }
        if (this._socket) {
            this._socket.end();
            this._socket = null;
        }
        done();
    }
    // ---- protocol requests -------------------------------------------------------------------------------------------------
    initializeRequest(args) {
        if (!args) {
            args = {
                adapterID: this._debugType,
                linesStartAt1: true,
                columnsStartAt1: true,
                pathFormat: 'path'
            };
        }
        return this.send('initialize', args);
    }
    configurationDoneRequest(args) {
        return this.send('configurationDone', args);
    }
    launchRequest(args) {
        return this.send('launch', args);
    }
    attachRequest(args) {
        return this.send('attach', args);
    }
    disconnectRequest(args) {
        return this.send('disconnect', args);
    }
    setBreakpointsRequest(args) {
        return this.send('setBreakpoints', args);
    }
    setFunctionBreakpointsRequest(args) {
        return this.send('setFunctionBreakpoints', args);
    }
    setExceptionBreakpointsRequest(args) {
        return this.send('setExceptionBreakpoints', args);
    }
    continueRequest(args) {
        return this.send('continue', args);
    }
    nextRequest(args) {
        return this.send('next', args);
    }
    stepInRequest(args) {
        return this.send('stepIn', args);
    }
    stepOutRequest(args) {
        return this.send('stepOut', args);
    }
    pauseRequest(args) {
        return this.send('pause', args);
    }
    stacktraceRequest(args) {
        return this.send('stackTrace', args);
    }
    scopesRequest(args) {
        return this.send('scopes', args);
    }
    variablesRequest(args) {
        return this.send('variables', args);
    }
    sourceRequest(args) {
        return this.send('source', args);
    }
    threadsRequest() {
        return this.send('threads');
    }
    evaluateRequest(args) {
        return this.send('evaluate', args);
    }
    // ---- convenience methods -----------------------------------------------------------------------------------------------
    /*
     * Returns a promise that will resolve if an event with a specific type was received within the given timeout.
     * The promise will be rejected if a timeout occurs.
     */
    waitForEvent(eventType, timeout = 3000) {
        return new Promise((resolve, reject) => {
            this.on(eventType, event => {
                resolve(event);
            });
            if (!this._socket) {
                setTimeout(() => {
                    reject(new Error(`no event '${eventType}' received after ${timeout} ms`));
                }, timeout);
            }
        });
    }
    /*
     * Returns a promise that will resolve if an 'initialized' event was received within 3000ms
     * and a subsequent 'configurationDone' request was successfully executed.
     * The promise will be rejected if a timeout occurs or if the 'configurationDone' request fails.
     */
    configurationSequence() {
        return this.waitForEvent('initialized').then(event => {
            return this.configurationDone();
        });
    }
    /**
     * Returns a promise that will resolve if a 'initialize' and a 'launch' request were successful.
     */
    launch(args) {
        return this.initializeRequest().then(response => {
            if (response.body && response.body.supportsConfigurationDoneRequest) {
                this._supportsConfigurationDoneRequest = true;
            }
            return this.launchRequest(args);
        });
    }
    configurationDone() {
        if (this._supportsConfigurationDoneRequest) {
            return this.configurationDoneRequest();
        }
        else {
            // if debug adapter doesn't support the configurationDoneRequest we have to send the setExceptionBreakpointsRequest.
            return this.setExceptionBreakpointsRequest({ filters: ['all'] });
        }
    }
    /*
     * Returns a promise that will resolve if a 'stopped' event was received within 3000ms
     * and the event's reason and line number was asserted.
     * The promise will be rejected if a timeout occurs, the assertions fail, or if the 'stackTrace' request fails.
     */
    assertStoppedLocation(reason, expected) {
        return this.waitForEvent('stopped').then(event => {
            assert.equal(event.body.reason, reason);
            return this.stacktraceRequest({
                threadId: event.body.threadId
            });
        }).then(response => {
            const frame = response.body.stackFrames[0];
            if (typeof expected.path === 'string') {
                assert.equal(path.normalize(frame.source.path), path.normalize(expected.path), "stopped location: path mismatch");
            }
            if (typeof expected.line === 'number') {
                assert.equal(frame.line, expected.line, "stopped location: line mismatch");
            }
            if (typeof expected.column === 'number') {
                assert.equal(frame.column, expected.column, "stopped location: column mismatch");
            }
            return response;
        });
    }
    /*
     * Returns a promise that will resolve if enough output events with the given category have been received
     * and the concatenated data match the expected data.
     * The promise will be rejected as soon as the received data cannot match the expected data or if a timeout occurs.
     */
    assertOutput(category, expected, timeout = 3000) {
        return new Promise((resolve, reject) => {
            let output = '';
            this.on('output', event => {
                const e = event;
                if (e.body.category === category) {
                    output += e.body.output;
                    if (output.indexOf(expected) === 0) {
                        resolve(event);
                    }
                    else if (expected.indexOf(output) !== 0) {
                        const sanitize = (s) => s.toString().replace(/\r/mg, '\\r').replace(/\n/mg, '\\n');
                        reject(new Error(`received data '${sanitize(output)}' is not a prefix of the expected data '${sanitize(expected)}'`));
                    }
                }
            });
            if (!this._socket) {
                setTimeout(() => {
                    reject(new Error(`not enough output data received after ${timeout} ms`));
                }, timeout);
            }
        });
    }
    // ---- scenarios ---------------------------------------------------------------------------------------------------------
    /**
     * Returns a promise that will resolve if a configurable breakpoint has been hit within 3000ms
     * and the event's reason and line number was asserted.
     * The promise will be rejected if a timeout occurs, the assertions fail, or if the requests fails.
     */
    hitBreakpoint(launchArgs, location, expected) {
        return Promise.all([
            this.waitForEvent('initialized').then(event => {
                return this.setBreakpointsRequest({
                    lines: [location.line],
                    breakpoints: [{ line: location.line, column: location.column }],
                    source: { path: location.path }
                });
            }).then(response => {
                const bp = response.body.breakpoints[0];
                const verified = (typeof location.verified === 'boolean') ? location.verified : true;
                assert.equal(bp.verified, verified, "breakpoint verification mismatch: verified");
                if (bp.source && bp.source.path) {
                    assert.equal(path.normalize(bp.source.path), path.normalize(location.path), "breakpoint verification mismatch: path");
                }
                if (typeof bp.line === 'number') {
                    assert.equal(bp.line, location.line, "breakpoint verification mismatch: line");
                }
                if (typeof location.column === 'number' && typeof bp.column === 'number') {
                    assert.equal(bp.column, location.column, "breakpoint verification mismatch: column");
                }
                return this.configurationDone();
            }),
            this.launch(launchArgs)
        ]);
    }
}
exports.DebugClient = DebugClient;
//# sourceMappingURL=debugClient.js.map