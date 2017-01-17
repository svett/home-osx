'use strict';
class XmlFormatter {
    constructor(options) {
        options = options || {};
        if (typeof options.preferSpaces === 'undefined') {
            options.preferSpaces = false;
        }
        if (typeof options.splitNamespaces === 'undefined') {
            options.splitNamespaces = true;
        }
        options.tabSize = options.tabSize || 4;
        options.newLine = options.newLine || '\n';
        this.newLine = options.newLine || '\n';
        this.indentPattern = (options.preferSpaces) ? ' '.repeat(options.tabSize) : '\t';
        this.splitNamespaces = options.splitNamespaces;
    }
    format(xml) {
        xml = this.minify(xml, false);
        xml = xml.replace(/</g, '~::~<');
        if (this.splitNamespaces) {
            xml = xml
                .replace(/xmlns\:/g, '~::~xmlns:')
                .replace(/xmlns\=/g, '~::~xmlns=');
        }
        let parts = xml.split('~::~');
        let inComment = false;
        let level = 0;
        let output = '';
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].search(/<!/) > -1) {
                output += this._getIndent(level, parts[i]);
                inComment = true;
                if (parts[i].search(/-->/) > -1 || parts[i].search(/\]>/) > -1 || parts[i].search(/!DOCTYPE/) > -1) {
                    inComment = false;
                }
            }
            else if (parts[i].search(/-->/) > -1 || parts[i].search(/\]>/) > -1) {
                output += parts[i];
                inComment = false;
            }
            else if (/^<\w/.test(parts[i - 1]) && /^<\/\w/.test(parts[i])
                && /^<[\w:\-\.\,]+/.exec(parts[i - 1])[0] == /^<\/[\w:\-\.\,]+/.exec(parts[i])[0].replace('/', '')) {
                output += parts[i];
                if (!inComment)
                    level--;
            }
            else if (parts[i].search(/<\w/) > -1 && parts[i].search(/<\//) == -1 && parts[i].search(/\/>/) == -1) {
                output = (!inComment) ? output += this._getIndent(level++, parts[i]) : output += parts[i];
            }
            else if (parts[i].search(/<\w/) > -1 && parts[i].search(/<\//) > -1) {
                output = (!inComment) ? output += this._getIndent(level, parts[i]) : output += parts[i];
            }
            else if (parts[i].search(/<\//) > -1) {
                output = (!inComment) ? output += this._getIndent(--level, parts[i]) : output += parts[i];
            }
            else if (parts[i].search(/\/>/) > -1 && (!this.splitNamespaces || parts[i].search(/xmlns\:/) == -1)) {
                output = (!inComment) ? output += this._getIndent(level, parts[i]) : output += parts[i];
            }
            else if (parts[i].search(/\/>/) > -1 && parts[i].search(/xmlns\:/) > -1 && this.splitNamespaces) {
                output = (!inComment) ? output += this._getIndent(level--, parts[i]) : output += parts[i];
            }
            else if (parts[i].search(/<\?/) > -1) {
                output += this._getIndent(level, parts[i]);
            }
            else if (parts[i].search(/xmlns\:/) > -1 || parts[i].search(/xmlns\=/) > -1) {
                output += this._getIndent(level, parts[i]);
            }
            else {
                output += parts[i];
            }
        }
        if (output[0] == this.newLine) {
            output = output.slice(1);
        }
        else if (output.substring(0, 1) == this.newLine) {
            output = output.slice(2);
        }
        return output;
    }
    minify(xml, removeComments) {
        if (typeof removeComments === 'undefined') {
            removeComments = false;
        }
        xml = this._stripLineBreaks(xml);
        xml = (removeComments) ? xml.replace(/\<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/g, '') : xml;
        xml = xml.replace(/>\s{0,}</g, '><');
        xml = xml.replace(/"\s+(?=[^\s]+=)/g, '" ');
        xml = xml.replace(/"\s+(?=>)/g, '"');
        xml = xml.replace(/"\s+(?=\/>)/g, '" ');
        xml = xml.replace(/[^ <>="]\s+[^ <>="]+=/g, (match) => {
            return match.replace(/\s+/g, ' ');
        });
        return xml;
    }
    _getIndent(level, trailingValue) {
        trailingValue = trailingValue || '';
        return `${this.newLine}${this.indentPattern.repeat(level)}${trailingValue}`;
    }
    _stripLineBreaks(xml) {
        let output = '';
        let inTag = false;
        let inTagName = false;
        let inCdata = false;
        let inAttribute = false;
        for (let i = 0; i < xml.length; i++) {
            let char = xml.charAt(i);
            if (char == '!' && (xml.substr(i, 8) == '![CDATA[' || xml.substr(i, 3) == '!--')) {
                inCdata = true;
            }
            else if (char == ']' && (xml.substr(i, 3) == ']]>')) {
                inCdata = false;
            }
            else if (char == '-' && (xml.substr(i, 3) == '-->')) {
                inCdata = false;
            }
            else if (char.search(/[\r\n]/g) > -1 && !inCdata) {
                continue;
            }
            output += char;
        }
        return output;
    }
}
exports.XmlFormatter = XmlFormatter;
