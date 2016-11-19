/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode_1 = require('vscode');
var goDeclaration_1 = require('./goDeclaration');
var util_1 = require('./util');
var GoSignatureHelpProvider = (function () {
    function GoSignatureHelpProvider() {
    }
    GoSignatureHelpProvider.prototype.provideSignatureHelp = function (document, position, token) {
        var theCall = this.walkBackwardsToBeginningOfCall(document, position);
        if (theCall == null) {
            return Promise.resolve(null);
        }
        var callerPos = this.previousTokenPosition(document, theCall.openParen);
        return goDeclaration_1.definitionLocation(document, callerPos).then(function (res) {
            if (!res) {
                // The definition was not found
                return null;
            }
            if (res.line === callerPos.line) {
                // This must be a function definition
                return null;
            }
            var result = new vscode_1.SignatureHelp();
            var text = res.lines[1];
            var nameEnd = text.indexOf(' ');
            var sigStart = nameEnd + 5; // ' func'
            var funcName = text.substring(0, nameEnd);
            var sig = text.substring(sigStart);
            var si = new vscode_1.SignatureInformation(funcName + sig, res.doc);
            si.parameters = util_1.parameters(sig).map(function (paramText) {
                return new vscode_1.ParameterInformation(paramText);
            });
            result.signatures = [si];
            result.activeSignature = 0;
            result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
            return result;
        });
    };
    GoSignatureHelpProvider.prototype.previousTokenPosition = function (document, position) {
        while (position.character > 0) {
            var word = document.getWordRangeAtPosition(position);
            if (word) {
                return word.start;
            }
            position = position.translate(0, -1);
        }
        return null;
    };
    GoSignatureHelpProvider.prototype.walkBackwardsToBeginningOfCall = function (document, position) {
        var currentLine = document.lineAt(position.line).text.substring(0, position.character);
        var parenBalance = 0;
        var commas = [];
        for (var char = position.character; char >= 0; char--) {
            switch (currentLine[char]) {
                case '(':
                    parenBalance--;
                    if (parenBalance < 0) {
                        return {
                            openParen: new vscode_1.Position(position.line, char),
                            commas: commas
                        };
                    }
                    break;
                case ')':
                    parenBalance++;
                    break;
                case ',':
                    if (parenBalance === 0) {
                        commas.push(new vscode_1.Position(position.line, char));
                    }
            }
        }
        return null;
    };
    return GoSignatureHelpProvider;
}());
exports.GoSignatureHelpProvider = GoSignatureHelpProvider;
//# sourceMappingURL=goSignature.js.map