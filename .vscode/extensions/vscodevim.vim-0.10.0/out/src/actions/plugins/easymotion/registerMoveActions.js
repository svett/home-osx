"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./../../base");
const easymotion_cmd_1 = require("./easymotion.cmd");
// EasyMotion n-char-move command
let EasyMotionNCharSearchCommand = class EasyMotionNCharSearchCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('/', new easymotion_cmd_1.SearchByNCharCommand());
    }
};
EasyMotionNCharSearchCommand = __decorate([
    base_1.RegisterAction
], EasyMotionNCharSearchCommand);
// EasyMotion char-move commands
let EasyMotionTwoCharSearchCommand = class EasyMotionTwoCharSearchCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('2s', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 2,
        }));
    }
};
EasyMotionTwoCharSearchCommand = __decorate([
    base_1.RegisterAction
], EasyMotionTwoCharSearchCommand);
let EasyMotionTwoCharFindForwardCommand = class EasyMotionTwoCharFindForwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('2f', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 2,
            searchOptions: 'min',
        }));
    }
};
EasyMotionTwoCharFindForwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionTwoCharFindForwardCommand);
let EasyMotionTwoCharFindBackwardCommand = class EasyMotionTwoCharFindBackwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('2F', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 2,
            searchOptions: 'max',
        }));
    }
};
EasyMotionTwoCharFindBackwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionTwoCharFindBackwardCommand);
let EasyMotionTwoCharTilForwardCommand = class EasyMotionTwoCharTilForwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('2t', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 2,
            searchOptions: 'min',
            labelPosition: 'before',
        }));
    }
};
EasyMotionTwoCharTilForwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionTwoCharTilForwardCommand);
let EasyMotionTwoCharTilBackwardCommand = class EasyMotionTwoCharTilBackwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('2T', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 2,
            searchOptions: 'max',
            labelPosition: 'after',
        }));
    }
};
EasyMotionTwoCharTilBackwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionTwoCharTilBackwardCommand);
let EasyMotionSearchCommand = class EasyMotionSearchCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('s', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 1,
        }));
    }
};
EasyMotionSearchCommand = __decorate([
    base_1.RegisterAction
], EasyMotionSearchCommand);
let EasyMotionFindForwardCommand = class EasyMotionFindForwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('f', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 1,
            searchOptions: 'min',
        }));
    }
};
EasyMotionFindForwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionFindForwardCommand);
let EasyMotionFindBackwardCommand = class EasyMotionFindBackwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('F', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 1,
            searchOptions: 'max',
        }));
    }
};
EasyMotionFindBackwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionFindBackwardCommand);
let EasyMotionTilForwardCommand = class EasyMotionTilForwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('t', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 1,
            searchOptions: 'min',
            labelPosition: 'before',
        }));
    }
};
EasyMotionTilForwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionTilForwardCommand);
let EasyMotionTilBackwardCommand = class EasyMotionTilBackwardCommand extends easymotion_cmd_1.EasyMotionCharMoveCommandBase {
    constructor() {
        super('T', new easymotion_cmd_1.SearchByCharCommand({
            charCount: 1,
            searchOptions: 'max',
            labelPosition: 'after',
        }));
    }
};
EasyMotionTilBackwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionTilBackwardCommand);
// EasyMotion word-move commands
let EasyMotionWordCommand = class EasyMotionWordCommand extends easymotion_cmd_1.EasyMotionWordMoveCommandBase {
    constructor() {
        super('w', {
            searchOptions: 'min',
        });
    }
};
EasyMotionWordCommand = __decorate([
    base_1.RegisterAction
], EasyMotionWordCommand);
let EasyMotionEndForwardCommand = class EasyMotionEndForwardCommand extends easymotion_cmd_1.EasyMotionWordMoveCommandBase {
    constructor() {
        super('e', {
            searchOptions: 'min',
            labelPosition: 'after',
        });
    }
};
EasyMotionEndForwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionEndForwardCommand);
let EasyMotionBeginningWordCommand = class EasyMotionBeginningWordCommand extends easymotion_cmd_1.EasyMotionWordMoveCommandBase {
    constructor() {
        super('b', {
            searchOptions: 'max',
        });
    }
};
EasyMotionBeginningWordCommand = __decorate([
    base_1.RegisterAction
], EasyMotionBeginningWordCommand);
let EasyMotionEndBackwardCommand = class EasyMotionEndBackwardCommand extends easymotion_cmd_1.EasyMotionWordMoveCommandBase {
    constructor() {
        super('ge', {
            searchOptions: 'max',
            labelPosition: 'after',
        });
    }
};
EasyMotionEndBackwardCommand = __decorate([
    base_1.RegisterAction
], EasyMotionEndBackwardCommand);
// EasyMotion line-move commands
let EasyMotionDownLinesCommand = class EasyMotionDownLinesCommand extends easymotion_cmd_1.EasyMotionLineMoveCommandBase {
    constructor() {
        super('j', {
            searchOptions: 'min',
        });
    }
};
EasyMotionDownLinesCommand = __decorate([
    base_1.RegisterAction
], EasyMotionDownLinesCommand);
let EasyMotionUpLinesCommand = class EasyMotionUpLinesCommand extends easymotion_cmd_1.EasyMotionLineMoveCommandBase {
    constructor() {
        super('k', {
            searchOptions: 'max',
        });
    }
};
EasyMotionUpLinesCommand = __decorate([
    base_1.RegisterAction
], EasyMotionUpLinesCommand);
//# sourceMappingURL=registerMoveActions.js.map