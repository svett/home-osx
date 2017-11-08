/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const protocol = require("./protocol");
function autoComplete(server, request) {
    return server.makeRequest(protocol.Requests.AutoComplete, request);
}
exports.autoComplete = autoComplete;
function codeCheck(server, request, token) {
    return server.makeRequest(protocol.Requests.CodeCheck, request, token);
}
exports.codeCheck = codeCheck;
function currentFileMembersAsTree(server, request, token) {
    return server.makeRequest(protocol.Requests.CurrentFileMembersAsTree, request, token);
}
exports.currentFileMembersAsTree = currentFileMembersAsTree;
function filesChanged(server, requests) {
    return server.makeRequest(protocol.Requests.FilesChanged, requests);
}
exports.filesChanged = filesChanged;
function findImplementations(server, request, token) {
    return server.makeRequest(protocol.Requests.FindImplementations, request);
}
exports.findImplementations = findImplementations;
function findSymbols(server, request, token) {
    return server.makeRequest(protocol.Requests.FindSymbols, request, token);
}
exports.findSymbols = findSymbols;
function findUsages(server, request, token) {
    return server.makeRequest(protocol.Requests.FindUsages, request, token);
}
exports.findUsages = findUsages;
function formatAfterKeystroke(server, request, token) {
    return server.makeRequest(protocol.Requests.FormatAfterKeystroke, request, token);
}
exports.formatAfterKeystroke = formatAfterKeystroke;
function formatRange(server, request, token) {
    return server.makeRequest(protocol.Requests.FormatRange, request, token);
}
exports.formatRange = formatRange;
function getCodeActions(server, request, token) {
    return server.makeRequest(protocol.V2.Requests.GetCodeActions, request, token);
}
exports.getCodeActions = getCodeActions;
function goToDefinition(server, request, token) {
    return server.makeRequest(protocol.Requests.GoToDefinition, request);
}
exports.goToDefinition = goToDefinition;
function rename(server, request, token) {
    return server.makeRequest(protocol.Requests.Rename, request, token);
}
exports.rename = rename;
function requestProjectInformation(server, request) {
    return server.makeRequest(protocol.Requests.Project, request);
}
exports.requestProjectInformation = requestProjectInformation;
function requestWorkspaceInformation(server) {
    return server.makeRequest(protocol.Requests.Projects);
}
exports.requestWorkspaceInformation = requestWorkspaceInformation;
function runCodeAction(server, request) {
    return server.makeRequest(protocol.V2.Requests.RunCodeAction, request);
}
exports.runCodeAction = runCodeAction;
function signatureHelp(server, request, token) {
    return server.makeRequest(protocol.Requests.SignatureHelp, request, token);
}
exports.signatureHelp = signatureHelp;
function typeLookup(server, request, token) {
    return server.makeRequest(protocol.Requests.TypeLookup, request, token);
}
exports.typeLookup = typeLookup;
function updateBuffer(server, request) {
    return server.makeRequest(protocol.Requests.UpdateBuffer, request);
}
exports.updateBuffer = updateBuffer;
function getMetadata(server, request) {
    return server.makeRequest(protocol.Requests.Metadata, request);
}
exports.getMetadata = getMetadata;
function getTestStartInfo(server, request) {
    return server.makeRequest(protocol.V2.Requests.GetTestStartInfo, request);
}
exports.getTestStartInfo = getTestStartInfo;
function runTest(server, request) {
    return server.makeRequest(protocol.V2.Requests.RunTest, request);
}
exports.runTest = runTest;
function debugTestGetStartInfo(server, request) {
    return server.makeRequest(protocol.V2.Requests.DebugTestGetStartInfo, request);
}
exports.debugTestGetStartInfo = debugTestGetStartInfo;
function debugTestLaunch(server, request) {
    return server.makeRequest(protocol.V2.Requests.DebugTestLaunch, request);
}
exports.debugTestLaunch = debugTestLaunch;
function debugTestStop(server, request) {
    return server.makeRequest(protocol.V2.Requests.DebugTestStop, request);
}
exports.debugTestStop = debugTestStop;
function isNetCoreProject(project) {
    return project.TargetFrameworks.find(tf => tf.ShortName.startsWith('netcoreapp') || tf.ShortName.startsWith('netstandard')) !== undefined;
}
exports.isNetCoreProject = isNetCoreProject;
//# sourceMappingURL=utils.js.map