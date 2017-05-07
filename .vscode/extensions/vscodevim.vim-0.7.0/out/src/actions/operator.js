"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const register_1 = require("./../register/register");
const position_1 = require("./../common/motion/position");
const range_1 = require("./../common/motion/range");
const mode_1 = require("./../mode/mode");
const textEditor_1 = require("./../textEditor");
const base_1 = require("./base");
class BaseOperator extends base_1.BaseAction {
    constructor(multicursorIndex) {
        super();
        this.canBeRepeatedWithDot = true;
        /**
         * If this is being run in multi cursor mode, the index of the cursor
         * this operator is being applied to.
         */
        this.multicursorIndex = undefined;
        this.multicursorIndex = multicursorIndex;
    }
    doesActionApply(vimState, keysPressed) {
        if (this.modes.indexOf(vimState.currentMode) === -1) {
            return false;
        }
        if (!base_1.compareKeypressSequence(this.keys, keysPressed)) {
            return false;
        }
        if (vimState.recordedState.actionsRun.length > 0 &&
            this.mustBeFirstKey) {
            return false;
        }
        if (this instanceof BaseOperator && vimState.recordedState.operator) {
            return false;
        }
        return true;
    }
    couldActionApply(vimState, keysPressed) {
        if (this.modes.indexOf(vimState.currentMode) === -1) {
            return false;
        }
        if (!base_1.compareKeypressSequence(this.keys.slice(0, keysPressed.length), keysPressed)) {
            return false;
        }
        if (vimState.recordedState.actionsRun.length > 0 &&
            this.mustBeFirstKey) {
            return false;
        }
        if (this instanceof BaseOperator && vimState.recordedState.operator) {
            return false;
        }
        return true;
    }
    /**
     * Run this operator on a range, returning the new location of the cursor.
     */
    run(vimState, start, stop) {
        throw new Error("You need to override this!");
    }
}
exports.BaseOperator = BaseOperator;
let DeleteOperator = class DeleteOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["d"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    /**
     * Deletes from the position of start to 1 past the position of end.
     */
    delete(start, end, currentMode, registerMode, vimState, yank = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (registerMode === register_1.RegisterMode.LineWise) {
                start = start.getLineBegin();
                end = end.getLineEnd();
            }
            end = new position_1.Position(end.line, end.character + 1);
            const isOnLastLine = end.line === textEditor_1.TextEditor.getLineCount() - 1;
            // Vim does this weird thing where it allows you to select and delete
            // the newline character, which it places 1 past the last character
            // in the line. Here we interpret a character position 1 past the end
            // as selecting the newline character. Don't allow this in visual block mode
            if (vimState.currentMode !== mode_1.ModeName.VisualBlock) {
                if (end.character === textEditor_1.TextEditor.getLineAt(end).text.length + 1) {
                    end = end.getDown(0);
                }
            }
            let text = vimState.editor.document.getText(new vscode.Range(start, end));
            // If we delete linewise to the final line of the document, we expect the line
            // to be removed. This is actually a special case because the newline
            // character we've selected to delete is the newline on the end of the document,
            // but we actually delete the newline on the second to last line.
            // Just writing about this is making me more confused. -_-
            // rebornix: johnfn's description about this corner case is perfectly correct. The only catch is
            // that we definitely don't want to put the EOL in the register. So here we run the `getText`
            // expression first and then update the start position.
            // Now rebornix is confused as well.
            if (isOnLastLine &&
                start.line !== 0 &&
                registerMode === register_1.RegisterMode.LineWise) {
                start = start.getPreviousLineBegin().getLineEnd();
            }
            if (registerMode === register_1.RegisterMode.LineWise) {
                // slice final newline in linewise mode - linewise put will add it back.
                text = text.endsWith("\r\n") ? text.slice(0, -2) : (text.endsWith('\n') ? text.slice(0, -1) : text);
            }
            if (yank) {
                register_1.Register.put(text, vimState, this.multicursorIndex);
            }
            let diff = new position_1.PositionDiff(0, 0);
            let resultingPosition;
            if (currentMode === mode_1.ModeName.Visual) {
                resultingPosition = position_1.Position.EarlierOf(start, end);
            }
            if (start.character > textEditor_1.TextEditor.getLineAt(start).text.length) {
                resultingPosition = start.getLeft();
                diff = new position_1.PositionDiff(0, -1);
            }
            else {
                resultingPosition = start;
            }
            if (registerMode === register_1.RegisterMode.LineWise) {
                resultingPosition = resultingPosition.getLineBegin();
                diff = position_1.PositionDiff.NewBOLDiff();
            }
            vimState.recordedState.transformations.push({
                type: "deleteRange",
                range: new range_1.Range(start, end),
                diff: diff,
            });
            return resultingPosition;
        });
    }
    run(vimState, start, end, yank = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delete(start, end, vimState.currentMode, vimState.effectiveRegisterMode(), vimState, yank);
            vimState.currentMode = mode_1.ModeName.Normal;
            /*
              vimState.cursorPosition      = result;
              vimState.cursorStartPosition = result;
            */
            return vimState;
        });
    }
};
DeleteOperator = __decorate([
    base_1.RegisterAction
], DeleteOperator);
exports.DeleteOperator = DeleteOperator;
let DeleteOperatorVisual = class DeleteOperatorVisual extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["D"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            // ensures linewise deletion when in visual mode
            // see special case in DeleteOperator.delete()
            vimState.currentRegisterMode = register_1.RegisterMode.LineWise;
            return yield new DeleteOperator(this.multicursorIndex).run(vimState, start, end);
        });
    }
};
DeleteOperatorVisual = __decorate([
    base_1.RegisterAction
], DeleteOperatorVisual);
exports.DeleteOperatorVisual = DeleteOperatorVisual;
let YankOperator = class YankOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["y"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.canBeRepeatedWithDot = false;
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            // Hack to make Surround with y (which takes a motion) work.
            if (vimState.surround) {
                vimState.surround.range = new range_1.Range(start, end);
                vimState.currentMode = mode_1.ModeName.SurroundInputMode;
                vimState.cursorPosition = start;
                vimState.cursorStartPosition = start;
                return vimState;
            }
            const originalMode = vimState.currentMode;
            if (start.compareTo(end) <= 0) {
                end = new position_1.Position(end.line, end.character + 1);
            }
            else {
                const tmp = start;
                start = end;
                end = tmp;
                end = new position_1.Position(end.line, end.character + 1);
            }
            if (vimState.currentRegisterMode === register_1.RegisterMode.LineWise) {
                start = start.getLineBegin();
                end = end.getLineEnd();
            }
            let text = textEditor_1.TextEditor.getText(new vscode.Range(start, end));
            // If we selected the newline character, add it as well.
            if (vimState.currentMode === mode_1.ModeName.Visual &&
                end.character === textEditor_1.TextEditor.getLineAt(end).text.length + 1) {
                text = text + "\n";
            }
            register_1.Register.put(text, vimState, this.multicursorIndex);
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorStartPosition = start;
            if (originalMode === mode_1.ModeName.Normal) {
                vimState.allCursors = vimState.cursorPositionJustBeforeAnythingHappened.map(x => new range_1.Range(x, x));
            }
            else {
                vimState.cursorPosition = start;
            }
            return vimState;
        });
    }
};
YankOperator = __decorate([
    base_1.RegisterAction
], YankOperator);
exports.YankOperator = YankOperator;
let ShiftYankOperatorVisual = class ShiftYankOperatorVisual extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["Y"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine, mode_1.ModeName.VisualBlock];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            vimState.currentRegisterMode = register_1.RegisterMode.LineWise;
            return yield new YankOperator().run(vimState, start, end);
        });
    }
};
ShiftYankOperatorVisual = __decorate([
    base_1.RegisterAction
], ShiftYankOperatorVisual);
exports.ShiftYankOperatorVisual = ShiftYankOperatorVisual;
let DeleteOperatorXVisual = class DeleteOperatorXVisual extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["x"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new DeleteOperator(this.multicursorIndex).run(vimState, start, end);
        });
    }
};
DeleteOperatorXVisual = __decorate([
    base_1.RegisterAction
], DeleteOperatorXVisual);
exports.DeleteOperatorXVisual = DeleteOperatorXVisual;
let ChangeOperatorSVisual = class ChangeOperatorSVisual extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["s"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new ChangeOperator().run(vimState, start, end);
        });
    }
};
ChangeOperatorSVisual = __decorate([
    base_1.RegisterAction
], ChangeOperatorSVisual);
exports.ChangeOperatorSVisual = ChangeOperatorSVisual;
let FormatOperator = class FormatOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["="];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine, mode_1.ModeName.VisualBlock];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            vimState.editor.selection = new vscode.Selection(start, end);
            yield vscode.commands.executeCommand("editor.action.formatSelection");
            let line = vimState.cursorStartPosition.line;
            if (vimState.cursorStartPosition.isAfter(vimState.cursorPosition)) {
                line = vimState.cursorPosition.line;
            }
            let newCursorPosition = new position_1.Position(line, 0);
            vimState.cursorPosition = newCursorPosition;
            vimState.cursorStartPosition = newCursorPosition;
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
FormatOperator = __decorate([
    base_1.RegisterAction
], FormatOperator);
exports.FormatOperator = FormatOperator;
let UpperCaseOperator = class UpperCaseOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["U"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            const range = new vscode.Range(start, new position_1.Position(end.line, end.character + 1));
            let text = vimState.editor.document.getText(range);
            yield textEditor_1.TextEditor.replace(range, text.toUpperCase());
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start;
            return vimState;
        });
    }
};
UpperCaseOperator = __decorate([
    base_1.RegisterAction
], UpperCaseOperator);
exports.UpperCaseOperator = UpperCaseOperator;
let UpperCaseWithMotion = class UpperCaseWithMotion extends UpperCaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["g", "U"];
        this.modes = [mode_1.ModeName.Normal];
    }
};
UpperCaseWithMotion = __decorate([
    base_1.RegisterAction
], UpperCaseWithMotion);
exports.UpperCaseWithMotion = UpperCaseWithMotion;
let LowerCaseOperator = class LowerCaseOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["u"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            const range = new vscode.Range(start, new position_1.Position(end.line, end.character + 1));
            let text = vimState.editor.document.getText(range);
            yield textEditor_1.TextEditor.replace(range, text.toLowerCase());
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start;
            return vimState;
        });
    }
};
LowerCaseOperator = __decorate([
    base_1.RegisterAction
], LowerCaseOperator);
exports.LowerCaseOperator = LowerCaseOperator;
let LowerCaseWithMotion = class LowerCaseWithMotion extends LowerCaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["g", "u"];
        this.modes = [mode_1.ModeName.Normal];
    }
};
LowerCaseWithMotion = __decorate([
    base_1.RegisterAction
], LowerCaseWithMotion);
exports.LowerCaseWithMotion = LowerCaseWithMotion;
let IndentOperator = class IndentOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = [">"];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            vimState.editor.selection = new vscode.Selection(start.getLineBegin(), end.getLineEnd());
            yield vscode.commands.executeCommand("editor.action.indentLines");
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start.getFirstLineNonBlankChar();
            return vimState;
        });
    }
};
IndentOperator = __decorate([
    base_1.RegisterAction
], IndentOperator);
/**
 * `3>` to indent a line 3 times in visual mode is actually a bit of a special case.
 *
 * > is an operator, and generally speaking, you don't run operators multiple times, you run motions multiple times.
 * e.g. `d3w` runs `w` 3 times, then runs d once.
 *
 * Same with literally every other operator motion combination... until `3>`in visual mode
 * walked into my life.
 */
let IndentOperatorInVisualModesIsAWeirdSpecialCase = class IndentOperatorInVisualModesIsAWeirdSpecialCase extends BaseOperator {
    /**
     * `3>` to indent a line 3 times in visual mode is actually a bit of a special case.
     *
     * > is an operator, and generally speaking, you don't run operators multiple times, you run motions multiple times.
     * e.g. `d3w` runs `w` 3 times, then runs d once.
     *
     * Same with literally every other operator motion combination... until `3>`in visual mode
     * walked into my life.
     */
    constructor() {
        super(...arguments);
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = [">"];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < (vimState.recordedState.count || 1); i++) {
                yield vscode.commands.executeCommand("editor.action.indentLines");
            }
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start.getFirstLineNonBlankChar();
            return vimState;
        });
    }
};
IndentOperatorInVisualModesIsAWeirdSpecialCase = __decorate([
    base_1.RegisterAction
], IndentOperatorInVisualModesIsAWeirdSpecialCase);
let OutdentOperator = class OutdentOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["<"];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            vimState.editor.selection = new vscode.Selection(start, end);
            yield vscode.commands.executeCommand("editor.action.outdentLines");
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start.getFirstLineNonBlankChar();
            return vimState;
        });
    }
};
OutdentOperator = __decorate([
    base_1.RegisterAction
], OutdentOperator);
/**
 * See comment for IndentOperatorInVisualModesIsAWeirdSpecialCase
 */
let OutdentOperatorInVisualModesIsAWeirdSpecialCase = class OutdentOperatorInVisualModesIsAWeirdSpecialCase extends BaseOperator {
    /**
     * See comment for IndentOperatorInVisualModesIsAWeirdSpecialCase
     */
    constructor() {
        super(...arguments);
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<"];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < (vimState.recordedState.count || 1); i++) {
                yield vscode.commands.executeCommand("editor.action.outdentLines");
            }
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start.getFirstLineNonBlankChar();
            return vimState;
        });
    }
};
OutdentOperatorInVisualModesIsAWeirdSpecialCase = __decorate([
    base_1.RegisterAction
], OutdentOperatorInVisualModesIsAWeirdSpecialCase);
let ChangeOperator = class ChangeOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["c"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            const isEndOfLine = end.character === end.getLineEnd().character;
            let state = vimState;
            // If we delete to EOL, the block cursor would end on the final character,
            // which means the insert cursor would be one to the left of the end of
            // the line. We do want to run delete if it is a multiline change though ex. c}
            if (position_1.Position.getLineLength(textEditor_1.TextEditor.getLineAt(start).lineNumber) !== 0 || (end.line !== start.line)) {
                if (isEndOfLine) {
                    state = yield new DeleteOperator(this.multicursorIndex).run(vimState, start, end.getLeftThroughLineBreaks());
                }
                else {
                    state = yield new DeleteOperator(this.multicursorIndex).run(vimState, start, end);
                }
            }
            state.currentMode = mode_1.ModeName.Insert;
            if (isEndOfLine) {
                state.cursorPosition = state.cursorPosition.getRight();
            }
            return state;
        });
    }
};
ChangeOperator = __decorate([
    base_1.RegisterAction
], ChangeOperator);
exports.ChangeOperator = ChangeOperator;
let YankVisualBlockMode = class YankVisualBlockMode extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["y"];
        this.modes = [mode_1.ModeName.VisualBlock];
        this.canBeRepeatedWithDot = false;
    }
    runsOnceForEveryCursor() { return false; }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            let toCopy = "";
            for (const { line } of position_1.Position.IterateLine(vimState)) {
                toCopy += line + '\n';
            }
            register_1.Register.put(toCopy, vimState, this.multicursorIndex);
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start;
            return vimState;
        });
    }
};
YankVisualBlockMode = __decorate([
    base_1.RegisterAction
], YankVisualBlockMode);
exports.YankVisualBlockMode = YankVisualBlockMode;
let ToggleCaseOperator = ToggleCaseOperator_1 = class ToggleCaseOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["~"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            const range = new vscode.Range(start, end.getRight());
            yield ToggleCaseOperator_1.toggleCase(range);
            const cursorPosition = start.isBefore(end) ? start : end;
            vimState.cursorPosition = cursorPosition;
            vimState.cursorStartPosition = cursorPosition;
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
    static toggleCase(range) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = textEditor_1.TextEditor.getText(range);
            let newText = "";
            for (var i = 0; i < text.length; i++) {
                var char = text[i];
                // Try lower-case
                let toggled = char.toLocaleLowerCase();
                if (toggled === char) {
                    // Try upper-case
                    toggled = char.toLocaleUpperCase();
                }
                newText += toggled;
            }
            yield textEditor_1.TextEditor.replace(range, newText);
        });
    }
};
ToggleCaseOperator = ToggleCaseOperator_1 = __decorate([
    base_1.RegisterAction
], ToggleCaseOperator);
exports.ToggleCaseOperator = ToggleCaseOperator;
let ToggleCaseVisualBlockOperator = class ToggleCaseVisualBlockOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["~"];
        this.modes = [mode_1.ModeName.VisualBlock];
    }
    run(vimState, startPos, endPos) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const { start, end } of position_1.Position.IterateLine(vimState)) {
                const range = new vscode.Range(start, end);
                yield ToggleCaseOperator.toggleCase(range);
            }
            const cursorPosition = startPos.isBefore(endPos) ? startPos : endPos;
            vimState.cursorPosition = cursorPosition;
            vimState.cursorStartPosition = cursorPosition;
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
ToggleCaseVisualBlockOperator = __decorate([
    base_1.RegisterAction
], ToggleCaseVisualBlockOperator);
let ToggleCaseWithMotion = class ToggleCaseWithMotion extends ToggleCaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["g", "~"];
        this.modes = [mode_1.ModeName.Normal];
    }
};
ToggleCaseWithMotion = __decorate([
    base_1.RegisterAction
], ToggleCaseWithMotion);
let CommentOperator = class CommentOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["g", "b"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            vimState.editor.selection = new vscode.Selection(start.getLineBegin(), end.getLineEnd());
            yield vscode.commands.executeCommand("editor.action.commentLine");
            vimState.cursorPosition = new position_1.Position(start.line, 0);
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
CommentOperator = __decorate([
    base_1.RegisterAction
], CommentOperator);
exports.CommentOperator = CommentOperator;
let CommentBlockOperator = class CommentBlockOperator extends BaseOperator {
    constructor() {
        super(...arguments);
        this.keys = ["g", "B"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, void 0, function* () {
            const endPosition = vimState.currentMode === mode_1.ModeName.Normal ? end.getRight() : end;
            vimState.editor.selection = new vscode.Selection(start, endPosition);
            yield vscode.commands.executeCommand("editor.action.blockComment");
            vimState.cursorPosition = start;
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
CommentBlockOperator = __decorate([
    base_1.RegisterAction
], CommentBlockOperator);
exports.CommentBlockOperator = CommentBlockOperator;
var ToggleCaseOperator_1;
//# sourceMappingURL=operator.js.map