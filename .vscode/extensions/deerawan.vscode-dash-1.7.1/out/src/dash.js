"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Dash = /** @class */ (function () {
    function Dash(OS) {
        this.OS = OS;
        this.URIHandler =
            {
                darwin: 'open -g',
                linux: 'zeal',
                // start Zeal before we pass it a URI so it works whether Zeal is running in background or not.
                // Why is this needed? I have no idea, but I think Qt has to start up a listener on cmd before it will work.
                win32: 'start dash-plugin:// && start',
            }[this.OS] || 'zeal';
    }
    /**
     * Get command to open dash
     *
     * @param {string} query - text to find
     * @param {string} docsets - array of docset e.g. [css, less]
     * @return {string} dash handler and uri
     */
    Dash.prototype.getCommand = function (query, docsets) {
        if (docsets === void 0) { docsets = []; }
        var uri = 'dash-plugin://query=' + encodeURIComponent(query);
        var keys = this.getKeys(docsets);
        if (keys) {
            uri += '&keys=' + keys;
        }
        return this.URIHandler + ' ' + this.getOSSpecificURI(uri);
    };
    /**
     * Get docset keys parameter for dash
     *
     * @param {Array<string>} docsets - array of docset e.g [css, less]
     * @return {string} joined array in string e.g. "ruby,css,dimas" or empty string
     */
    Dash.prototype.getKeys = function (docsets) {
        if (docsets.length > 0) {
            return docsets.join(',');
        }
        return '';
    };
    /**
     * Returns the OS specific URI to be handled.
     *
     * @param {string} uri - original constructed URI
     * @return {string} OS-specific URI to pass to handler, mainly because of Windows
     */
    Dash.prototype.getOSSpecificURI = function (uri) {
        return ({
            // on Windows, start can't deal with the double quotes, and & needs to be escaped with ^
            win32: uri.replace('&', '^&'),
        }[this.OS] || '"' + uri + '"');
    };
    return Dash;
}());
exports.Dash = Dash;
//# sourceMappingURL=dash.js.map