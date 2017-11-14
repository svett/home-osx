"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const debuggerEventsProtocol_1 = require("../coreclr-debug/debuggerEventsProtocol");
const vscode = require("vscode");
const serverUtils = require("../omnisharp/utils");
const protocol = require("../omnisharp/protocol");
const utils = require("../common");
const net = require("net");
const os = require("os");
const path = require("path");
const abstractProvider_1 = require("./abstractProvider");
const TelemetryReportingDelay = 2 * 60 * 1000; // two minutes
class TestManager extends abstractProvider_1.default {
    constructor(server, reporter) {
        super(server, reporter);
        this._telemetryIntervalId = undefined;
        // register commands
        let d1 = vscode.commands.registerCommand('dotnet.test.run', (testMethod, fileName, testFrameworkName) => this._runDotnetTest(testMethod, fileName, testFrameworkName));
        let d2 = vscode.commands.registerCommand('dotnet.test.debug', (testMethod, fileName, testFrameworkName) => this._debugDotnetTest(testMethod, fileName, testFrameworkName));
        this._telemetryIntervalId = setInterval(() => this._reportTelemetry(), TelemetryReportingDelay);
        let d3 = new vscode.Disposable(() => {
            if (this._telemetryIntervalId !== undefined) {
                // Stop reporting telemetry
                clearInterval(this._telemetryIntervalId);
                this._telemetryIntervalId = undefined;
                this._reportTelemetry();
            }
        });
        this.addDisposables(d1, d2, d3);
    }
    _getOutputChannel() {
        if (this._channel === undefined) {
            this._channel = vscode.window.createOutputChannel(".NET Test Log");
            this.addDisposables(this._channel);
        }
        return this._channel;
    }
    _recordRunRequest(testFrameworkName) {
        if (this._runCounts === undefined) {
            this._runCounts = {};
        }
        let count = this._runCounts[testFrameworkName];
        if (!count) {
            count = 1;
        }
        else {
            count += 1;
        }
        this._runCounts[testFrameworkName] = count;
    }
    _recordDebugRequest(testFrameworkName) {
        if (this._debugCounts === undefined) {
            this._debugCounts = {};
        }
        let count = this._debugCounts[testFrameworkName];
        if (!count) {
            count = 1;
        }
        else {
            count += 1;
        }
        this._debugCounts[testFrameworkName] = count;
    }
    _reportTelemetry() {
        if (this._runCounts) {
            this._reporter.sendTelemetryEvent('RunTest', null, this._runCounts);
        }
        if (this._debugCounts) {
            this._reporter.sendTelemetryEvent('DebugTest', null, this._debugCounts);
        }
        this._runCounts = undefined;
        this._debugCounts = undefined;
    }
    _saveDirtyFiles() {
        return Promise.resolve(vscode.workspace.saveAll(/*includeUntitled*/ false));
    }
    _runTest(fileName, testMethod, testFrameworkName, targetFrameworkVersion) {
        const request = {
            FileName: fileName,
            MethodName: testMethod,
            TestFrameworkName: testFrameworkName,
            TargetFrameworkVersion: targetFrameworkVersion
        };
        return serverUtils.runTest(this._server, request)
            .then(response => response.Results);
    }
    _reportResults(results) {
        const totalTests = results.length;
        let totalPassed = 0, totalFailed = 0, totalSkipped = 0;
        for (let result of results) {
            switch (result.Outcome) {
                case protocol.V2.TestOutcomes.Failed:
                    totalFailed += 1;
                    break;
                case protocol.V2.TestOutcomes.Passed:
                    totalPassed += 1;
                    break;
                case protocol.V2.TestOutcomes.Skipped:
                    totalSkipped += 1;
                    break;
            }
        }
        const output = this._getOutputChannel();
        output.appendLine('');
        output.appendLine(`Total tests: ${totalTests}. Passed: ${totalPassed}. Failed: ${totalFailed}. Skipped: ${totalSkipped}`);
        output.appendLine('');
        return Promise.resolve();
    }
    _runDotnetTest(testMethod, fileName, testFrameworkName) {
        const output = this._getOutputChannel();
        output.show();
        output.appendLine(`Running test ${testMethod}...`);
        output.appendLine('');
        const listener = this._server.onTestMessage(e => {
            output.appendLine(e.Message);
        });
        this._saveDirtyFiles()
            .then(_ => this._recordRunRequest(testFrameworkName))
            .then(_ => serverUtils.requestProjectInformation(this._server, { FileName: fileName }))
            .then(projectInfo => {
            let targetFrameworkVersion;
            if (projectInfo.DotNetProject) {
                targetFrameworkVersion = undefined;
            }
            else if (projectInfo.MsBuildProject) {
                targetFrameworkVersion = projectInfo.MsBuildProject.TargetFramework;
            }
            else {
                throw new Error('Expected project.json or .csproj project.');
            }
            return this._runTest(fileName, testMethod, testFrameworkName, targetFrameworkVersion);
        })
            .then(results => this._reportResults(results))
            .then(() => listener.dispose())
            .catch(reason => {
            listener.dispose();
            vscode.window.showErrorMessage(`Failed to run test because ${reason}.`);
        });
    }
    _createLaunchConfiguration(program, args, cwd, debuggerEventsPipeName) {
        let debugOptions = vscode.workspace.getConfiguration('csharp').get('unitTestDebuggingOptions');
        // Get the initial set of options from the workspace setting
        let result;
        if (typeof debugOptions === "object") {
            // clone the options object to avoid changing it
            result = JSON.parse(JSON.stringify(debugOptions));
        }
        else {
            result = {};
        }
        if (!result.type) {
            result.type = "coreclr";
        }
        // Now fill in the rest of the options
        result.name = ".NET Test Launch";
        result.request = "launch";
        result.debuggerEventsPipeName = debuggerEventsPipeName;
        result.program = program;
        result.args = args;
        result.cwd = cwd;
        return result;
    }
    _getLaunchConfigurationForVSTest(fileName, testMethod, testFrameworkName, targetFrameworkVersion, debugEventListener) {
        const output = this._getOutputChannel();
        // Listen for test messages while getting start info.
        const listener = this._server.onTestMessage(e => {
            output.appendLine(e.Message);
        });
        const request = {
            FileName: fileName,
            MethodName: testMethod,
            TestFrameworkName: testFrameworkName,
            TargetFrameworkVersion: targetFrameworkVersion
        };
        return serverUtils.debugTestGetStartInfo(this._server, request)
            .then(response => {
            listener.dispose();
            return this._createLaunchConfiguration(response.FileName, response.Arguments, response.WorkingDirectory, debugEventListener.pipePath());
        });
    }
    _getLaunchConfigurationForLegacy(fileName, testMethod, testFrameworkName, targetFrameworkVersion) {
        const output = this._getOutputChannel();
        // Listen for test messages while getting start info.
        const listener = this._server.onTestMessage(e => {
            output.appendLine(e.Message);
        });
        const request = {
            FileName: fileName,
            MethodName: testMethod,
            TestFrameworkName: testFrameworkName,
            TargetFrameworkVersion: targetFrameworkVersion
        };
        return serverUtils.getTestStartInfo(this._server, request)
            .then(response => {
            listener.dispose();
            return this._createLaunchConfiguration(response.Executable, response.Argument, response.WorkingDirectory, null);
        });
    }
    _getLaunchConfiguration(debugType, fileName, testMethod, testFrameworkName, targetFrameworkVersion, debugEventListener) {
        switch (debugType) {
            case 'legacy':
                return this._getLaunchConfigurationForLegacy(fileName, testMethod, testFrameworkName, targetFrameworkVersion);
            case 'vstest':
                return this._getLaunchConfigurationForVSTest(fileName, testMethod, testFrameworkName, targetFrameworkVersion, debugEventListener);
            default:
                throw new Error(`Unexpected debug type: ${debugType}`);
        }
    }
    _debugDotnetTest(testMethod, fileName, testFrameworkName) {
        // We support to styles of 'dotnet test' for debugging: The legacy 'project.json' testing, and the newer csproj support
        // using VS Test. These require a different level of communication.
        let debugType;
        let debugEventListener = null;
        let targetFrameworkVersion;
        const output = this._getOutputChannel();
        output.show();
        output.appendLine(`Debugging method '${testMethod}'...`);
        output.appendLine('');
        return this._saveDirtyFiles()
            .then(_ => this._recordDebugRequest(testFrameworkName))
            .then(_ => serverUtils.requestProjectInformation(this._server, { FileName: fileName }))
            .then(projectInfo => {
            if (projectInfo.DotNetProject) {
                debugType = 'legacy';
                targetFrameworkVersion = '';
                return Promise.resolve();
            }
            else if (projectInfo.MsBuildProject) {
                debugType = 'vstest';
                targetFrameworkVersion = projectInfo.MsBuildProject.TargetFramework;
                debugEventListener = new DebugEventListener(fileName, this._server, output);
                return debugEventListener.start();
            }
            else {
                throw new Error('Expected project.json or .csproj project.');
            }
        })
            .then(() => this._getLaunchConfiguration(debugType, fileName, testMethod, testFrameworkName, targetFrameworkVersion, debugEventListener))
            .then(config => {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fileName));
            return vscode.debug.startDebugging(workspaceFolder, config);
        })
            .catch(reason => {
            vscode.window.showErrorMessage(`Failed to start debugger: ${reason}`);
            if (debugEventListener != null) {
                debugEventListener.close();
            }
        });
    }
}
exports.default = TestManager;
class DebugEventListener {
    constructor(fileName, server, outputChannel) {
        this._isClosed = false;
        this._fileName = fileName;
        this._server = server;
        this._outputChannel = outputChannel;
        // NOTE: The max pipe name on OSX is fairly small, so this name shouldn't bee too long.
        const pipeSuffix = "TestDebugEvents-" + process.pid;
        if (os.platform() === 'win32') {
            this._pipePath = "\\\\.\\pipe\\Microsoft.VSCode.CSharpExt." + pipeSuffix;
        }
        else {
            this._pipePath = path.join(utils.getExtensionPath(), "." + pipeSuffix);
        }
    }
    start() {
        // We use our process id as part of the pipe name, so if we still somehow have an old instance running, close it.
        if (DebugEventListener.s_activeInstance !== null) {
            DebugEventListener.s_activeInstance.close();
        }
        DebugEventListener.s_activeInstance = this;
        this._serverSocket = net.createServer((socket) => {
            socket.on('data', (buffer) => {
                let event;
                try {
                    event = debuggerEventsProtocol_1.DebuggerEventsProtocol.decodePacket(buffer);
                }
                catch (e) {
                    this._outputChannel.appendLine("Warning: Invalid event received from debugger");
                    return;
                }
                switch (event.eventType) {
                    case debuggerEventsProtocol_1.DebuggerEventsProtocol.EventType.ProcessLaunched:
                        let processLaunchedEvent = (event);
                        this._outputChannel.appendLine(`Started debugging process #${processLaunchedEvent.targetProcessId}.`);
                        this.onProcessLaunched(processLaunchedEvent.targetProcessId);
                        break;
                    case debuggerEventsProtocol_1.DebuggerEventsProtocol.EventType.DebuggingStopped:
                        this._outputChannel.appendLine("Debugging complete.\n");
                        this.onDebuggingStopped();
                        break;
                }
            });
            socket.on('end', () => {
                this.onDebuggingStopped();
            });
        });
        return this.removeSocketFileIfExists().then(() => {
            return new Promise((resolve, reject) => {
                let isStarted = false;
                this._serverSocket.on('error', (err) => {
                    if (!isStarted) {
                        reject(err.message);
                    }
                    else {
                        this._outputChannel.appendLine("Warning: Communications error on debugger event channel. " + err.message);
                    }
                });
                this._serverSocket.listen(this._pipePath, () => {
                    isStarted = true;
                    resolve();
                });
            });
        });
    }
    pipePath() {
        return this._pipePath;
    }
    close() {
        if (this === DebugEventListener.s_activeInstance) {
            DebugEventListener.s_activeInstance = null;
        }
        if (this._isClosed) {
            return;
        }
        this._isClosed = true;
        if (this._serverSocket !== null) {
            this._serverSocket.close();
        }
    }
    onProcessLaunched(targetProcessId) {
        let request = {
            FileName: this._fileName,
            TargetProcessId: targetProcessId
        };
        const disposable = this._server.onTestMessage(e => {
            this._outputChannel.appendLine(e.Message);
        });
        serverUtils.debugTestLaunch(this._server, request)
            .then(_ => {
            disposable.dispose();
        });
    }
    onDebuggingStopped() {
        if (this._isClosed) {
            return;
        }
        let request = {
            FileName: this._fileName
        };
        serverUtils.debugTestStop(this._server, request);
        this.close();
    }
    removeSocketFileIfExists() {
        if (os.platform() === 'win32') {
            // Win32 doesn't use the file system for pipe names
            return Promise.resolve();
        }
        else {
            return utils.deleteIfExists(this._pipePath);
        }
    }
}
DebugEventListener.s_activeInstance = null;
//# sourceMappingURL=dotnetTest.js.map