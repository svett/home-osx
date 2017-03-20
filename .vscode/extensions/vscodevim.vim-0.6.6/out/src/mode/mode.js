"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ModeName;
(function (ModeName) {
    ModeName[ModeName["Normal"] = 0] = "Normal";
    ModeName[ModeName["Insert"] = 1] = "Insert";
    ModeName[ModeName["Visual"] = 2] = "Visual";
    ModeName[ModeName["VisualBlock"] = 3] = "VisualBlock";
    ModeName[ModeName["VisualLine"] = 4] = "VisualLine";
    ModeName[ModeName["VisualBlockInsertMode"] = 5] = "VisualBlockInsertMode";
    ModeName[ModeName["SearchInProgressMode"] = 6] = "SearchInProgressMode";
    ModeName[ModeName["Replace"] = 7] = "Replace";
    ModeName[ModeName["EasyMotionMode"] = 8] = "EasyMotionMode";
    ModeName[ModeName["SurroundInputMode"] = 9] = "SurroundInputMode";
})(ModeName = exports.ModeName || (exports.ModeName = {}));
var VSCodeVimCursorType;
(function (VSCodeVimCursorType) {
    VSCodeVimCursorType[VSCodeVimCursorType["Block"] = 0] = "Block";
    VSCodeVimCursorType[VSCodeVimCursorType["Line"] = 1] = "Line";
    VSCodeVimCursorType[VSCodeVimCursorType["Underline"] = 2] = "Underline";
    VSCodeVimCursorType[VSCodeVimCursorType["TextDecoration"] = 3] = "TextDecoration";
})(VSCodeVimCursorType = exports.VSCodeVimCursorType || (exports.VSCodeVimCursorType = {}));
class Mode {
    constructor(name) {
        this.isVisualMode = false;
        this._name = name;
        this._isActive = false;
    }
    get name() {
        return this._name;
    }
    get isActive() {
        return this._isActive;
    }
    set isActive(val) {
        this._isActive = val;
    }
}
exports.Mode = Mode;
//# sourceMappingURL=mode.js.map