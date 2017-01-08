/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * See LICENSE.md in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";
const os = require("os");
const vscode = require("vscode");
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
class AttachPicker {
    constructor(attachItemsProvider) {
        this.attachItemsProvider = attachItemsProvider;
    }
    ShowAttachEntries() {
        return this.attachItemsProvider.getAttachItems()
            .then(processEntries => {
            let attachPickOptions = {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processEntries, attachPickOptions)
                .then(chosenProcess => {
                return chosenProcess ? chosenProcess.id : null;
            });
        });
    }
}
exports.AttachPicker = AttachPicker;
class RemoteAttachPicker {
    static get commColumnTitle() { return Array(PsOutputParser.secondColumnCharacters).join("a"); }
    static get linuxPsCommand() { return `ps -axww -o pid=,comm=${RemoteAttachPicker.commColumnTitle},args=`; }
    static get osxPsCommand() { return `ps -axww -o pid=,comm=${RemoteAttachPicker.commColumnTitle},args= -c`; }
    static ShowAttachEntries(args) {
        // Create remote attach output channel for errors.
        if (!RemoteAttachPicker._channel) {
            RemoteAttachPicker._channel = vscode.window.createOutputChannel('remote-attach');
        }
        else {
            RemoteAttachPicker._channel.clear();
        }
        // Grab selected name from UI
        // Args may be null if ran with F1
        let name = args ? args.name : null;
        if (!name) {
            // Config name not found. 
            return Promise.reject(new Error("Name not defined in current configuration."));
        }
        // Build path for launch.json to find pipeTransport
        const vscodeFolder = path.join(vscode.workspace.rootPath, '.vscode');
        let launchJsonPath = path.join(vscodeFolder, 'launch.json');
        // Read launch.json
        let json = JSON.parse(fs.readFileSync(launchJsonPath).toString());
        // Find correct pipeTransport via selected name
        let config;
        let configIdx;
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
            let pipeProgram = config.pipeTransport.pipeProgram;
            let pipeArgs = config.pipeTransport.pipeArgs;
            let platformSpecificPipeTransportOptions = RemoteAttachPicker.getPlatformSpecificPipeTransportOptions(config);
            if (platformSpecificPipeTransportOptions) {
                pipeProgram = platformSpecificPipeTransportOptions.pipeProgram || pipeProgram;
                pipeArgs = platformSpecificPipeTransportOptions.pipeArgs || pipeArgs;
            }
            let argList = RemoteAttachPicker.createArgumentList(pipeArgs);
            let pipeCmd = `"${pipeProgram}" ${argList}`;
            return RemoteAttachPicker.getRemoteOSAndProcesses(pipeCmd).then(processes => {
                let attachPickOptions = {
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: "Select the process to attach to"
                };
                return vscode.window.showQuickPick(processes, attachPickOptions).then(item => {
                    return item ? item.id : null;
                });
            });
        }
    }
    static createArgumentList(args) {
        let ret = "";
        for (let arg of args) {
            if (ret) {
                ret += " ";
            }
            ret += `"${arg}"`;
        }
        return ret;
    }
    static getPlatformSpecificPipeTransportOptions(config) {
        const osPlatform = os.platform();
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
    }
    static getRemoteOSAndProcesses(pipeCmd) {
        // Commands to get OS and processes
        const command = `uname && if [ $(uname) == "Linux" ] ; then ${RemoteAttachPicker.linuxPsCommand} ; elif [ $(uname) == "Darwin" ] ; ` +
            `then ${RemoteAttachPicker.osxPsCommand}; fi`;
        return execChildProcessAndOutputErrorToChannel(`${pipeCmd} "${command}"`, null, RemoteAttachPicker._channel).then(output => {
            // OS will be on first line
            // Processess will follow if listed
            let lines = output.split(os.EOL);
            if (lines.length == 0) {
                return Promise.reject(new Error("Pipe transport failed to get OS and processes."));
            }
            else {
                let remoteOS = lines[0].replace(/[\r\n]+/g, '');
                if (remoteOS != "Linux" && remoteOS != "Darwin") {
                    return Promise.reject(new Error(`Operating system "${remoteOS}"" not supported.`));
                }
                // Only got OS from uname
                if (lines.length == 1) {
                    return Promise.reject(new Error("Transport attach could not obtain processes list."));
                }
                else {
                    let processes = lines.slice(1);
                    return sortProcessEntries(PsOutputParser.parseProcessFromPsArray(processes), remoteOS);
                }
            }
        });
    }
    static getRemoteProcesses(pipeCmd, os) {
        const psCommand = os === 'darwin' ? RemoteAttachPicker.osxPsCommand : RemoteAttachPicker.linuxPsCommand;
        return execChildProcessAndOutputErrorToChannel(`${pipeCmd} ${psCommand}`, null, RemoteAttachPicker._channel).then(output => {
            return sortProcessEntries(PsOutputParser.parseProcessFromPs(output), os);
        });
    }
}
RemoteAttachPicker._channel = null;
exports.RemoteAttachPicker = RemoteAttachPicker;
class Process {
    constructor(name, pid, commandLine) {
        this.name = name;
        this.pid = pid;
        this.commandLine = commandLine;
    }
    toAttachItem() {
        return {
            label: this.name,
            description: this.pid,
            detail: this.commandLine,
            id: this.pid
        };
    }
}
class DotNetAttachItemsProviderFactory {
    static Get() {
        if (os.platform() === 'win32') {
            return new WmicAttachItemsProvider();
        }
        else {
            return new PsAttachItemsProvider();
        }
    }
}
exports.DotNetAttachItemsProviderFactory = DotNetAttachItemsProviderFactory;
class DotNetAttachItemsProvider {
    getAttachItems() {
        return this.getInternalProcessEntries().then(processEntries => {
            return sortProcessEntries(processEntries, os.platform());
        });
    }
}
function sortProcessEntries(processEntries, osPlatform) {
    // localeCompare is significantly slower than < and > (2000 ms vs 80 ms for 10,000 elements)
    // We can change to localeCompare if this becomes an issue
    let dotnetProcessName = (osPlatform === 'win32') ? 'dotnet.exe' : 'dotnet';
    processEntries = processEntries.sort((a, b) => {
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
    let attachItems = processEntries.map(p => p.toAttachItem());
    return attachItems;
}
class PsAttachItemsProvider extends DotNetAttachItemsProvider {
    getInternalProcessEntries() {
        // the BSD version of ps uses '-c' to have 'comm' only output the executable name and not
        // the full path. The Linux version of ps has 'comm' to only display the name of the executable
        // Note that comm on Linux systems is truncated to 16 characters:
        // https://bugzilla.redhat.com/show_bug.cgi?id=429565
        // Since 'args' contains the full path to the executable, even if truncated, searching will work as desired.
        const psCommand = os.platform() === 'darwin' ? RemoteAttachPicker.osxPsCommand : RemoteAttachPicker.linuxPsCommand;
        return execChildProcess(psCommand, null).then(processes => {
            return PsOutputParser.parseProcessFromPs(processes);
        });
    }
}
exports.PsAttachItemsProvider = PsAttachItemsProvider;
class PsOutputParser {
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
    static get secondColumnCharacters() { return 50; }
    // Only public for tests.
    static parseProcessFromPs(processes) {
        let lines = processes.split(os.EOL);
        let processEntries = [];
        // lines[0] is the header of the table
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i];
            if (!line) {
                continue;
            }
            let process = this.parseLineFromPs(line);
            if (process) {
                processEntries.push(process);
            }
        }
        return processEntries;
    }
    static parseProcessFromPsArray(lines) {
        let processEntries = [];
        // lines[0] is the header of the table
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i];
            if (!line) {
                continue;
            }
            let process = this.parseLineFromPs(line);
            if (process) {
                processEntries.push(process);
            }
        }
        return processEntries;
    }
    static parseLineFromPs(line) {
        // Explanation of the regex:
        //   - any leading whitespace
        //   - PID
        //   - whitespace
        //   - executable name --> this is PsAttachItemsProvider.secondColumnCharacters - 1 because ps reserves one character
        //     for the whitespace separator
        //   - whitespace
        //   - args (might be empty)
        const psEntry = new RegExp(`^\\s*([0-9]+)\\s+(.{${PsOutputParser.secondColumnCharacters - 1}})\\s+(.*)$`);
        const matches = psEntry.exec(line);
        if (matches && matches.length === 4) {
            const pid = matches[1].trim();
            const executable = matches[2].trim();
            const cmdline = matches[3].trim();
            return new Process(executable, pid, cmdline);
        }
    }
}
exports.PsOutputParser = PsOutputParser;
class WmicAttachItemsProvider extends DotNetAttachItemsProvider {
    getInternalProcessEntries() {
        const wmicCommand = 'wmic process get Name,ProcessId,CommandLine /FORMAT:list';
        return execChildProcess(wmicCommand, null).then(processes => {
            return WmicOutputParser.parseProcessFromWmic(processes);
        });
    }
}
exports.WmicAttachItemsProvider = WmicAttachItemsProvider;
class WmicOutputParser {
    // Perf numbers on Win10:
    // | # of processes | Time (ms) |
    // |----------------+-----------|
    // |            309 |       413 |
    // |            407 |       463 |
    // |            887 |       746 |
    // |           1308 |      1132 |
    static get wmicNameTitle() { return 'Name'; }
    static get wmicCommandLineTitle() { return 'CommandLine'; }
    static get wmicPidTitle() { return 'ProcessId'; }
    // Only public for tests.
    static parseProcessFromWmic(processes) {
        let lines = processes.split(os.EOL);
        let currentProcess = new Process(null, null, null);
        let processEntries = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
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
    }
    static parseLineFromWmic(line, process) {
        let splitter = line.indexOf('=');
        if (splitter >= 0) {
            let key = line.slice(0, line.indexOf('='));
            let value = line.slice(line.indexOf('=') + 1);
            if (key === WmicOutputParser.wmicNameTitle) {
                process.name = value.trim();
            }
            else if (key === WmicOutputParser.wmicPidTitle) {
                process.pid = value.trim();
            }
            else if (key === WmicOutputParser.wmicCommandLineTitle) {
                const extendedLengthPath = '\\??\\';
                if (value.startsWith(extendedLengthPath)) {
                    value = value.slice(extendedLengthPath.length).trim();
                }
                process.commandLine = value.trim();
            }
        }
    }
}
exports.WmicOutputParser = WmicOutputParser;
function execChildProcess(process, workingDirectory) {
    return new Promise((resolve, reject) => {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, (error, stdout, stderr) => {
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
    channel.appendLine(`Executing: ${process}`);
    return new Promise((resolve, reject) => {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, (error, stdout, stderr) => {
            let channelOutput = "";
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