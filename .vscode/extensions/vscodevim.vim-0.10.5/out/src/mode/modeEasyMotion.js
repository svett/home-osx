"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mode_1 = require("./mode");
const mode_2 = require("./mode");
class EasyMotionMode extends mode_1.Mode {
    constructor() {
        super(mode_1.ModeName.EasyMotionMode);
        this.text = 'EasyMotion Mode';
        this.cursorType = mode_2.VSCodeVimCursorType.Block;
    }
}
exports.EasyMotionMode = EasyMotionMode;
class EasyMotionInputMode extends mode_1.Mode {
    constructor() {
        super(mode_1.ModeName.EasyMotionInputMode);
        this.text = 'EasyMotion Input';
        this.cursorType = mode_2.VSCodeVimCursorType.Block;
    }
}
exports.EasyMotionInputMode = EasyMotionInputMode;
//# sourceMappingURL=modeEasyMotion.js.map