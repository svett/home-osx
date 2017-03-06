/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
const vscode_1 = require("vscode");
const goDeclaration_1 = require("./goDeclaration");
const util_1 = require("./util");
class GoSignatureHelpProvider {
    constructor(goConfig) {
        this.goConfig = null;
        this.goConfig = goConfig;
    }
    provideSignatureHelp(document, position, token) {
        let theCall = this.walkBackwardsToBeginningOfCall(document, position);
        if (theCall == null) {
            return Promise.resolve(null);
        }
        let callerPos = this.previousTokenPosition(document, theCall.openParen);
        return goDeclaration_1.definitionLocation(document, callerPos, this.goConfig).then(res => {
            if (!res) {
                // The definition was not found
                return null;
            }
            if (res.line === callerPos.line) {
                // This must be a function definition
                return null;
            }
            let result = new vscode_1.SignatureHelp();
            let declarationText, sig;
            let si;
            if (res.toolUsed === 'godef') {
                // declaration is of the form "Add func(a int, b int) int"
                declarationText = res.declarationlines[0];
                let nameEnd = declarationText.indexOf(' ');
                let sigStart = nameEnd + 5; // ' func'
                let funcName = declarationText.substring(0, nameEnd);
                sig = declarationText.substring(sigStart);
                si = new vscode_1.SignatureInformation(funcName + sig, res.doc);
            }
            else {
                // declaration is of the form "func Add(a int, b int) int"
                declarationText = res.declarationlines[0].substring(5);
                let funcNameStart = declarationText.indexOf(res.name + '('); // Find 'functionname(' to remove anything before it
                if (funcNameStart > 0) {
                    declarationText = declarationText.substring(funcNameStart);
                }
                si = new vscode_1.SignatureInformation(declarationText, res.doc);
                sig = declarationText.substring(res.name.length);
            }
            si.parameters = util_1.parameters(sig).map(paramText => new vscode_1.ParameterInformation(paramText));
            result.signatures = [si];
            result.activeSignature = 0;
            result.activeParameter = Math.min(theCall.commas.length, si.parameters.length - 1);
            return result;
        }, () => {
            return null;
        });
    }
    previousTokenPosition(document, position) {
        while (position.character > 0) {
            let word = document.getWordRangeAtPosition(position);
            if (word) {
                return word.start;
            }
            position = position.translate(0, -1);
        }
        return null;
    }
    walkBackwardsToBeginningOfCall(document, position) {
        let currentLine = document.lineAt(position.line).text.substring(0, position.character);
        let parenBalance = 0;
        let commas = [];
        for (let char = position.character; char >= 0; char--) {
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
    }
}
exports.GoSignatureHelpProvider = GoSignatureHelpProvider;
//# sourceMappingURL=goSignature.js.map