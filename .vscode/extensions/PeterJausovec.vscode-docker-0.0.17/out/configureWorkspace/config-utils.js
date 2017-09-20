"use strict";
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
function promptForPort() {
    return __awaiter(this, void 0, void 0, function* () {
        var opt = {
            placeHolder: '3000',
            prompt: 'What port does your app listen on?',
            value: '3000'
        };
        return vscode.window.showInputBox(opt);
    });
}
exports.promptForPort = promptForPort;
function quickPickPlatform() {
    return __awaiter(this, void 0, void 0, function* () {
        var opt = {
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: 'Select Application Platform'
        };
        const items = [];
        items.push('Go');
        items.push('.NET Core');
        items.push('Node.js');
        items.push('Other');
        return vscode.window.showQuickPick(items, opt);
    });
}
exports.quickPickPlatform = quickPickPlatform;
//# sourceMappingURL=config-utils.js.map