"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const typeConvertion_1 = require("../omnisharp/typeConvertion");
const debuggerEventsProtocol_1 = require("../coreclr-debug/debuggerEventsProtocol");
const vscode = require("vscode");
const serverUtils = require("../omnisharp/utils");
const protocol = require("../omnisharp/protocol");
const utils = require("../common");
const net = require("net");
const os = require("os");
const path = require("path");
let _testOutputChannel = undefined;
function getTestOutputChannel() {
    if (_testOutputChannel === undefined) {
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
function saveDirtyFiles() {
    return Promise.resolve(vscode.workspace.saveAll(/*includeUntitled*/ false));
}
function runTest(server, fileName, testMethod, testFrameworkName) {
    const request = {
        FileName: fileName,
        MethodName: testMethod,
        TestFrameworkName: testFrameworkName
    };
    return serverUtils.runTest(server, request)
        .then(response => response.Results);
}
function reportResults(results, output) {
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
    output.appendLine('');
    output.appendLine(`Total tests: ${totalTests}. Passed: ${totalPassed}. Failed: ${totalFailed}. Skipped: ${totalSkipped}`);
    output.appendLine('');
    return Promise.resolve();
}
// Run test through dotnet-test command. This function can be moved to a separate structure
function runDotnetTest(testMethod, fileName, testFrameworkName, server) {
    const output = getTestOutputChannel();
    output.show();
    output.appendLine(`Running test ${testMethod}...`);
    output.appendLine('');
    const listener = server.onTestMessage(e => {
        output.appendLine(e.Message);
    });
    saveDirtyFiles()
        .then(_ => runTest(server, fileName, testMethod, testFrameworkName))
        .then(results => reportResults(results, output))
        .then(() => listener.dispose())
        .catch(reason => {
        listener.dispose();
        vscode.window.showErrorMessage(`Failed to run test because ${reason}.`);
    });
}
exports.runDotnetTest = runDotnetTest;
function createLaunchConfiguration(program, args, cwd, debuggerEventsPipeName) {
    let debugOptions = vscode.workspace.getConfiguration('csharp').get('unitTestDebugingOptions');
    // Get the initial set of options from the workspace setting
    let result;
    if (typeof debugOptions === "object") {
        // clone the options object to avoid changing it
        result = JSON.parse(JSON.stringify(debugOptions));
    }
    else {
        result = {};
    }
    // Now fill in the rest of the options
    result.name = ".NET Test Launch";
    result.type = "coreclr";
    result.request = "launch";
    result.debuggerEventsPipeName = debuggerEventsPipeName;
    result.program = program;
    result.args = args;
    result.cwd = cwd;
    return result;
}
function getLaunchConfigurationForVSTest(server, fileName, testMethod, testFrameworkName, debugEventListener, output) {
    // Listen for test messages while getting start info.
    const listener = server.onTestMessage(e => {
        output.appendLine(e.Message);
    });
    const request = {
        FileName: fileName,
        MethodName: testMethod,
        TestFrameworkName: testFrameworkName
    };
    return serverUtils.debugTestGetStartInfo(server, request)
        .then(response => {
        listener.dispose();
        return createLaunchConfiguration(response.FileName, response.Arguments, response.WorkingDirectory, debugEventListener.pipePath());
    });
}
function getLaunchConfigurationForLegacy(server, fileName, testMethod, testFrameworkName, output) {
    // Listen for test messages while getting start info.
    const listener = server.onTestMessage(e => {
        output.appendLine(e.Message);
    });
    const request = {
        FileName: fileName,
        MethodName: testMethod,
        TestFrameworkName: testFrameworkName
    };
    return serverUtils.getTestStartInfo(server, request)
        .then(response => {
        listener.dispose();
        return createLaunchConfiguration(response.Executable, response.Argument, response.WorkingDirectory, null);
    });
}
function getLaunchConfiguration(server, debugType, fileName, testMethod, testFrameworkName, debugEventListener, output) {
    switch (debugType) {
        case 'legacy':
            return getLaunchConfigurationForLegacy(server, fileName, testMethod, testFrameworkName, output);
        case 'vstest':
            return getLaunchConfigurationForVSTest(server, fileName, testMethod, testFrameworkName, debugEventListener, output);
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
    const output = getTestOutputChannel();
    output.show();
    output.appendLine(`Debugging method '${testMethod}'...`);
    output.appendLine('');
    return saveDirtyFiles()
        .then(_ => serverUtils.requestProjectInformation(server, { FileName: fileName }))
        .then(projectInfo => {
        if (projectInfo.DotNetProject) {
            debugType = 'legacy';
            return Promise.resolve();
        }
        else if (projectInfo.MsBuildProject) {
            debugType = 'vstest';
            debugEventListener = new DebugEventListener(fileName, server, output);
            return debugEventListener.start();
        }
        else {
            throw new Error('Expected project.json or .csproj project.');
        }
    })
        .then(() => getLaunchConfiguration(server, debugType, fileName, testMethod, testFrameworkName, debugEventListener, output))
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
    if (node.Features === undefined) {
        return;
    }
    let testFeature = node.Features.find(value => (value.Name == 'XunitTestMethod' || value.Name == 'NUnitTestMethod' || value.Name == 'MSTestMethod'));
    if (testFeature) {
        // this test method has a test feature
        let testFrameworkName = 'xunit';
        if (testFeature.Name == 'NunitTestMethod') {
            testFrameworkName = 'nunit';
        }
        else if (testFeature.Name == 'MSTestMethod') {
            testFrameworkName = 'mstest';
        }
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