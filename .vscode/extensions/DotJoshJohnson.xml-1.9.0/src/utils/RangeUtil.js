'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vsc = require("vscode");
class RangeUtil {
    static getRangeForDocument(document) {
        let lastLineIndex = (document.lineCount - 1);
        let range = new vsc.Range(new vsc.Position(0, 0), new vsc.Position(lastLineIndex, Number.MAX_VALUE));
        range = document.validateRange(range);
        return range;
    }
}
exports.RangeUtil = RangeUtil;
