'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
let XQLint = require('xqlint').XQLint;
class XQueryCompleter {
    constructor(script) {
        this.script = script;
    }
    get script() {
        return this._script;
    }
    set script(value) {
        this._script = value;
        this._linter = new XQLint(this._script);
    }
    getCompletions(line, column) {
        let items = new Array();
        this._linter.getCompletions({ line: line, col: column }).forEach((completion) => {
            items.push(new XQueryCompletionItem(completion.name, completion.value, completion.meta));
        });
        return items;
    }
}
exports.XQueryCompleter = XQueryCompleter;
class XQueryCompletionItem {
    constructor(name, value, meta) {
        this.name = name;
        this.value = value;
        this.meta = meta;
    }
}
exports.XQueryCompletionItem = XQueryCompletionItem;
