/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("../parser");
class DockerfileParser extends parser_1.Parser {
    constructor() {
        var parseRegex = /\ +$/g;
        super(parseRegex);
    }
    parseLine(textLine) {
        if (textLine.isEmptyOrWhitespace) {
            return;
        }
        var startIndex = textLine.firstNonWhitespaceCharacterIndex;
        // Check for comment 
        if (textLine.text.charAt(startIndex) === '#') {
            return;
        }
        var tokens = [];
        var previousTokenIndex = 0;
        var keyFound = false;
        for (var j = startIndex, len = textLine.text.length; j < len; j++) {
            var ch = textLine.text.charAt(j);
            if (ch === ' ' || ch === '\t') {
                previousTokenIndex = j;
                tokens.push({
                    startIndex: 0,
                    endIndex: j,
                    type: parser_1.TokenType.Key
                });
                break;
            }
        }
        tokens.push({
            startIndex: previousTokenIndex,
            endIndex: textLine.text.length,
            type: parser_1.TokenType.String
        });
        return tokens;
    }
}
exports.DockerfileParser = DockerfileParser;
//# sourceMappingURL=dockerfileParser.js.map