"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StringUtil {
    /*-------------------------------------------------------------------------
     * Public Method
     *-----------------------------------------------------------------------*/
    static IsNullOrWhiteSpace(line) {
        return (line === null || line.trim() === '');
    }
    static IsCodeBlockStart(line) {
        if (line === null)
            return false;
        const isAttribute = line.trim().startsWith('['); // SKIP Attribute: [foo="bar"]
        if (isAttribute)
            return false;
        const isCodeBlockStart = (line.indexOf('{') !== -1);
        if (isCodeBlockStart)
            return true;
        const isInterface = (line.indexOf(';') !== -1);
        if (isInterface)
            return true;
        const isEndMethod = (line.trim().endsWith(')'));
        if (isEndMethod)
            return true;
        const isXml = (line.indexOf('</') !== -1);
        if (isXml)
            return true;
        return isCodeBlockStart;
    }
    static RemoveComment(line) {
        if (line === null)
            return null;
        return line.replace(/\/\/.*/, '').replace(/\/\*.*\*\//, '');
    }
    static GetIndent(line, indentBaseLine, insertSpaces, detectIdentation) {
        if (line === null)
            return null;
        const indent = indentBaseLine.match(/([ \t]*)?/)[0];
        const spaces = ' '.repeat(indent.length);
        if (detectIdentation) {
            const isSpaceIdentation = (indent.match(/([ ]+)/) !== null);
            insertSpaces = isSpaceIdentation;
        }
        if (insertSpaces) {
            return indent.split('\t').join(spaces);
        }
        else {
            return indent.split(spaces).join('\t');
        }
    }
    static GetIndentLen(indent, insertSpaces, detectIdentation) {
        if (indent === null)
            return 0;
        if (detectIdentation) {
            const isSpaceIdentation = (indent.match(/([ ]+)/) !== null);
            insertSpaces = isSpaceIdentation;
        }
        if (insertSpaces) {
            return indent.split(' ').length;
        }
        else {
            return indent.split('\t').length;
        }
    }
}
exports.StringUtil = StringUtil;
//# sourceMappingURL=StringUtil.js.map