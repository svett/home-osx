/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
var Requests;
(function (Requests) {
    Requests.AddToProject = '/addtoproject';
    Requests.AutoComplete = '/autocomplete';
    Requests.CodeCheck = '/codecheck';
    Requests.CodeFormat = '/codeformat';
    Requests.ChangeBuffer = '/changebuffer';
    Requests.CurrentFileMembersAsTree = '/currentfilemembersastree';
    Requests.FilesChanged = '/filesChanged';
    Requests.FindSymbols = '/findsymbols';
    Requests.FindUsages = '/findusages';
    Requests.FormatAfterKeystroke = '/formatAfterKeystroke';
    Requests.FormatRange = '/formatRange';
    Requests.GetCodeActions = '/getcodeactions';
    Requests.GoToDefinition = '/gotoDefinition';
    Requests.FindImplementations = '/findimplementations';
    Requests.Project = '/project';
    Requests.Projects = '/projects';
    Requests.RemoveFromProject = '/removefromproject';
    Requests.Rename = '/rename';
    Requests.RunCodeAction = '/runcodeaction';
    Requests.SignatureHelp = '/signatureHelp';
    Requests.TypeLookup = '/typelookup';
    Requests.UpdateBuffer = '/updatebuffer';
    Requests.Metadata = '/metadata';
})(Requests = exports.Requests || (exports.Requests = {}));
var FileChangeType;
(function (FileChangeType) {
    FileChangeType["Change"] = "Change";
    FileChangeType["Create"] = "Create";
    FileChangeType["Delete"] = "Delete";
})(FileChangeType = exports.FileChangeType || (exports.FileChangeType = {}));
var V2;
(function (V2) {
    let Requests;
    (function (Requests) {
        Requests.GetCodeActions = '/v2/getcodeactions';
        Requests.RunCodeAction = '/v2/runcodeaction';
        Requests.GetTestStartInfo = '/v2/getteststartinfo';
        Requests.RunTest = '/v2/runtest';
        Requests.DebugTestGetStartInfo = '/v2/debugtest/getstartinfo';
        Requests.DebugTestLaunch = '/v2/debugtest/launch';
        Requests.DebugTestStop = '/v2/debugtest/stop';
    })(Requests = V2.Requests || (V2.Requests = {}));
    let TestOutcomes;
    (function (TestOutcomes) {
        TestOutcomes.None = 'none';
        TestOutcomes.Passed = 'passed';
        TestOutcomes.Failed = 'failed';
        TestOutcomes.Skipped = 'skipped';
        TestOutcomes.NotFound = 'notfound';
    })(TestOutcomes = V2.TestOutcomes || (V2.TestOutcomes = {}));
})(V2 = exports.V2 || (exports.V2 = {}));
function findNetFrameworkTargetFramework(project) {
    let regexp = new RegExp('^net[1-4]');
    return project.TargetFrameworks.find(tf => regexp.test(tf.ShortName));
}
exports.findNetFrameworkTargetFramework = findNetFrameworkTargetFramework;
function findNetCoreAppTargetFramework(project) {
    return project.TargetFrameworks.find(tf => tf.ShortName.startsWith('netcoreapp'));
}
exports.findNetCoreAppTargetFramework = findNetCoreAppTargetFramework;
function findNetStandardTargetFramework(project) {
    return project.TargetFrameworks.find(tf => tf.ShortName.startsWith('netstandard'));
}
exports.findNetStandardTargetFramework = findNetStandardTargetFramework;
function isDotNetCoreProject(project) {
    return findNetCoreAppTargetFramework(project) !== undefined ||
        findNetStandardTargetFramework(project) !== undefined ||
        findNetFrameworkTargetFramework(project) !== undefined;
}
exports.isDotNetCoreProject = isDotNetCoreProject;
function getDotNetCoreProjectDescriptors(info) {
    let result = [];
    if (info.DotNet && info.DotNet.Projects.length > 0) {
        for (let project of info.DotNet.Projects) {
            result.push({
                Name: project.Name,
                Directory: project.Path,
                FilePath: path.join(project.Path, 'project.json')
            });
        }
    }
    if (info.MsBuild && info.MsBuild.Projects.length > 0) {
        for (let project of info.MsBuild.Projects) {
            if (isDotNetCoreProject(project)) {
                result.push({
                    Name: path.basename(project.Path),
                    Directory: path.dirname(project.Path),
                    FilePath: project.Path
                });
            }
        }
    }
    return result;
}
exports.getDotNetCoreProjectDescriptors = getDotNetCoreProjectDescriptors;
function findExecutableMSBuildProjects(projects) {
    let result = [];
    projects.forEach(project => {
        if (project.IsExe && findNetCoreAppTargetFramework(project) !== undefined) {
            result.push(project);
        }
    });
    return result;
}
exports.findExecutableMSBuildProjects = findExecutableMSBuildProjects;
function findExecutableProjectJsonProjects(projects, configurationName) {
    let result = [];
    projects.forEach(project => {
        project.Configurations.forEach(configuration => {
            if (configuration.Name === configurationName && configuration.EmitEntryPoint === true) {
                if (project.Frameworks.length > 0) {
                    result.push(project);
                }
            }
        });
    });
    return result;
}
exports.findExecutableProjectJsonProjects = findExecutableProjectJsonProjects;
function containsDotNetCoreProjects(workspaceInfo) {
    if (workspaceInfo.DotNet && findExecutableProjectJsonProjects(workspaceInfo.DotNet.Projects, 'Debug').length > 0) {
        return true;
    }
    if (workspaceInfo.MsBuild && findExecutableMSBuildProjects(workspaceInfo.MsBuild.Projects).length > 0) {
        return true;
    }
    return false;
}
exports.containsDotNetCoreProjects = containsDotNetCoreProjects;
//# sourceMappingURL=protocol.js.map