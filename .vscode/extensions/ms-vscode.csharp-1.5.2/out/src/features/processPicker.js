/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * See LICENSE.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var os = require('os');
var vscode = require('vscode');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var AttachPicker = (function () {
    function AttachPicker(attachItemsProvider) {
        this.attachItemsProvider = attachItemsProvider;
    }
    AttachPicker.prototype.ShowAttachEntries = function () {
        return this.attachItemsProvider.getAttachItems()
            .then(function (processEntries) {
            var attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(function (chosenProcess) {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    };
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
var RemoteAttachPicker = (function () {
    function RemoteAttachPicker() {
    }
    Object.defineProperty(RemoteAttachPicker, "commColumnTitle", {
        get: function () { return Array(PsOutputParser.secondColumnCharacters).join("a"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RemoteAttachPicker, "linuxPsCommand", {
        get: function () { return "ps -axww -o pid=,comm=" + RemoteAttachPicker.commColumnTitle + ",args="; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RemoteAttachPicker, "osxPsCommand", {
        get: function () { return "ps -axww -o pid=,comm=" + RemoteAttachPicker.commColumnTitle + ",args= -c"; },
        enumerable: true,
        configurable: true
    });
    RemoteAttachPicker.ShowAttachEntries = function (args) {
        // Create remote attach output channel for errors.
        if (!RemoteAttachPicker._channel) {
            RemoteAttachPicker._channel = vscode.window.createOutputChannel('remote-attach');
        }
        else {
            RemoteAttachPicker._channel.clear();
        }
        // Grab selected name from UI
        // Args may be null if ran with F1
        var name = args ? args.name : null;
        if (!name) {
            // Config name not found. 
            return Promise.reject(new Error("Name not defined in current configuration."));
        }
        // Build path for launch.json to find pipeTransport
        var vscodeFolder = path.join(vscode.workspace.rootPath, '.vscode');
        var launchJsonPath = path.join(vscodeFolder, 'launch.json');
        // Read launch.json
        var json = JSON.parse(fs.readFileSync(launchJsonPath).toString());
        // Find correct pipeTransport via selected name
        var config;
        var configIdx;
        for (configIdx = 0; configIdx < json.configurations.length; ++configIdx) {
            if (json.configurations[configIdx].name === name) {
                config = json.configurations[configIdx];
                break;
            }
        }
        if (configIdx == json.configurations.length) {
            // Name not found in list of given configurations. 
            return Promise.reject(new Error(name + " could not be found in configurations."));
        }
        if (!config.pipeTransport || !config.pipeTransport.debuggerPath) {
            // Missing PipeTransport and debuggerPath, prompt if user wanted to just do local attach.
            return Promise.reject(new Error("Configuration \"" + name + "\" in launch.json does not have a " +
                "pipeTransport argument with debuggerPath for pickRemoteProcess. Use pickProcess for local attach."));
        }
        else {
            var pipeProgram = config.pipeTransport.pipeProgram;
            var pipeArgs = config.pipeTransport.pipeArgs;
            var platformSpecificPipeTransportOptions = RemoteAttachPicker.getPlatformSpecificPipeTransportOptions(config);
            if (platformSpecificPipeTransportOptions) {
                pipeProgram = platformSpecificPipeTransportOptions.pipeProgram || pipeProgram;
                pipeArgs = platformSpecificPipeTransportOptions.pipeArgs || pipeArgs;
            }
            var argList = RemoteAttachPicker.createArgumentList(pipeArgs);
            var pipeCmd = "\"" + pipeProgram + "\" " + argList;
            return RemoteAttachPicker.getRemoteOSAndProcesses(pipeCmd).then(function (processes) {
                var attachPickOptions = {
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: "Select the process to attach to"
                };
                return vscode.window.showQuickPick(processes, attachPickOptions).then(function (item) {
                    return item ? item.id : null;
                });
            });
        }
    };
    RemoteAttachPicker.createArgumentList = function (args) {
        var ret = "";
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var arg = args_1[_i];
            if (ret) {
                ret += " ";
            }
            ret += "\"" + arg + "\"";
        }
        return ret;
    };
    RemoteAttachPicker.getPlatformSpecificPipeTransportOptions = function (config) {
        var osPlatform = os.platform();
        if (osPlatform == "darwin" && config.pipeTransport.osx) {
            return config.pipeTransport.osx;
        }
        else if (osPlatform == "linux" && config.pipeTransport.linux) {
            return config.pipeTransport.linux;
        }
        else if (osPlatform == "win32" && config.pipeTransport.windows) {
            return config.pipeTransport.windows;
        }
        return null;
    };
    RemoteAttachPicker.getRemoteOSAndProcesses = function (pipeCmd) {
        // Commands to get OS and processes
        var command = ("uname && if [ $(uname) == \"Linux\" ] ; then " + RemoteAttachPicker.linuxPsCommand + " ; elif [ $(uname) == \"Darwin\" ] ; ") +
            ("then " + RemoteAttachPicker.osxPsCommand + "; fi");
        return execChildProcessAndOutputErrorToChannel(pipeCmd + " \"" + command + "\"", null, RemoteAttachPicker._channel).then(function (output) {
            // OS will be on first line
            // Processess will follow if listed
            var lines = output.split(os.EOL);
            if (lines.length == 0) {
                return Promise.reject(new Error("Pipe transport failed to get OS and processes."));
            }
            else {
                var remoteOS = lines[0].replace(/[\r\n]+/g, '');
                if (remoteOS != "Linux" && remoteOS != "Darwin") {
                    return Promise.reject(new Error("Operating system \"" + remoteOS + "\"\" not supported."));
                }
                // Only got OS from uname
                if (lines.length == 1) {
                    return Promise.reject(new Error("Transport attach could not obtain processes list."));
                }
                else {
                    var processes = lines.slice(1);
                    return sortProcessEntries(PsOutputParser.parseProcessFromPsArray(processes), remoteOS);
                }
            }
        });
    };
    RemoteAttachPicker.getRemoteProcesses = function (pipeCmd, os) {
        var psCommand = os === 'darwin' ? RemoteAttachPicker.osxPsCommand : RemoteAttachPicker.linuxPsCommand;
        return execChildProcessAndOutputErrorToChannel(pipeCmd + " " + psCommand, null, RemoteAttachPicker._channel).then(function (output) {
            return sortProcessEntries(PsOutputParser.parseProcessFromPs(output), os);
        });
    };
    RemoteAttachPicker._channel = null;
    return RemoteAttachPicker;
}());
exports.RemoteAttachPicker = RemoteAttachPicker;
var Process = (function () {
    function Process(name, pid, commandLine) {
        this.name = name;
        this.pid = pid;
        this.commandLine = commandLine;
    }
    Process.prototype.toAttachItem = function () {
        return {
            label: this.name,
            description: this.pid,
            detail: this.commandLine,
            id: this.pid
        };
    };
    return Process;
}());
var DotNetAttachItemsProviderFactory = (function () {
    function DotNetAttachItemsProviderFactory() {
    }
    DotNetAttachItemsProviderFactory.Get = function () {
        if (os.platform() === 'win32') {
            return new WmicAttachItemsProvider();
        }
        else {
            return new PsAttachItemsProvider();
        }
    };
    return DotNetAttachItemsProviderFactory;
}());
exports.DotNetAttachItemsProviderFactory = DotNetAttachItemsProviderFactory;
var DotNetAttachItemsProvider = (function () {
    function DotNetAttachItemsProvider() {
    }
    DotNetAttachItemsProvider.prototype.getAttachItems = function () {
        return this.getInternalProcessEntries().then(function (processEntries) {
            return sortProcessEntries(processEntries, os.platform());
        });
    };
    return DotNetAttachItemsProvider;
}());
function sortProcessEntries(processEntries, osPlatform) {
    // localeCompare is significantly slower than < and > (2000 ms vs 80 ms for 10,000 elements)
    // We can change to localeCompare if this becomes an issue
    var dotnetProcessName = (osPlatform === 'win32') ? 'dotnet.exe' : 'dotnet';
    processEntries = processEntries.sort(function (a, b) {
        if (a.name.toLowerCase() === dotnetProcessName && b.name.toLowerCase() === dotnetProcessName) {
            return a.commandLine.toLowerCase() < b.commandLine.toLowerCase() ? -1 : 1;
        }
        else if (a.name.toLowerCase() === dotnetProcessName) {
            return -1;
        }
        else if (b.name.toLowerCase() === dotnetProcessName) {
            return 1;
        }
        else {
            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        }
    });
    var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
    return attachItems;
}
var PsAttachItemsProvider = (function (_super) {
    __extends(PsAttachItemsProvider, _super);
    function PsAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    PsAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        // the BSD version of ps uses '-c' to have 'comm' only output the executable name and not
        // the full path. The Linux version of ps has 'comm' to only display the name of the executable
        // Note that comm on Linux systems is truncated to 16 characters:
        // https://bugzilla.redhat.com/show_bug.cgi?id=429565
        // Since 'args' contains the full path to the executable, even if truncated, searching will work as desired.
        var psCommand = os.platform() === 'darwin' ? RemoteAttachPicker.osxPsCommand : RemoteAttachPicker.linuxPsCommand;
        return execChildProcess(psCommand, null).then(function (processes) {
            return PsOutputParser.parseProcessFromPs(processes);
        });
    };
    return PsAttachItemsProvider;
}(DotNetAttachItemsProvider));
exports.PsAttachItemsProvider = PsAttachItemsProvider;
var PsOutputParser = (function () {
    function PsOutputParser() {
    }
    Object.defineProperty(PsOutputParser, "secondColumnCharacters", {
        // Perf numbers:
        // OS X 10.10
        // | # of processes | Time (ms) |
        // |----------------+-----------|
        // |            272 |        52 |
        // |            296 |        49 |
        // |            384 |        53 |
        // |            784 |       116 |
        //
        // Ubuntu 16.04
        // | # of processes | Time (ms) |
        // |----------------+-----------|
        // |            232 |        26 |
        // |            336 |        34 |
        // |            736 |        62 |
        // |           1039 |       115 |
        // |           1239 |       182 |
        // ps outputs as a table. With the option "ww", ps will use as much width as necessary.
        // However, that only applies to the right-most column. Here we use a hack of setting
        // the column header to 50 a's so that the second column will have at least that many
        // characters. 50 was chosen because that's the maximum length of a "label" in the
        // QuickPick UI in VSCode.
        get: function () { return 50; },
        enumerable: true,
        configurable: true
    });
    // Only public for tests.
    PsOutputParser.parseProcessFromPs = function (processes) {
        var lines = processes.split(os.EOL);
        var processEntries = [];
        // lines[0] is the header of the table
        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            var process_1 = this.parseLineFromPs(line);
            if (process_1) {
                processEntries.push(process_1);
            }
        }
        return processEntries;
    };
    PsOutputParser.parseProcessFromPsArray = function (lines) {
        var processEntries = [];
        // lines[0] is the header of the table
        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            var process_2 = this.parseLineFromPs(line);
            if (process_2) {
                processEntries.push(process_2);
            }
        }
        return processEntries;
    };
    PsOutputParser.parseLineFromPs = function (line) {
        // Explanation of the regex:
        //   - any leading whitespace
        //   - PID
        //   - whitespace
        //   - executable name --> this is PsAttachItemsProvider.secondColumnCharacters - 1 because ps reserves one character
        //     for the whitespace separator
        //   - whitespace
        //   - args (might be empty)
        var psEntry = new RegExp("^\\s*([0-9]+)\\s+(.{" + (PsOutputParser.secondColumnCharacters - 1) + "})\\s+(.*)$");
        var matches = psEntry.exec(line);
        if (matches && matches.length === 4) {
            var pid = matches[1].trim();
            var executable = matches[2].trim();
            var cmdline = matches[3].trim();
            return new Process(executable, pid, cmdline);
        }
    };
    return PsOutputParser;
}());
exports.PsOutputParser = PsOutputParser;
var WmicAttachItemsProvider = (function (_super) {
    __extends(WmicAttachItemsProvider, _super);
    function WmicAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    WmicAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var wmicCommand = 'wmic process get Name,ProcessId,CommandLine /FORMAT:list';
        return execChildProcess(wmicCommand, null).then(function (processes) {
            return WmicOutputParser.parseProcessFromWmic(processes);
        });
    };
    return WmicAttachItemsProvider;
}(DotNetAttachItemsProvider));
exports.WmicAttachItemsProvider = WmicAttachItemsProvider;
var WmicOutputParser = (function () {
    function WmicOutputParser() {
    }
    Object.defineProperty(WmicOutputParser, "wmicNameTitle", {
        // Perf numbers on Win10:
        // | # of processes | Time (ms) |
        // |----------------+-----------|
        // |            309 |       413 |
        // |            407 |       463 |
        // |            887 |       746 |
        // |           1308 |      1132 |
        get: function () { return 'Name'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WmicOutputParser, "wmicCommandLineTitle", {
        get: function () { return 'CommandLine'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WmicOutputParser, "wmicPidTitle", {
        get: function () { return 'ProcessId'; },
        enumerable: true,
        configurable: true
    });
    // Only public for tests.
    WmicOutputParser.parseProcessFromWmic = function (processes) {
        var lines = processes.split(os.EOL);
        var currentProcess = new Process(null, null, null);
        var processEntries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            this.parseLineFromWmic(line, currentProcess);
            // Each entry of processes has ProcessId as the last line
            if (line.startsWith(WmicOutputParser.wmicPidTitle)) {
                processEntries.push(currentProcess);
                currentProcess = new Process(null, null, null);
            }
        }
        return processEntries;
    };
    WmicOutputParser.parseLineFromWmic = function (line, process) {
        var splitter = line.indexOf('=');
        if (splitter >= 0) {
            var key = line.slice(0, line.indexOf('='));
            var value = line.slice(line.indexOf('=') + 1);
            if (key === WmicOutputParser.wmicNameTitle) {
                process.name = value.trim();
            }
            else if (key === WmicOutputParser.wmicPidTitle) {
                process.pid = value.trim();
            }
            else if (key === WmicOutputParser.wmicCommandLineTitle) {
                var extendedLengthPath = '\\??\\';
                if (value.startsWith(extendedLengthPath)) {
                    value = value.slice(extendedLengthPath.length).trim();
                }
                process.commandLine = value.trim();
            }
        }
    };
    return WmicOutputParser;
}());
exports.WmicOutputParser = WmicOutputParser;
function execChildProcess(process, workingDirectory) {
    return new Promise(function (resolve, reject) {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, function (error, stdout, stderr) {
            if (error) {
                reject(error);
                return;
            }
            if (stderr && stderr.length > 0) {
                reject(new Error(stderr));
                return;
            }
            resolve(stdout);
        });
    });
}
function execChildProcessAndOutputErrorToChannel(process, workingDirectory, channel) {
    channel.appendLine("Executing: " + process);
    return new Promise(function (resolve, reject) {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, function (error, stdout, stderr) {
            var channelOutput = "";
            if (stdout && stdout.length > 0) {
                channelOutput.concat(stdout);
            }
            if (stderr && stderr.length > 0) {
                channelOutput.concat(stderr);
            }
            if (error) {
                channelOutput.concat(error.message);
            }
            if (error || (stderr && stderr.length > 0)) {
                channel.append(channelOutput);
                channel.show();
                reject(new Error("See remote-attach output"));
                return;
            }
            resolve(stdout);
        });
    });
}
//# sourceMappingURL=processPicker.js.map