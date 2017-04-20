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
    Requests.Projects = '/projects';
    Requests.RemoveFromProject = '/removefromproject';
    Requests.Rename = '/rename';
    Requests.RunCodeAction = '/runcodeaction';
    Requests.SignatureHelp = '/signatureHelp';
    Requests.TypeLookup = '/typelookup';
    Requests.UpdateBuffer = '/updatebuffer';
    Requests.Metadata = '/metadata';
})(Requests = exports.Requests || (exports.Requests = {}));
var V2;
(function (V2) {
    var Requests;
    (function (Requests) {
        Requests.GetCodeActions = '/v2/getcodeactions';
        Requests.RunCodeAction = '/v2/runcodeaction';
        Requests.GetTestStartInfo = '/v2/getteststartinfo';
        Requests.RunDotNetTest = '/v2/runtest';
    })(Requests = V2.Requests || (V2.Requests = {}));
})(V2 = exports.V2 || (exports.V2 = {}));
function findNetCoreAppTargetFramework(project) {
    return project.TargetFrameworks.find(tf => tf.ShortName.startsWith('netcoreapp'));
}
exports.findNetCoreAppTargetFramework = findNetCoreAppTargetFramework;
function findNetStandardTargetFramework(project) {
    return project.TargetFrameworks.find(tf => tf.ShortName.startsWith('netstandard'));
}
exports.findNetStandardTargetFramework = findNetStandardTargetFramework;
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
            if (findNetCoreAppTargetFramework(project) !== undefined ||
                findNetStandardTargetFramework(project) !== undefined) {
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
//# sourceMappingURL=protocol.js.map