/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const debuggerEventsProtocol_1 = require("../coreclr-debug/debuggerEventsProtocol");
const vscode = require("vscode");
const serverUtils = require("../omnisharp/utils");
const utils = require("../common");
const net = require("net");
const os = require("os");
const path = require("path");
let _testOutputChannel = undefined;
function getTestOutputChannel() {
    if (_testOutputChannel == undefined) {
        _testOutputChannel = vscode.window.createOutputChannel(".NET Test Log");
    }
    return _testOutputChannel;
}
function registerDotNetTestRunCommand(server) {
    return vscode.commands.registerCommand('dotnet.test.run', (testMethod, fileName, testFrameworkName) => runDotnetTest(testMethod, fileName, testFrameworkName, server));
}
exports.registerDotNetTestRunCommand = registerDotNetTestRunCommand;
function registerDotNetTestDebugCommand(server) {
    return vscode.commands.registerCommand('dotnet.test.debug', (testMethod, fileName, testFrameworkName) => debugDotnetTest(testMethod, fileName, testFrameworkName, server));
}
exports.registerDotNetTestDebugCommand = registerDotNetTestDebugCommand;
// Run test through dotnet-test command. This function can be moved to a separate structure
function runDotnetTest(testMethod, fileName, testFrameworkName, server) {
    const output = getTestOutputChannel();
    output.show();
    output.appendLine(`Running test ${testMethod}...`);
    const disposable = server.onTestMessage(e => {
        output.appendLine(e.Message);
    });
    const request = {
        FileName: fileName,
        MethodName: testMethod,
        TestFrameworkName: testFrameworkName
    };
    serverUtils.runTest(server, request)
        .then(response => {
        if (response.Pass) {
            output.appendLine('Test passed \n');
        }
        else {
            output.appendLine('Test failed \n');
        }
        disposable.dispose();
    }, reason => {
        vscode.window.showErrorMessage(`Failed to run test because ${reason}.`);
        disposable.dispose();
    });
}
exports.runDotnetTest = runDotnetTest;
function createLaunchConfiguration(program, argsString, cwd, debuggerEventsPipeName) {
    let args = utils.splitCommandLineArgs(argsString);
    return {
        // NOTE: uncomment this for vsdbg developement
        // debugServer: 4711,
        name: ".NET Test Launch",
        type: "coreclr",
        request: "launch",
        debuggerEventsPipeName: debuggerEventsPipeName,
        program,
        args,
        cwd,
        stopAtEntry: true
    };
}
function getLaunchConfigurationForVSTest(server, fileName, testMethod, testFrameworkName, debugEventListener) {
    const request = {
        FileName: fileName,
        MethodName: testMethod,
        TestFrameworkName: testFrameworkName
    };
    return serverUtils.debugTestGetStartInfo(server, request)
        .then(response => createLaunchConfiguration(response.FileName, response.Arguments, response.WorkingDirectory, debugEventListener.pipePath()));
}
function getLaunchConfigurationForLegacy(server, fileName, testMethod, testFrameworkName) {
    const request = {
        FileName: fileName,
        MethodName: testMethod,
        TestFrameworkName: testFrameworkName
    };
    return serverUtils.getTestStartInfo(server, request)
        .then(response => createLaunchConfiguration(response.Executable, response.Argument, response.WorkingDirectory, null));
}
function getLaunchConfiguration(server, debugType, fileName, testMethod, testFrameworkName, debugEventListener) {
    switch (debugType) {
        case "legacy":
            return getLaunchConfigurationForLegacy(server, fileName, testMethod, testFrameworkName);
        case "vstest":
            return getLaunchConfigurationForVSTest(server, fileName, testMethod, testFrameworkName, debugEventListener);
        default:
            throw new Error(`Unexpected debug type: ${debugType}`);
    }
}
// Run test through dotnet-test command with debugger attached
function debugDotnetTest(testMethod, fileName, testFrameworkName, server) {
    // We support to styles of 'dotnet test' for debugging: The legacy 'project.json' testing, and the newer csproj support
    // using VS Test. These require a different level of communication.
    let debugType;
    let debugEventListener = null;
    let outputChannel = getTestOutputChannel();
    outputChannel.appendLine(`Debugging method '${testMethod}'.`);
    return serverUtils.requestProjectInformation(server, { FileName: fileName })
        .then(projectInfo => {
        if (projectInfo.DotNetProject) {
            debugType = "legacy";
            return Promise.resolve();
        }
        else if (projectInfo.MsBuildProject) {
            debugType = "vstest";
            debugEventListener = new DebugEventListener(fileName, server, outputChannel);
            return debugEventListener.start();
        }
        else {
            throw new Error();
        }
    })
        .then(() => getLaunchConfiguration(server, debugType, fileName, testMethod, testFrameworkName, debugEventListener))
        .then(config => vscode.commands.executeCommand('vscode.startDebug', config))
        .catch(reason => {
        vscode.window.showErrorMessage(`Failed to start debugger: ${reason}`);
        if (debugEventListener != null) {
            debugEventListener.close();
        }
    });
}
exports.debugDotnetTest = debugDotnetTest;
function updateCodeLensForTest(bucket, fileName, node, isDebugEnable) {
    // backward compatible check: Features property doesn't present on older version OmniSharp
    if (node.Features == undefined) {
        return;
    }
    let testFeature = node.Features.find(value => (value.Name == 'XunitTestMethod' || value.Name == 'NUnitTestMethod'));
    if (testFeature) {
        // this test method has a test feature
        let testFrameworkName = testFeature.Name == 'XunitTestMethod' ? 'xunit' : 'nunit';
        bucket.push(new vscode.CodeLens(typeConvertion_1.toRange(node.Location), { title: "run test", command: 'dotnet.test.run', arguments: [testFeature.Data, fileName, testFrameworkName] }));
        if (isDebugEnable) {
            bucket.push(new vscode.CodeLens(typeConvertion_1.toRange(node.Location), { title: "debug test", command: 'dotnet.test.debug', arguments: [testFeature.Data, fileName, testFrameworkName] }));
        }
    }
}
exports.updateCodeLensForTest = updateCodeLensForTest;
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