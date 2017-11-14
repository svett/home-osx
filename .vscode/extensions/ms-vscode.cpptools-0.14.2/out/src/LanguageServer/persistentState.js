'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("../common");
class PersistentState {
    constructor(key, defaultValue) {
        this.key = key;
        this.defaultvalue = defaultValue;
    }
    get Value() {
        return util.extensionContext.globalState.get(this.key, this.defaultvalue);
    }
    set Value(newValue) {
        util.extensionContext.globalState.update(this.key, newValue);
    }
}
exports.PersistentState = PersistentState;
//# sourceMappingURL=persistentState.js.map