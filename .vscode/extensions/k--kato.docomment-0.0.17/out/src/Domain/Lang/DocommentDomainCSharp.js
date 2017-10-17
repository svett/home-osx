"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SyntacticAnalysisCSharp_1 = require("../../SyntacticAnalysis/SyntacticAnalysisCSharp");
const StringUtil_1 = require("../../Utility/StringUtil");
const DocommentDomain_1 = require("../DocommentDomain");
const IDocommentDomain_1 = require("../IDocommentDomain");
class DocommentDomainCSharp extends DocommentDomain_1.DocommentDomain {
    constructor() {
        super(...arguments);
        /*-------------------------------------------------------------------------
         * Field
         *-----------------------------------------------------------------------*/
        this._isEnterKey = false;
    }
    /*-------------------------------------------------------------------------
     * Domain Method
     *-----------------------------------------------------------------------*/
    /* @override */
    IsTriggerDocomment() {
        // NG: KeyCode is EMPTY
        const eventText = this._event.text;
        if (eventText == null || eventText === '') {
            return false;
        }
        // NG: ActiveChar is NULL
        const activeChar = this._vsCodeApi.ReadCharAtCurrent();
        if (activeChar == null) {
            return false;
        }
        // NG: KeyCode is NOT '/' or Enter
        const isSlashKey = SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsSlashKey(activeChar);
        const isEnterKey = SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsEnterKey(activeChar, eventText);
        if (!isSlashKey && !isEnterKey) {
            return false;
        }
        this._isEnterKey = isEnterKey;
        // NG: Activate on Enter NOT '/'
        if (this._config.activateOnEnter) {
            if (isSlashKey) {
                return false;
            }
        }
        // NG: '////'
        const activeLine = this._vsCodeApi.ReadLineAtCurrent();
        if (isSlashKey) {
            // NG: '////'
            if (!SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsDocCommentStrict(activeLine)) {
                return false;
            }
            // NG: '/' => Insert => Event => ' /// '
            if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsDoubleDocComment(activeLine)) {
                return false;
            }
        }
        if (isEnterKey) {
            // NG: '////'
            if (!SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsDocComment(activeLine)) {
                return false;
            }
        }
        // OK
        return true;
    }
    /* @override */
    GetCode() {
        const code = this._vsCodeApi.ReadNextCodeFromCurrent(this._config.eol);
        const removedAttr = code.split(this._config.eol).filter(line => !SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsAttribute(line.trim())).join('');
        return removedAttr;
    }
    /* @override */
    GetCodeType(code) {
        // If the previous line was a doc comment and we hit enter.
        // Extend the doc comment without generating anything else,
        // even if there's a method or something next line.
        if (this._isEnterKey && SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsDocComment(this._vsCodeApi.ReadLineAtCurrent())) {
            return IDocommentDomain_1.CodeType.Comment;
        }
        /* method */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsMethod(code))
            return IDocommentDomain_1.CodeType.Method;
        /* namespace */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsNamespace(code))
            return IDocommentDomain_1.CodeType.Namespace;
        /* class */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsClass(code))
            return IDocommentDomain_1.CodeType.Class;
        /* interface */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsInterface(code))
            return IDocommentDomain_1.CodeType.Interface;
        /* struct */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsStruct(code))
            return IDocommentDomain_1.CodeType.Struct;
        /* enum */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsEnum(code))
            return IDocommentDomain_1.CodeType.Enum;
        /* delegate */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsDelegate(code))
            return IDocommentDomain_1.CodeType.Delegate;
        /* event */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsEvent(code))
            return IDocommentDomain_1.CodeType.Event;
        /* property */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsProperty(code))
            return IDocommentDomain_1.CodeType.Property;
        /* field */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsField(code))
            return IDocommentDomain_1.CodeType.Field;
        /* comment */
        if (SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.IsComment(code))
            return IDocommentDomain_1.CodeType.Comment;
        return IDocommentDomain_1.CodeType.None;
    }
    /* @override */
    GeneDocomment(code, codeType) {
        let paramNameList = null;
        let hasReturn = false;
        switch (codeType) {
            case IDocommentDomain_1.CodeType.Namespace:
                break;
            case IDocommentDomain_1.CodeType.Class:
                break;
            case IDocommentDomain_1.CodeType.Interface:
                break;
            case IDocommentDomain_1.CodeType.Struct:
                break;
            case IDocommentDomain_1.CodeType.Enum:
                break;
            case IDocommentDomain_1.CodeType.Delegate:
                paramNameList = SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.GetMethodParamNameList(code);
                hasReturn = SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.HasMethodReturn(code);
                break;
            case IDocommentDomain_1.CodeType.Event:
                break;
            case IDocommentDomain_1.CodeType.Method:
                paramNameList = SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.GetMethodParamNameList(code);
                hasReturn = SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.HasMethodReturn(code);
                break;
            case IDocommentDomain_1.CodeType.Field:
                break;
            case IDocommentDomain_1.CodeType.Property:
                hasReturn = SyntacticAnalysisCSharp_1.SyntacticAnalysisCSharp.HasPropertyReturn(code);
                break;
            case IDocommentDomain_1.CodeType.Comment:
                return '/// ';
            case IDocommentDomain_1.CodeType.None:
                return '';
            default:
                return '';
        }
        return this.GeneSummary(code, paramNameList, hasReturn);
    }
    /* @implements */
    WriteDocomment(code, codeType, docomment) {
        const position = this._vsCodeApi.GetActivePosition();
        if (codeType === IDocommentDomain_1.CodeType.Comment) {
            const indentBaseLine = this._vsCodeApi.ReadPreviousLineFromCurrent();
            const indent = StringUtil_1.StringUtil.GetIndent(code, indentBaseLine, this._config.insertSpaces, this._config.detectIdentation);
            const indentLen = StringUtil_1.StringUtil.GetIndentLen(indent, this._config.insertSpaces, this._config.detectIdentation);
            const insertPosition = this._vsCodeApi.GetPosition(position.line + 1, indentLen - 1);
            this._vsCodeApi.InsertText(insertPosition, docomment);
        }
        else {
            if (this._isEnterKey) {
                const active = this._vsCodeApi.GetActivePosition();
                const anchor = this._vsCodeApi.GetPosition(active.line + 1, active.character);
                const replaceSelection = this._vsCodeApi.GetSelectionByPosition(anchor, active);
                this._vsCodeApi.ReplaceText(replaceSelection, docomment);
            }
            else {
                const insertPosition = this._vsCodeApi.ShiftPositionChar(position, 1);
                this._vsCodeApi.InsertText(insertPosition, docomment);
            }
        }
    }
    /* @implements */
    MoveCursorTo(code, codeType, docomment) {
        const curPosition = this._vsCodeApi.GetActivePosition();
        const indentBaseLine = this._vsCodeApi.ReadLineAtCurrent();
        const indent = StringUtil_1.StringUtil.GetIndent(code, indentBaseLine, this._config.insertSpaces, this._config.detectIdentation);
        const indentLen = StringUtil_1.StringUtil.GetIndentLen(indent, this._config.insertSpaces, this._config.detectIdentation);
        this._vsCodeApi.MoveSelection(curPosition.line + 1, indentLen - 1 + docomment.length);
    }
    /*-------------------------------------------------------------------------
     * Private Method
     *-----------------------------------------------------------------------*/
    GeneSummary(code, paramNameList, hasReturn) {
        let docommentList = new Array();
        /* <summary> */
        docommentList.push('<summary>');
        docommentList.push('');
        docommentList.push('</summary>');
        /* <param> */
        if (paramNameList !== null) {
            paramNameList.forEach(name => {
                docommentList.push('<param name="' + name + '"></param>');
            });
        }
        /* <returns> */
        if (hasReturn) {
            docommentList.push('<returns></returns>');
        }
        // Format
        const indentBaseLine = this._vsCodeApi.ReadLineAtCurrent();
        const indent = StringUtil_1.StringUtil.GetIndent(code, indentBaseLine, this._config.insertSpaces, this._config.detectIdentation);
        let docomment = ' ' + docommentList[0] + '\n';
        for (let i = 1; i < docommentList.length; i++) {
            docomment += indent + '/// ' + docommentList[i];
            if (i !== docommentList.length - 1) {
                docomment += '\n';
            }
        }
        return docomment;
    }
}
exports.DocommentDomainCSharp = DocommentDomainCSharp;
//# sourceMappingURL=DocommentDomainCSharp.js.map