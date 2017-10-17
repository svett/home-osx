"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SyntacticAnalysisCSharp {
    /*-------------------------------------------------------------------------
     * Public Method: Comment Type
     *-----------------------------------------------------------------------*/
    static IsEnterKey(activeChar, text) {
        return (activeChar === '') && (text.startsWith('\n') || text.startsWith("\r\n"));
    }
    static IsSlashKey(activeChar) {
        return (activeChar === '/');
    }
    /**
     * Tests whether a line contains ONLY a doc comment and nothing else except whitespace.
     * @param activeLine The line to test.
     */
    static IsDocCommentStrict(activeLine) {
        return activeLine.match(/^[ \t]*\/{3}[ \t]*$/) !== null; // FIXME:
    }
    static IsDocComment(activeLine) {
        return activeLine.match(/\/{3}/) !== null;
    }
    static IsDoubleDocComment(activeLine) {
        return activeLine.match(/^[ \t]*\/{3} $/) !== null;
    }
    /*-------------------------------------------------------------------------
     * Public Method: Code
     *-----------------------------------------------------------------------*/
    static IsAttribute(code) {
        if (code === null)
            return false;
        return code.match(/^\[.+\]$/) !== null;
    }
    /*-------------------------------------------------------------------------
     * Public Method: Code Type
     *-----------------------------------------------------------------------*/
    static IsNamespace(code) {
        if (code === null)
            return false;
        return code.match(/\bnamespace\b/) !== null;
    }
    static IsClass(code) {
        if (code === null)
            return false;
        return code.match(/\bclass\b/) !== null;
    }
    static IsInterface(code) {
        if (code === null)
            return false;
        return code.match(/\binterface\b/) !== null;
    }
    static IsStruct(code) {
        if (code === null)
            return false;
        return code.match(/\bstruct\b/) !== null;
    }
    static IsEnum(code) {
        if (code === null)
            return false;
        return code.match(/\benum\b/) !== null;
    }
    static IsDelegate(code) {
        if (code === null)
            return false;
        return code.match(/\bdelegate\b/) !== null;
    }
    static IsEvent(code) {
        if (code === null)
            return false;
        return code.match(/\bevent\b/) !== null;
    }
    static IsProperty(code) {
        if (code === null)
            return false;
        return code.match(/[\w\S]+[^)]?\b\s*{/) !== null;
    }
    static IsField(code) {
        if (code === null)
            return false;
        return code.match(/[^()]+;[ \t]*$/) !== null;
    }
    static IsMethod(code) {
        if (code === null)
            return false;
        return code.match(/[\w\S]\s+[\w\S]+\s*\(.*\)/) !== null;
    }
    static IsComment(code) {
        if (code === null)
            return false;
        if (code === '')
            return true;
        return code.match(/[ \t]+/) !== null;
    }
    static GetMethodParamNameList(code) {
        if (code === null)
            return null;
        const removedAttrCode = code.replace(/^\s*\[.+?\]/, ''); // FIXME:
        const params = removedAttrCode.match(/[\w\S]\s+[\w\S]+\s*\(([^)]*)\)/);
        const isMatched = (params === null || params.length !== 2);
        if (isMatched)
            return null;
        let paramName = new Array();
        params[1].split(',').forEach(param => {
            const hasOptionalParam = param.match(/\S+\s+\S+\s*=/) !== null;
            const hasTypeInfo = param.match(/[\w\W]+\s+[\w\W]+/) !== null;
            let name = null;
            if (hasOptionalParam) {
                name = param.match(/\S+\s+(\S+)\s*=.*/);
            }
            else if (!hasTypeInfo) {
                name = null; // SKIP
            }
            else {
                name = param.match(/(\S+)\s*$/);
            }
            if (name !== null && name.length === 2) {
                paramName.push(name[1]);
            }
        });
        return paramName;
    }
    static HasMethodReturn(code) {
        if (code === null) {
            return false;
        }
        {
            const returns = code.match(/([\w\S]+)\s+[\w\S]+\s*\(.*\)/);
            const isMatched = (returns !== null && returns.length === 2);
            if (isMatched) {
                const isReserved = (returns[1].match(this.RESERVED_WORDS) !== null);
                if (!isReserved) {
                    return true;
                }
            }
        }
        {
            const returns = code.match(/([\w\S]+)\s+[\w\S]+\s+[\w\S]+\s*\(.*\)/);
            const isMatched = (returns !== null && returns.length === 2);
            if (isMatched) {
                const isReserved = (returns[1].match(this.RESERVED_WORDS) !== null);
                if (!isReserved) {
                    return true;
                }
            }
        }
        return false;
    }
    static HasPropertyReturn(code) {
        if (code === null)
            return false;
        const returns = code.match(/([\w\S]+)\s+[\w\S]+\s*\{/);
        const isMatched = (returns === null || returns.length !== 2);
        if (isMatched)
            return false;
        return (returns[1].match(this.RESERVED_WORDS) === null) ? true : false;
    }
}
/*-------------------------------------------------------------------------
 * Field
 *-----------------------------------------------------------------------*/
SyntacticAnalysisCSharp.RESERVED_WORDS = /(void|event|delegate|internal|public|protected|private|static|const|new|sealed|abstract|virtual|override|extern|unsafe|readonly|volatile|implicit|explicit|operator)/;
exports.SyntacticAnalysisCSharp = SyntacticAnalysisCSharp;
//# sourceMappingURL=SyntacticAnalysisCSharp.js.map