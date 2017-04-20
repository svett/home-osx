/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Options {
    constructor(path, useMono, loggingLevel, autoStart, projectLoadTimeout, maxProjectResults, useEditorFormattingSettings) {
        this.path = path;
        this.useMono = useMono;
        this.loggingLevel = loggingLevel;
        this.autoStart = autoStart;
        this.projectLoadTimeout = projectLoadTimeout;
        this.maxProjectResults = maxProjectResults;
        this.useEditorFormattingSettings = useEditorFormattingSettings;
    }
    static Read() {
        // Extra effort is taken below to ensure that legacy versions of options
        // are supported below. In particular, these are:
        //
        // - "csharp.omnisharp" -> "omnisharp.path"
        // - "csharp.omnisharpUsesMono" -> "omnisharp.useMono"
        const omnisharpConfig = vscode.workspace.getConfiguration('omnisharp');
        const csharpConfig = vscode.workspace.getConfiguration('csharp');
        const path = csharpConfig.has('omnisharp')
            ? csharpConfig.get('omnisharp')
            : omnisharpConfig.get('path');
        const useMono = csharpConfig.has('omnisharpUsesMono')
            ? csharpConfig.get('omnisharpUsesMono')
            : omnisharpConfig.get('useMono');
        // support the legacy "verbose" level as "debug"
        let loggingLevel = omnisharpConfig.get('loggingLevel');
        if (loggingLevel.toLowerCase() === 'verbose') {
            loggingLevel = 'debug';
        }
        const autoStart = omnisharpConfig.get('autoStart', true);
        const projectLoadTimeout = omnisharpConfig.get('projectLoadTimeout', 60);
        const maxProjectResults = omnisharpConfig.get('maxProjectResults', 250);
        const useEditorFormattingSettings = omnisharpConfig.get('useEditorFormattingSettings', true);
        return new Options(path, useMono, loggingLevel, autoStart, projectLoadTimeout, maxProjectResults, useEditorFormattingSettings);
    }
}
exports.Options = Options;
//# sourceMappingURL=options.js.map