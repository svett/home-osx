/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_debugadapter_1 = require('vscode-debugadapter');
var fs_1 = require('fs');
var path_1 = require('path');
var path = require('path');
var ruby_1 = require('./ruby');
var common_1 = require('./common');
var helper_1 = require('./helper');
var RubyDebugSession = (function (_super) {
    __extends(RubyDebugSession, _super);
    /**
     * Creates a new debug adapter.
     * We configure the default implementation of a debug adapter here
     * by specifying this this 'debugger' uses zero-based lines and columns.
     */
    function RubyDebugSession() {
        _super.call(this);
        this._breakpointId = 1000;
        this._threadId = 2;
        this._frameId = 0;
        this._firstSuspendReceived = false;
        this._activeFileData = new Map();
        // maps from sourceFile to array of Breakpoints
        this._breakPoints = new Map();
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(false);
        this._variableHandles = new vscode_debugadapter_1.Handles();
    }
    /**
     * The 'initialize' request is the first request called by the frontend
     * to interrogate the features the debug adapter provides.
     */
    RubyDebugSession.prototype.initializeRequest = function (response, args) {
        // This debug adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        //response.body.supportsFunctionBreakpoints = true;
        //currently cond bp doesn't work - but that doesn't really matter, because neither does this call
        response.body.supportsConditionalBreakpoints = false;
        this.sendResponse(response);
    };
    RubyDebugSession.prototype.setupProcessHanlders = function () {
        var _this = this;
        this.rubyProcess.on('debuggerComplete', function () {
            _this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        }).on('executableOutput', function (data) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(data.toString(), 'stdout'));
        }).on('executableStdErr', function (error) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent(error.toString(), 'stderr'));
        }).on('nonTerminalError', function (error) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent("Debugger error: " + error + '\n', 'stderr'));
        }).on('breakpoint', function (result) {
            _this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', result.threadId));
        }).on('exception', function (result) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent("\nException raised: [" + result.type + "]: " + result.message + "\n", 'stderr'));
            _this.sendEvent(new vscode_debugadapter_1.StoppedEvent('exception', result.threadId, result.type + ": " + result.message));
        }).on('terminalError', function (error) {
            _this.sendEvent(new vscode_debugadapter_1.OutputEvent("Debugger terminal error: " + error));
            _this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        });
    };
    RubyDebugSession.prototype.launchRequest = function (response, args) {
        var _this = this;
        this.debugMode = common_1.Mode.launch;
        this.requestArguments = args;
        this.rubyProcess = new ruby_1.RubyProcess(common_1.Mode.launch, args);
        this.rubyProcess.on('debuggerConnect', function () {
            _this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
            _this.sendResponse(response);
        }).on('suspended', function (result) {
            if (args.stopOnEntry && !_this._firstSuspendReceived) {
                _this.sendEvent(new vscode_debugadapter_1.StoppedEvent('entry', result.threadId));
            }
            else {
                _this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', result.threadId));
            }
            _this._firstSuspendReceived = true;
        });
        this.setupProcessHanlders();
        if (args.showDebuggerOutput) {
            this.rubyProcess.on('debuggerOutput', function (data) {
                _this.sendEvent(new vscode_debugadapter_1.OutputEvent(data.toString() + '\n', 'console'));
            });
        }
    };
    RubyDebugSession.prototype.attachRequest = function (response, args) {
        var _this = this;
        this.requestArguments = args;
        this.debugMode = common_1.Mode.attach;
        this.rubyProcess = new ruby_1.RubyProcess(common_1.Mode.attach, args);
        this.rubyProcess.on('debuggerConnect', function () {
            _this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
            _this.sendResponse(response);
        }).on('suspended', function (result) {
            _this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', result.threadId));
        });
        this.setupProcessHanlders();
    };
    // Executed after all breakpints have been set by VS Code
    RubyDebugSession.prototype.configurationDoneRequest = function (response, args) {
        this.rubyProcess.Run('start');
        this.sendResponse(response);
    };
    RubyDebugSession.prototype.setExceptionBreakPointsRequest = function (response, args) {
        if (args.filters.indexOf('all') >= 0) {
            //Exception is the root of all (Ruby) exceptions - this is the best we can do
            //If someone makes their own exception class and doesn't inherit from
            //Exception, then they really didn't expect things to work properly
            //anyway.
            //We don't do anything with the return from this, but we
            //have to add an expectation for the output.
            this.rubyProcess.Enqueue('catch Exception').then(function () { return 1; });
        }
        else {
            this.rubyProcess.Run('catch off');
        }
        this.sendResponse(response);
    };
    RubyDebugSession.prototype.setBreakPointsRequest = function (response, args) {
        var _this = this;
        var path = this.convertClientPathToDebugger(args.source.path);
        //to ensure that breakpoints with altered conditions are set, it is
        //best to remove all and add them back.
        //In preperation for when they're working.
        if (this._breakPoints.get(path)) {
            var deletePromises = this._breakPoints.get(path).map(function (bp) { return _this.rubyProcess.Enqueue('delete ' + bp.id); });
            //this will return before the adding (if any) completes
            Promise.all(deletePromises).then(function () { return _this._breakPoints.delete(path); });
        }
        var breakpointAddPromises = args.breakpoints.map(function (b) {
            //let conditionString =  b.condition ? ' if ' + b.condition : '';
            //return this.rubyProcess.Enqueue('break ' + path + ':' + b.line + conditionString);
            return _this.rubyProcess.Enqueue('break ' + path + ':' + b.line);
        });
        Promise.all(breakpointAddPromises).then(function (values) {
            var breakpoints = values.map(function (attributes) {
                var bp = new vscode_debugadapter_1.Breakpoint(true, _this.convertDebuggerLineToClient(+attributes.location.split(':')[1]));
                bp.id = +attributes.no;
                return bp;
            });
            _this._breakPoints.set(path, breakpoints);
            response.body = {
                breakpoints: breakpoints
            };
            _this.sendResponse(response);
        });
    };
    RubyDebugSession.prototype.threadsRequest = function (response) {
        var _this = this;
        this.rubyProcess.Enqueue('thread list').then(function (results) {
            _this._threadId = results[0].id;
            response.body = {
                threads: results.map(function (thread) { return new vscode_debugadapter_1.Thread(+thread.id, 'Thread ' + thread.id); })
            };
            _this.sendResponse(response);
        });
    };
    // Called by VS Code after a StoppedEvent
    /** StackTrace request; value of command field is 'stackTrace'.
        The request returns a stacktrace from the current execution state.
    */
    RubyDebugSession.prototype.stackTraceRequest = function (response, args) {
        var _this = this;
        this.rubyProcess.Enqueue('where').then(function (results) {
            //drop rdbug frames
            results = results.filter(function (stack) { return !(helper_1.endsWith(stack.file, '/rdebug-ide', null) ||
                helper_1.endsWith(stack.file, '/ruby-debug-ide.rb', null) ||
                (_this.debugMode == common_1.Mode.attach &&
                    path.normalize(stack.file).toLocaleLowerCase().indexOf(path.normalize(_this.requestArguments.remoteWorkspaceRoot).toLocaleLowerCase()) === -1)); });
            //get the current frame
            results.some(function (stack) { return stack.current ? _this._frameId = +stack.no : 0; });
            //only read the file if we don't have it already
            results.forEach(function (stack) {
                if (!_this._activeFileData.has(_this.convertDebuggerPathToClient(stack.file))) {
                    _this._activeFileData.set(_this.convertDebuggerPathToClient(stack.file), fs_1.readFileSync(_this.convertDebuggerPathToClient(stack.file), 'utf8').split('\n'));
                }
            });
            response.body = {
                stackFrames: results.filter(function (stack) { return stack.file.indexOf('debug-ide') < 0; })
                    .map(function (stack) { return new vscode_debugadapter_1.StackFrame(+stack.no, _this._activeFileData.get(_this.convertDebuggerPathToClient(stack.file))[+stack.line - 1].trim(), new vscode_debugadapter_1.Source(path_1.basename(stack.file), _this.convertDebuggerPathToClient(stack.file)), _this.convertDebuggerLineToClient(+stack.line), 0); })
            };
            if (response.body.stackFrames.length) {
                _this.sendResponse(response);
            }
            else {
                _this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
            }
            return;
        });
    };
    RubyDebugSession.prototype.convertClientPathToDebugger = function (localPath) {
        if (this.debugMode == common_1.Mode.launch) {
            return localPath;
        }
        var relativePath = path.join(this.requestArguments.remoteWorkspaceRoot, localPath.substring(this.requestArguments.cwd.length));
        var sepIndex = this.requestArguments.remoteWorkspaceRoot.lastIndexOf('/');
        if (sepIndex !== -1) {
            // *inx or darwin
            relativePath = relativePath.replace(/\\/g, '/');
        }
        return relativePath;
    };
    RubyDebugSession.prototype.convertDebuggerPathToClient = function (serverPath) {
        if (this.debugMode == common_1.Mode.launch) {
            return serverPath;
        }
        // Path.join will convert the path using local OS preferred separator
        var relativePath = path.join(this.requestArguments.cwd, serverPath.substring(this.requestArguments.remoteWorkspaceRoot.length));
        return relativePath;
    };
    RubyDebugSession.prototype.switchFrame = function (frameId) {
        if (frameId === this._frameId)
            return;
        this._frameId = frameId;
        this.rubyProcess.Run('frame ' + frameId);
    };
    RubyDebugSession.prototype.varyVariable = function (variable) {
        if (variable.type === 'String') {
            variable.hasChildren = false;
            variable.value = "'" + variable.value.replace(/'/g, "\\'") + "'";
        }
        else if (variable.value && helper_1.startsWith(variable.value, '#<' + variable.type, 0)) {
            variable.value = variable.type;
        }
        return variable;
    };
    RubyDebugSession.prototype.createVariableReference = function (variables) {
        var _this = this;
        return variables.map(this.varyVariable).map(function (variable) { return ({
            name: variable.name,
            kind: variable.kind,
            type: variable.type,
            value: variable.value === undefined ? 'undefined' : variable.value,
            id: variable.objectId,
            variablesReference: variable.hasChildren === 'true' ? _this._variableHandles.create({ objectId: variable.objectId }) : 0
        }); });
    };
    /** Scopes request; value of command field is 'scopes'.
       The request returns the variable scopes for a given stackframe ID.
    */
    RubyDebugSession.prototype.scopesRequest = function (response, args) {
        //this doesn't work properly across threads.
        var _this = this;
        this.switchFrame(args.frameId);
        Promise.all([
            this.rubyProcess.Enqueue('var local'),
            this.rubyProcess.Enqueue('var global')
        ])
            .then(function (results) {
            var scopes = new Array();
            scopes.push(new vscode_debugadapter_1.Scope('Local', _this._variableHandles.create({ variables: _this.createVariableReference(results[0]) }), false));
            scopes.push(new vscode_debugadapter_1.Scope('Global', _this._variableHandles.create({ variables: _this.createVariableReference(results[1]) }), false));
            response.body = {
                scopes: scopes
            };
            _this.sendResponse(response);
        });
    };
    RubyDebugSession.prototype.variablesRequest = function (response, args) {
        var _this = this;
        var varRef = this._variableHandles.get(args.variablesReference);
        var varPromise;
        if (varRef.objectId) {
            varPromise = this.rubyProcess.Enqueue('var i ' + varRef.objectId).then(function (results) { return _this.createVariableReference(results); });
        }
        else {
            varPromise = Promise.resolve(varRef.variables);
        }
        varPromise.then(function (variables) {
            response.body = {
                variables: variables
            };
            _this.sendResponse(response);
        });
    };
    RubyDebugSession.prototype.continueRequest = function (response, args) {
        this.sendResponse(response);
        this.rubyProcess.Run('c');
    };
    RubyDebugSession.prototype.nextRequest = function (response, args) {
        this.sendResponse(response);
        this.rubyProcess.Run('next');
    };
    RubyDebugSession.prototype.stepInRequest = function (response) {
        this.sendResponse(response);
        this.rubyProcess.Run('step');
    };
    RubyDebugSession.prototype.pauseRequest = function (response) {
        this.sendResponse(response);
        this.rubyProcess.Run('pause');
    };
    RubyDebugSession.prototype.stepOutRequest = function (response) {
        this.sendResponse(response);
        //Not sure which command we should use, `finish` will execute all frames.
        this.rubyProcess.Run('finish');
    };
    /** Evaluate request; value of command field is 'evaluate'.
        Evaluates the given expression in the context of the top most stack frame.
        The expression has access to any variables and arguments this are in scope.
    */
    RubyDebugSession.prototype.evaluateRequest = function (response, args) {
        var _this = this;
        // TODO: this will often not work. Will try to call
        // Class.@variable which doesn't work.
        // need to tie it to the existing variablesReference set
        // That will required having ALL variables stored, which will also (hopefully) fix
        // the variable value mismatch between threads
        this.rubyProcess.Enqueue("eval " + args.expression).then(function (result) {
            if (helper_1.startsWith(result.value, '#<', 0)) {
            }
            response.body = {
                result: result.value,
                variablesReference: 0
            };
            _this.sendResponse(response);
        });
    };
    RubyDebugSession.prototype.disconnectRequest = function (response, args) {
        if (this.rubyProcess.state !== common_1.SocketClientState.closed) {
            this.rubyProcess.Run('quit');
        }
        this.sendResponse(response);
    };
    return RubyDebugSession;
}(vscode_debugadapter_1.DebugSession));
vscode_debugadapter_1.DebugSession.run(RubyDebugSession);
//# sourceMappingURL=main.js.map