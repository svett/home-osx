"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function isLineBreak(code) {
    return code === 10 /* lineFeed */
        || code === 13 /* carriageReturn */
        || code === 11 /* verticalTab */
        || code === 12 /* formFeed */
        || code === 8232 /* lineSeparator */
        || code === 8233 /* paragraphSeparator */;
}
function isWhitespace(code) {
    return code === 32 /* space */
        || code === 9 /* tab */
        || code === 10 /* lineFeed */
        || code === 11 /* verticalTab */
        || code === 12 /* formFeed */
        || code === 13 /* carriageReturn */
        || code === 133 /* nextLine */
        || code === 160 /* nonBreakingSpace */
        || code === 5760 /* ogham */
        || (code >= 8192 /* enQuad */ && code <= 8203 /* zeroWidthSpace */)
        || code === 8232 /* lineSeparator */
        || code === 8233 /* paragraphSeparator */
        || code === 8239 /* narrowNoBreakSpace */
        || code === 8287 /* mathematicalSpace */
        || code === 12288 /* ideographicSpace */
        || code === 65279 /* byteOrderMark */;
}
function cleanJsonText(text) {
    let parts = [];
    let partStart = 0;
    let index = 0;
    let length = text.length;
    function next() {
        const result = peek();
        index++;
        return result;
    }
    function peek(offset = 0) {
        if ((index + offset) < length) {
            return text.charCodeAt(index + offset);
        }
        else {
            return undefined;
        }
    }
    function peekPastWhitespace() {
        let pos = index;
        let code = undefined;
        do {
            code = text.charCodeAt(pos);
            pos++;
        } while (isWhitespace(code));
        return code;
    }
    function scanString() {
        while (true) {
            if (index >= length) {
                break;
            }
            let code = next();
            if (code === 34 /* doubleQuote */) {
                // End of string. We're done
                break;
            }
            if (code === 92 /* backSlash */) {
                // Skip escaped character. We don't care about verifying the escape sequence.
                // We just don't want to accidentally scan an escaped double-quote as the end of the string.
                index++;
            }
            if (isLineBreak(code)) {
                // string ended unexpectedly
                break;
            }
        }
    }
    while (true) {
        let code = next();
        switch (code) {
            // byte-order mark
            case 65279 /* byteOrderMark */:
                // We just skip the byte-order mark
                parts.push(text.substring(partStart, index - 1));
                partStart = index;
            // strings
            case 34 /* doubleQuote */:
                scanString();
                break;
            // comments
            case 47 /* slash */:
                // Single-line comment
                if (peek() === 47 /* slash */) {
                    // Be careful not to include the first slash in the text part.
                    parts.push(text.substring(partStart, index - 1));
                    // Start after the second slash and scan until a line-break character is encountered.
                    index++;
                    while (index < length) {
                        if (isLineBreak(peek())) {
                            break;
                        }
                        index++;
                    }
                    partStart = index;
                }
                // Multi-line comment
                if (peek() === 42 /* asterisk */) {
                    // Be careful not to include the first slash in the text part.
                    parts.push(text.substring(partStart, index - 1));
                    // Start after the asterisk and scan until a */ is encountered.
                    index++;
                    while (index < length) {
                        if (peek() === 42 /* asterisk */ && peek(1) === 47 /* slash */) {
                            index += 2;
                            break;
                        }
                        index++;
                    }
                    partStart = index;
                }
                break;
            case 44 /* comma */:
                // Ignore trailing commas in object member lists and array element lists
                let nextCode = peekPastWhitespace();
                if (nextCode === 125 /* closeBrace */ || nextCode === 93 /* closeBracket */) {
                    parts.push(text.substring(partStart, index - 1));
                    partStart = index;
                }
                break;
        }
        if (index >= length && index > partStart) {
            parts.push(text.substring(partStart, length));
            break;
        }
    }
    return parts.join('');
}
function tolerantParse(text) {
    text = cleanJsonText(text);
    return JSON.parse(text);
}
exports.tolerantParse = tolerantParse;
//# sourceMappingURL=json.js.map