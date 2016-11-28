/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var protocol = require('./protocol');
var priorityCommands = [
    protocol.Requests.ChangeBuffer,
    protocol.Requests.FormatAfterKeystroke,
    protocol.Requests.FormatRange,
    protocol.Requests.UpdateBuffer
];
var normalCommands = [
    protocol.Requests.AutoComplete,
    protocol.Requests.FilesChanged,
    protocol.Requests.FindSymbols,
    protocol.Requests.FindUsages,
    protocol.Requests.GetCodeActions,
    protocol.Requests.GoToDefinition,
    protocol.Requests.RunCodeAction,
    protocol.Requests.SignatureHelp,
    protocol.Requests.TypeLookup
];
var prioritySet = new Set(priorityCommands);
var normalSet = new Set(normalCommands);
var deferredSet = new Set();
var nonDeferredSet = new Set();
for (var _i = 0, priorityCommands_1 = priorityCommands; _i < priorityCommands_1.length; _i++) {
    var command = priorityCommands_1[_i];
    nonDeferredSet.add(command);
}
for (var _a = 0, normalCommands_1 = normalCommands; _a < normalCommands_1.length; _a++) {
    var command = normalCommands_1[_a];
    nonDeferredSet.add(command);
}
function isPriorityCommand(command) {
    return prioritySet.has(command);
}
exports.isPriorityCommand = isPriorityCommand;
function isNormalCommand(command) {
    return normalSet.has(command);
}
exports.isNormalCommand = isNormalCommand;
function isDeferredCommand(command) {
    if (deferredSet.has(command)) {
        return true;
    }
    if (nonDeferredSet.has(command)) {
        return false;
    }
    deferredSet.add(command);
    return true;
}
exports.isDeferredCommand = isDeferredCommand;
//# sourceMappingURL=prioritization.js.map