var Dash = (function () {
    function Dash() {
    }
    /**
     * Get command to open dash
     *
     * @param {string} query - text to find
     * @param {string} docsets - array of docset e.g. [css, less]
     * @return {string} dash uri
     */
    Dash.prototype.getCommand = function (query, docsets) {
        if (docsets === void 0) { docsets = []; }
        var uri = 'dash-plugin://query=' + encodeURIComponent(query);
        var keys = this.getKeys(docsets);
        if (keys) {
            uri += '&keys=' + keys;
        }
        return 'open -g "' + uri + '"';
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
    return Dash;
})();
exports.Dash = Dash;
//# sourceMappingURL=dash.js.map