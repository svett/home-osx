/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var vscode = require('vscode');
var Options = (function () {
    function Options(path, useMono, loggingLevel, autoStart, projectLoadTimeout) {
        this.path = path;
        this.useMono = useMono;
        this.loggingLevel = loggingLevel;
        this.autoStart = autoStart;
        this.projectLoadTimeout = projectLoadTimeout;
    }
    Options.Read = function () {
        // Extra effort is taken below to ensure that legacy versions of options
        // are supported below. In particular, these are:
        //
        // - "csharp.omnisharp" -> "omnisharp.path"
        // - "csharp.omnisharpUsesMono" -> "omnisharp.useMono"
        var omnisharpConfig = vscode.workspace.getConfiguration('omnisharp');
        var csharpConfig = vscode.workspace.getConfiguration('csharp');
        var path = csharpConfig.has('omnisharp')
            ? csharpConfig.get('omnisharp')
            : omnisharpConfig.get('path');
        var useMono = csharpConfig.has('omnisharpUsesMono')
            ? csharpConfig.get('omnisharpUsesMono')
            : omnisharpConfig.get('useMono');
        var loggingLevel = omnisharpConfig.get('loggingLevel');
        var autoStart = omnisharpConfig.get('autoStart', true);
        var projectLoadTimeout = omnisharpConfig.get('projectLoadTimeout', 60);
        return new Options(path, useMono, loggingLevel, autoStart, projectLoadTimeout);
    };
    return Options;
}());
exports.Options = Options;
//# sourceMappingURL=options.js.map