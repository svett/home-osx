"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const protocol = require("./protocol");
const priorityCommands = [
    protocol.Requests.ChangeBuffer,
    protocol.Requests.FormatAfterKeystroke,
    protocol.Requests.FormatRange,
    protocol.Requests.UpdateBuffer
];
const normalCommands = [
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
const prioritySet = new Set(priorityCommands);
const normalSet = new Set(normalCommands);
const deferredSet = new Set();
const nonDeferredSet = new Set();
for (let command of priorityCommands) {
    nonDeferredSet.add(command);
}
for (let command of normalCommands) {
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