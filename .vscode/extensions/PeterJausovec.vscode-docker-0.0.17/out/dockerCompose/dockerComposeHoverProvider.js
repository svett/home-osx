/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const parser = require("../parser");
const suggestHelper = require("../helpers/suggestSupportHelper");
class DockerComposeHoverProvider {
    // Provide the parser you want to use as well as keyinfo dictionary.
    constructor(wordParser, keyInfo) {
        this._parser = wordParser;
        this._keyInfo = keyInfo;
    }
    provideHover(document, position, token) {
        var line = document.lineAt(position.line);
        if (line.text.length === 0) {
            return Promise.resolve(null);
        }
        var tokens = this._parser.parseLine(line);
        return this._computeInfoForLineWithTokens(line.text, tokens, position);
    }
    _computeInfoForLineWithTokens(line, tokens, position) {
        var possibleTokens = this._parser.tokensAtColumn(tokens, position.character);
        return Promise.all(possibleTokens.map(tokenIndex => this._computeInfoForToken(line, tokens, tokenIndex))).then((results) => {
            return possibleTokens.map((tokenIndex, arrayIndex) => {
                return {
                    startIndex: tokens[tokenIndex].startIndex,
                    endIndex: tokens[tokenIndex].endIndex,
                    result: results[arrayIndex]
                };
            });
        }).then((results) => {
            var r = results.filter(r => !!r.result);
            if (r.length === 0) {
                return;
            }
            let range = new vscode_1.Range(position.line, r[0].startIndex, position.line, r[0].endIndex);
            let hover = new vscode_1.Hover(r[0].result, range);
            return hover;
        });
    }
    _computeInfoForToken(line, tokens, tokenIndex) {
        // -------------
        // Detect hovering on a key
        if (tokens[tokenIndex].type === parser.TokenType.Key) {
            var keyName = this._parser.keyNameFromKeyToken(this._parser.tokenValue(line, tokens[tokenIndex])).trim();
            var r = this._keyInfo[keyName];
            if (r) {
                return Promise.resolve([r]);
            }
        }
        // -------------
        // Detect <<image: [["something"]]>>
        // Detect <<image: [[something]]>>
        var helper = new suggestHelper.SuggestSupportHelper();
        var r2 = helper.getImageNameHover(line, this._parser, tokens, tokenIndex);
        if (r2) {
            return r2;
        }
        return;
    }
}
exports.DockerComposeHoverProvider = DockerComposeHoverProvider;
//# sourceMappingURL=dockerComposeHoverProvider.js.map