"use strict";
var StatusBarView = (function () {
    function StatusBarView(statusBarItem) {
        this._statusBarItem = statusBarItem;
        this._statusBarItem.command = "extension.blame";
    }
    ;
    StatusBarView.prototype.refresh = function (text) {
        this._statusBarItem.text = '$(git-commit) ' + text;
        this._statusBarItem.tooltip = 'git blame';
        // this._statusBarItem.command = 'extension.blame';
        this._statusBarItem.show();
    };
    return StatusBarView;
}());
exports.StatusBarView = StatusBarView;
//# sourceMappingURL=view.js.map