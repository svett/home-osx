/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
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
//# sourceMappingURL=protocol.js.map