/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode_1 = require('vscode');
var goDeclaration_1 = require('./goDeclaration');
var GoHoverProvider = (function () {
    function GoHoverProvider() {
    }
    GoHoverProvider.prototype.provideHover = function (document, position, token) {
        return goDeclaration_1.definitionLocation(document, position, true).then(function (definitionInfo) {
            if (definitionInfo == null)
                return null;
            var lines = definitionInfo.lines;
            lines = lines.map(function (line) {
                if (line.indexOf('\t') === 0) {
                    line = line.slice(1);
                }
                return line.replace(/\t/g, '  ');
            });
            lines = lines.filter(function (line) { return line.length !== 0; });
            if (lines.length > 10)
                lines[9] = '...';
            var text;
            if (lines.length > 1) {
                text = lines.slice(1, 10).join('\n');
                text = text.replace(/\n+$/, '');
            }
            else {
                text = lines[0];
            }
            var hoverTexts = [];
            if (definitionInfo.doc != null) {
                hoverTexts.push(definitionInfo.doc);
            }
            hoverTexts.push({ language: 'go', value: text });
            var hover = new vscode_1.Hover(hoverTexts);
            return hover;
        });
    };
    return GoHoverProvider;
}());
exports.GoHoverProvider = GoHoverProvider;
//# sourceMappingURL=goExtraInfo.js.map