/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode_1 = require('vscode');
var goDeclaration_1 = require('./goDeclaration');
var GoHoverProvider = (function () {
    function GoHoverProvider(toolForDocs) {
        this.toolForDocs = 'godoc';
        this.toolForDocs = toolForDocs;
    }
    GoHoverProvider.prototype.provideHover = function (document, position, token) {
        return goDeclaration_1.definitionLocation(document, position, this.toolForDocs, true).then(function (definitionInfo) {
            if (definitionInfo == null)
                return null;
            var lines = definitionInfo.declarationlines
                .filter(function (line) { return !line.startsWith('\t//') && line !== ''; })
                .map(function (line) { return line.replace(/\t/g, '    '); });
            var text;
            text = lines.join('\n').replace(/\n+$/, '');
            var hoverTexts = [];
            hoverTexts.push({ language: 'go', value: text });
            if (definitionInfo.doc != null) {
                hoverTexts.push(definitionInfo.doc);
            }
            var hover = new vscode_1.Hover(hoverTexts);
            return hover;
        }, function () {
            return null;
        });
    };
    return GoHoverProvider;
}());
exports.GoHoverProvider = GoHoverProvider;
//# sourceMappingURL=goExtraInfo.js.map