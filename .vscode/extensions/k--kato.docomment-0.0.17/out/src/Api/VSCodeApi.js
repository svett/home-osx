"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const StringUtil_1 = require("../Utility/StringUtil");
class VSCodeApi {
    /*-------------------------------------------------------------------------
     * Public Method
     *-----------------------------------------------------------------------*/
    constructor(activeEditor) {
        this._activeEditor = activeEditor;
    }
    /*-------------------------------------------------------------------------
     * VS Code API
     *-----------------------------------------------------------------------*/
    IsLanguage(languageId) {
        return (this._activeEditor.document.languageId === languageId);
    }
    GetActivePosition() {
        return this._activeEditor.selection.active;
    }
    GetActiveLine() {
        return this.GetActivePosition().line;
    }
    GetLineCount() {
        return this._activeEditor.document.lineCount;
    }
    GetActiveCharPosition() {
        return this._activeEditor.selection.active.character;
    }
    GetPosition(line, charcter) {
        return new vscode_1.Position(line, charcter);
    }
    ShiftPositionLine(position, offset) {
        return this.GetPosition(position.line + offset, position.character);
    }
    ShiftPositionChar(position, offset) {
        return this.GetPosition(position.line, position.character + offset);
    }
    GetSelection(line, charcter) {
        return new vscode_1.Selection(line, charcter, line, charcter);
    }
    GetSelectionByPosition(anchor, active) {
        return new vscode_1.Selection(anchor, active);
    }
    MoveSelection(line, charcter) {
        const move = this.GetSelection(line, charcter);
        this._activeEditor.selection = move;
    }
    InsertText(position, text) {
        this._activeEditor.edit((editBuilder) => {
            editBuilder.insert(position, text);
        });
    }
    ReplaceText(selection, text) {
        this._activeEditor.edit((editBuilder) => {
            editBuilder.replace(selection, text);
        });
    }
    ReadLine(line) {
        return this._activeEditor.document.lineAt(line).text;
    }
    ReadLineAtCurrent() {
        return this.ReadLine(this.GetActiveLine());
    }
    ReadCharAtCurrent() {
        return this.ReadLineAtCurrent().charAt(this.GetActiveCharPosition());
    }
    ReadNextCodeFromCurrent(eol = '\n') {
        const lineCount = this.GetLineCount();
        const curLine = this.GetActiveLine();
        let code = '';
        for (let i = curLine; i < lineCount - 1; i++) {
            const line = this.ReadLine(i + 1);
            // Skip empty line
            if (StringUtil_1.StringUtil.IsNullOrWhiteSpace(line))
                continue;
            code += line + eol;
            // Detect start of code
            if (!StringUtil_1.StringUtil.IsCodeBlockStart(line)) {
                continue;
            }
            return StringUtil_1.StringUtil.RemoveComment(code);
        }
        return null;
    }
    ReadPreviousCodeFromCurrent() {
        const curLine = this.GetActiveLine();
        let code = '';
        for (let i = curLine; 0 < i; i--) {
            const line = this.ReadLine(i - 1);
            // Skip empty line
            if (StringUtil_1.StringUtil.IsNullOrWhiteSpace(line))
                continue;
            code += line;
            // Detect start of code
            if (!StringUtil_1.StringUtil.IsCodeBlockStart(line)) {
                continue;
            }
            return code;
        }
        return null;
    }
    ReadPreviousLineFromCurrent() {
        const curLine = this.GetActiveLine();
        for (let i = curLine; 0 < i; i--) {
            // Skip empty line
            const line = this.ReadLine(i - 1);
            if (StringUtil_1.StringUtil.IsNullOrWhiteSpace(line))
                continue;
            return line;
        }
        return null;
    }
    ReadNextLineFromCurrent() {
        const lineCount = this.GetLineCount();
        const curLine = this.GetActiveLine();
        for (let i = curLine; i < lineCount - 1; i++) {
            // Skip empty line
            const line = this.ReadLine(i + 1);
            if (StringUtil_1.StringUtil.IsNullOrWhiteSpace(line))
                continue;
            return line;
        }
        return null;
    }
}
exports.VSCodeApi = VSCodeApi;
//# sourceMappingURL=VSCodeApi.js.map