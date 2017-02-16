"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var common_1 = require('../common');
var os = require('os');
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
var NativeAttachItemsProviderFactory = (function () {
    function NativeAttachItemsProviderFactory() {
    }
    NativeAttachItemsProviderFactory.Get = function () {
        if (os.platform() === 'win32') {
            return new WmicAttachItemsProvider();
        }
        else {
            return new PsAttachItemsProvider();
        }
    };
    return NativeAttachItemsProviderFactory;
}());
exports.NativeAttachItemsProviderFactory = NativeAttachItemsProviderFactory;
var NativeAttachItemsProvider = (function () {
    function NativeAttachItemsProvider() {
    }
    NativeAttachItemsProvider.prototype.getAttachItems = function () {
        return this.getInternalProcessEntries().then(function (processEntries) {
            processEntries.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            var attachItems = processEntries.map(function (p) { return p.toAttachItem(); });
            return attachItems;
        });
    };
    return NativeAttachItemsProvider;
}());
var PsAttachItemsProvider = (function (_super) {
    __extends(PsAttachItemsProvider, _super);
    function PsAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    PsAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var processCmd = '';
        switch (os.platform()) {
            case 'darwin':
                processCmd = PsProcessParser.psDarwinCommand;
                break;
            case 'linux':
                processCmd = PsProcessParser.psLinuxCommand;
                break;
            default:
                return Promise.reject(new Error("Operating system \"" + os.platform() + "\" not support."));
        }
        return common_1.execChildProcess(processCmd, null).then(function (processes) {
            return PsProcessParser.ParseProcessFromPs(processes);
        });
    };
    return PsAttachItemsProvider;
}(NativeAttachItemsProvider));
exports.PsAttachItemsProvider = PsAttachItemsProvider;
var PsProcessParser = (function () {
    function PsProcessParser() {
    }
    Object.defineProperty(PsProcessParser, "secondColumnCharacters", {
        get: function () { return 50; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PsProcessParser, "commColumnTitle", {
        get: function () { return Array(PsProcessParser.secondColumnCharacters).join("a"); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PsProcessParser, "psLinuxCommand", {
        get: function () { return "ps -axww -o pid=,comm=" + PsProcessParser.commColumnTitle + ",args="; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PsProcessParser, "psDarwinCommand", {
        get: function () { return "ps -axww -o pid=,comm=" + PsProcessParser.commColumnTitle + ",args= -c"; },
        enumerable: true,
        configurable: true
    });
    PsProcessParser.ParseProcessFromPs = function (processes) {
        var lines = processes.split(os.EOL);
        return PsProcessParser.ParseProcessFromPsArray(lines);
    };
    PsProcessParser.ParseProcessFromPsArray = function (processArray) {
        var processEntries = [];
        for (var i = 1; i < processArray.length; i++) {
            var line = processArray[i];
            if (!line) {
                continue;
            }
            var processEntry = PsProcessParser.parseLineFromPs(line);
            processEntries.push(processEntry);
        }
        return processEntries;
    };
    PsProcessParser.parseLineFromPs = function (line) {
        var psEntry = new RegExp("^\\s*([0-9]+)\\s+(.{" + (PsProcessParser.secondColumnCharacters - 1) + "})\\s+(.*)$");
        var matches = psEntry.exec(line);
        if (matches && matches.length === 4) {
            var pid = matches[1].trim();
            var executable = matches[2].trim();
            var cmdline = matches[3].trim();
            return new Process(executable, pid, cmdline);
        }
    };
    return PsProcessParser;
}());
exports.PsProcessParser = PsProcessParser;
var WmicAttachItemsProvider = (function (_super) {
    __extends(WmicAttachItemsProvider, _super);
    function WmicAttachItemsProvider() {
        _super.apply(this, arguments);
    }
    WmicAttachItemsProvider.prototype.getInternalProcessEntries = function () {
        var wmicCommand = 'wmic process get Name,ProcessId,CommandLine /FORMAT:list';
        return common_1.execChildProcess(wmicCommand, null).then(function (processes) {
            return WmicProcessParser.ParseProcessFromWmic(processes);
        });
    };
    return WmicAttachItemsProvider;
}(NativeAttachItemsProvider));
exports.WmicAttachItemsProvider = WmicAttachItemsProvider;
var WmicProcessParser = (function () {
    function WmicProcessParser() {
    }
    Object.defineProperty(WmicProcessParser, "wmicNameTitle", {
        get: function () { return 'Name'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WmicProcessParser, "wmicCommandLineTitle", {
        get: function () { return 'CommandLine'; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(WmicProcessParser, "wmicPidTitle", {
        get: function () { return 'ProcessId'; },
        enumerable: true,
        configurable: true
    });
    WmicProcessParser.ParseProcessFromWmic = function (processes) {
        var lines = processes.split(os.EOL);
        var currentProcess = new Process(null, null, null);
        var processEntries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) {
                continue;
            }
            WmicProcessParser.parseLineFromWmic(line, currentProcess);
            if (line.lastIndexOf(WmicProcessParser.wmicPidTitle, 0) === 0) {
                processEntries.push(currentProcess);
                currentProcess = new Process(null, null, null);
            }
        }
        return processEntries;
    };
    WmicProcessParser.parseLineFromWmic = function (line, process) {
        var splitter = line.indexOf('=');
        if (splitter >= 0) {
            var key = line.slice(0, line.indexOf('=')).trim();
            var value = line.slice(line.indexOf('=') + 1).trim();
            if (key === WmicProcessParser.wmicNameTitle) {
                process.name = value;
            }
            else if (key === WmicProcessParser.wmicPidTitle) {
                process.pid = value;
            }
            else if (key === WmicProcessParser.wmicCommandLineTitle) {
                var extendedLengthPath = '\\??\\';
                if (value.lastIndexOf(extendedLengthPath, 0) === 0) {
                    value = value.slice(extendedLengthPath.length);
                }
                process.commandLine = value;
            }
        }
    };
    return WmicProcessParser;
}());
exports.WmicProcessParser = WmicProcessParser;
//# sourceMappingURL=nativeAttach.js.map