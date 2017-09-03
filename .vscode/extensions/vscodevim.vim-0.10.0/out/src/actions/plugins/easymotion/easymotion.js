"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const position_1 = require("./../../../common/motion/position");
const configuration_1 = require("./../../../configuration/configuration");
const textEditor_1 = require("./../../../textEditor");
class EasyMotion {
    constructor() {
        /**
         * Refers to the accumulated keys for depth navigation
         */
        this.accumulation = '';
        this._markers = [];
        this.visibleMarkers = [];
        this.decorations = [];
    }
    get markers() {
        return this._markers;
    }
    /**
     * Generate a marker following a sequence for the name and depth levels
     */
    static generateMarker(index, length, position, markerPosition) {
        const keyTable = EasyMotion.keyTable;
        let availableKeyTable = keyTable.slice();
        // Depth table should always include a ;
        const keyDepthTable = [';'];
        let totalSteps = 0;
        if (length >= keyTable.length) {
            const totalRemainder = Math.max(length - keyTable.length, 0);
            totalSteps = Math.floor(totalRemainder / keyTable.length);
            Array(Math.min(totalSteps, 26)).forEach(() => keyDepthTable.push(availableKeyTable.pop()));
        }
        let prefix = '';
        if (index >= availableKeyTable.length) {
            // Length of available keys before reset and ";"
            const oldLength = availableKeyTable.length;
            // The index that remains after taking away the first-level depth markers
            const remainder = index - availableKeyTable.length;
            // ";" can be used as the last marker key, when inside a marker with depth. Reset to available keys and add ";"
            availableKeyTable = keyTable.slice();
            availableKeyTable.push(';');
            // Depth index counts down instead of up
            const inverted = length - oldLength - 1 - remainder;
            const steps = Math.floor(inverted / availableKeyTable.length);
            // Add the key to the prefix
            if (steps > keyDepthTable.length - 1) {
                return null;
            }
            else {
                prefix += keyDepthTable[steps];
                // Check if we're on the last depth level
                if (steps >= totalSteps) {
                    // Return the proper key for this index
                    return new EasyMotion.Marker(prefix + availableKeyTable[remainder % availableKeyTable.length], markerPosition);
                }
                else {
                    // Return the proper index for depths earlier than the last one, including prefix
                    const num = (availableKeyTable.length - 1 - inverted % availableKeyTable.length) %
                        availableKeyTable.length;
                    return new EasyMotion.Marker(prefix + availableKeyTable[num], markerPosition);
                }
            }
        }
        else {
            // Return the last key in the marker, including prefix
            return new EasyMotion.Marker(prefix + availableKeyTable[index % availableKeyTable.length], markerPosition);
        }
    }
    /**
     * Create and cache decoration types for different marker lengths
     */
    static getDecorationType(length) {
        const cache = this.decorationTypeCache[length];
        if (cache) {
            return cache;
        }
        else {
            const width = length * 8;
            const type = vscode.window.createTextEditorDecorationType({
                after: {
                    margin: `0 0 0 -${width}px`,
                    height: `14px`,
                    width: `${width}px`,
                },
            });
            this.decorationTypeCache[length] = type;
            return type;
        }
    }
    /**
     * Create and cache the SVG data URI for different marker codes and colors
     */
    static getSvgDataUri(code, backgroundColor = 'black', fontFamily = 'Consolas', fontColor = 'white', fontSize = '14', fontWeight = 'normal') {
        // Clear cache if the backgroundColor or fontColor has changed
        if (this.cachedBackgroundColor !== backgroundColor) {
            this.svgCache = {};
            this.cachedBackgroundColor = backgroundColor;
        }
        if (this.cachedOneFontColor !== configuration_1.Configuration.easymotionMarkerForegroundColorOneChar) {
            this.svgCache = {};
            this.cachedOneFontColor = configuration_1.Configuration.easymotionMarkerForegroundColorOneChar;
        }
        if (this.cachedTwoFontColor !== configuration_1.Configuration.easymotionMarkerForegroundColorTwoChar) {
            this.svgCache = {};
            this.cachedTwoFontColor = configuration_1.Configuration.easymotionMarkerForegroundColorTwoChar;
        }
        const widthPerChar = configuration_1.Configuration.easymotionMarkerWidthPerChar;
        const width = code.length * widthPerChar + 1;
        const height = configuration_1.Configuration.easymotionMarkerHeight;
        if (this.cachedWidthPerChar !== widthPerChar || this.cachedHeight !== height) {
            this.svgCache = {};
            this.cachedWidthPerChar = width;
            this.cachedHeight = height;
        }
        const cache = this.svgCache[code];
        if (cache) {
            return cache;
        }
        else {
            const uri = vscode.Uri.parse(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ` +
                `${height}" height="${height}" width="${width}"><rect width="${width}" height="${height}" rx="2" ry="2" ` +
                `style="fill: ${backgroundColor}"></rect><text font-family="${fontFamily}" font-size="${fontSize}" ` +
                `font-weight="${fontWeight}" fill="${fontColor}" x="1" y="${configuration_1.Configuration.easymotionMarkerYOffset}">${code}</text></svg>`);
            this.svgCache[code] = uri;
            return uri;
        }
    }
    /**
     * Clear all decorations
     */
    clearDecorations() {
        const editor = vscode.window.activeTextEditor;
        for (let i = 1; i <= this.decorations.length; i++) {
            editor.setDecorations(EasyMotion.getDecorationType(i), []);
        }
    }
    /**
     * Clear all markers
     */
    clearMarkers() {
        this._markers = [];
        this.visibleMarkers = [];
    }
    addMarker(marker) {
        this._markers.push(marker);
    }
    getMarker(index) {
        return this._markers[index];
    }
    /**
     * Find markers beginning with a string
     */
    findMarkers(nail, onlyVisible) {
        const markers = onlyVisible ? this.visibleMarkers : this._markers;
        return markers.filter(marker => marker.name.startsWith(nail));
    }
    /**
     * Search and sort using the index of a match compared to the index of position (usually the cursor)
     */
    sortedSearch(position, search = '', options = {}) {
        const regex = typeof search === 'string'
            ? new RegExp(search.replace(EasyMotion.specialCharactersRegex, '\\$&'), 'g')
            : search;
        const matches = [];
        // Cursor index refers to the index of the marker that is on or to the right of the cursor
        let cursorIndex = position.character;
        let prevMatch;
        // Calculate the min/max bounds for the search
        const lineCount = textEditor_1.TextEditor.getLineCount();
        const lineMin = options.min ? Math.max(options.min.line, 0) : 0;
        const lineMax = options.max ? Math.min(options.max.line + 1, lineCount) : lineCount;
        outer: for (let lineIdx = lineMin; lineIdx < lineMax; lineIdx++) {
            const line = textEditor_1.TextEditor.getLineAt(new position_1.Position(lineIdx, 0)).text;
            let result = regex.exec(line);
            while (result) {
                if (matches.length >= 1000) {
                    break outer;
                }
                else {
                    const pos = new position_1.Position(lineIdx, result.index);
                    // Check if match is within bounds
                    if ((options.min && pos.isBefore(options.min)) ||
                        (options.max && pos.isAfter(options.max)) ||
                        Math.abs(pos.line - position.line) > 100) {
                        // Stop searching after 100 lines in both directions
                        result = regex.exec(line);
                    }
                    else {
                        // Update cursor index to the marker on the right side of the cursor
                        if (!prevMatch || prevMatch.position.isBefore(position)) {
                            cursorIndex = matches.length;
                        }
                        // Matches on the cursor position should be ignored
                        if (pos.isEqual(position)) {
                            result = regex.exec(line);
                        }
                        else {
                            prevMatch = new EasyMotion.Match(pos, result[0], matches.length);
                            matches.push(prevMatch);
                            result = regex.exec(line);
                        }
                    }
                }
            }
        }
        // Sort by the index distance from the cursor index
        matches.sort((a, b) => {
            const absDiffA = computeAboluteDiff(a.index);
            const absDiffB = computeAboluteDiff(b.index);
            return absDiffA - absDiffB;
            function computeAboluteDiff(matchIndex) {
                const absDiff = Math.abs(cursorIndex - matchIndex);
                // Prioritize the matches on the right side of the cursor index
                return matchIndex < cursorIndex ? absDiff - 0.5 : absDiff;
            }
        });
        return matches;
    }
    updateDecorations() {
        this.clearDecorations();
        this.visibleMarkers = [];
        this.decorations = [];
        // Ignore markers that do not start with the accumulated depth level
        for (const marker of this._markers.filter(m => m.name.startsWith(this.accumulation))) {
            const pos = marker.position;
            // Get keys after the depth we're at
            const keystroke = marker.name.substr(this.accumulation.length);
            if (!this.decorations[keystroke.length]) {
                this.decorations[keystroke.length] = [];
            }
            const fontColor = keystroke.length > 1
                ? configuration_1.Configuration.easymotionMarkerForegroundColorTwoChar
                : configuration_1.Configuration.easymotionMarkerForegroundColorOneChar;
            const renderOptions = {
                after: {
                    contentIconPath: EasyMotion.getSvgDataUri(keystroke, configuration_1.Configuration.easymotionMarkerBackgroundColor, configuration_1.Configuration.easymotionMarkerFontFamily, fontColor, configuration_1.Configuration.easymotionMarkerFontSize, configuration_1.Configuration.easymotionMarkerFontWeight),
                },
            };
            // Position should be offsetted by the length of the keystroke to prevent hiding behind the gutter
            const charPos = pos.character + 1 + (keystroke.length - 1);
            this.decorations[keystroke.length].push({
                range: new vscode.Range(pos.line, charPos, pos.line, charPos),
                renderOptions: {
                    dark: renderOptions,
                    light: renderOptions,
                },
            });
            this.visibleMarkers.push(marker);
        }
        // Set the decorations for all the different marker lengths
        const editor = vscode.window.activeTextEditor;
        for (let j = 1; j < this.decorations.length; j++) {
            if (this.decorations[j]) {
                editor.setDecorations(EasyMotion.getDecorationType(j), this.decorations[j]);
            }
        }
    }
}
/**
 * TODO: For future motions
 */
EasyMotion.specialCharactersRegex = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;
/**
 * Caches for decorations
 */
EasyMotion.decorationTypeCache = [];
EasyMotion.svgCache = {};
EasyMotion.cachedBackgroundColor = '';
EasyMotion.cachedOneFontColor = '';
EasyMotion.cachedTwoFontColor = '';
EasyMotion.cachedWidthPerChar = -1;
EasyMotion.cachedHeight = -1;
/**
 * The key sequence for marker name generation
 */
EasyMotion.keyTable = [
    'a',
    's',
    'd',
    'g',
    'h',
    'k',
    'l',
    'q',
    'w',
    'e',
    'r',
    't',
    'y',
    'u',
    'i',
    'o',
    'p',
    'z',
    'x',
    'c',
    'v',
    'b',
    'n',
    'm',
    'f',
    'j',
];
exports.EasyMotion = EasyMotion;
(function (EasyMotion) {
    class Marker {
        constructor(name, position) {
            this._name = name;
            this._position = position;
        }
        get name() {
            return this._name;
        }
        get position() {
            return this._position;
        }
    }
    EasyMotion.Marker = Marker;
    class Match {
        constructor(position, text, index) {
            this._position = position;
            this._text = text;
            this._index = index;
        }
        get position() {
            return this._position;
        }
        get text() {
            return this._text;
        }
        get index() {
            return this._index;
        }
        set position(position) {
            this._position = position;
        }
        toRange() {
            return new vscode.Range(this.position, this.position.translate(0, this.text.length));
        }
    }
    EasyMotion.Match = Match;
})(EasyMotion = exports.EasyMotion || (exports.EasyMotion = {}));
//# sourceMappingURL=easymotion.js.map