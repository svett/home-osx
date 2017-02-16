"use strict";
var vscode = require('vscode');
var common_1 = require('../common');
var nativeAttach_1 = require('./nativeAttach');
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
                return chosenProcess ? chosenProcess.id : Promise.reject(new Error("Process not selected."));
            });
        });
    };
    return AttachPicker;
}());
exports.AttachPicker = AttachPicker;
var RemoteAttachPicker = (function () {
    function RemoteAttachPicker() {
        this._channel = null;
        this._channel = vscode.window.createOutputChannel('remote-attach');
    }
    RemoteAttachPicker.prototype.ShowAttachEntries = function (args) {
        this._channel.clear();
        var pipeTransport = args ? args.pipeTransport : null;
        if (pipeTransport === null) {
            return Promise.reject(new Error("Chosen debug configuration does not contain pipeTransport"));
        }
        var pipeProgram = pipeTransport.pipeProgram;
        var pipeArgs = pipeTransport.pipeArgs;
        var argList = RemoteAttachPicker.createArgumentList(pipeArgs);
        var pipeCmd = "\"" + pipeProgram + "\" " + argList;
        return this.getRemoteOSAndProcesses(pipeCmd)
            .then(function (processes) {
            var attachPickOptions = {
                matchOnDetail: true,
                matchOnDescription: true,
                placeHolder: "Select the process to attach to"
            };
            return vscode.window.showQuickPick(processes, attachPickOptions)
                .then(function (item) {
                return item ? item.id : Promise.reject(new Error("Process not selected."));
            });
        });
    };
    RemoteAttachPicker.prototype.getRemoteOSAndProcesses = function (pipeCmd) {
        var command = ("bash -c 'uname && if [ $(uname) == \"Linux\" ] ; then " + nativeAttach_1.PsProcessParser.psLinuxCommand + " ; elif [ $(uname) == \"Darwin\" ] ; ") +
            ("then " + nativeAttach_1.PsProcessParser.psDarwinCommand + "; fi'");
        return common_1.execChildProcess(pipeCmd + " \"" + command + "\"", null, this._channel).then(function (output) {
            var lines = output.split(/\r?\n/);
            if (lines.length == 0) {
                return Promise.reject(new Error("Pipe transport failed to get OS and processes."));
            }
            else {
                var remoteOS = lines[0].replace(/[\r\n]+/g, '');
                if (remoteOS != "Linux" && remoteOS != "Darwin") {
                    return Promise.reject(new Error("Operating system \"" + remoteOS + "\" not supported."));
                }
                if (lines.length == 1) {
                    return Promise.reject(new Error("Transport attach could not obtain processes list."));
                }
                else {
                    var processes = lines.slice(1);
                    return nativeAttach_1.PsProcessParser.ParseProcessFromPsArray(processes)
                        .sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; })
                        .map(function (p) { return p.toAttachItem(); });
                }
            }
        });
    };
    RemoteAttachPicker.createArgumentList = function (args) {
        var argsString = "";
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var arg = args_1[_i];
            if (argsString) {
                argsString += " ";
            }
            argsString += "\"" + arg + "\"";
        }
        return argsString;
    };
    return RemoteAttachPicker;
}());
exports.RemoteAttachPicker = RemoteAttachPicker;
//# sourceMappingURL=attachToProcess.js.map