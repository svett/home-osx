/**
 * Status bar view.
 */
var StatusBarView = (function () {
    function StatusBarView(statusBarItem) {
        this._statusBarItem = statusBarItem;
    }
    ;
    StatusBarView.prototype.refresh = function (text) {
        this._statusBarItem.text = text;
        this._statusBarItem.show();
    };
    return StatusBarView;
})();
exports.StatusBarView = StatusBarView;
//# sourceMappingURL=statusbar.view.js.map