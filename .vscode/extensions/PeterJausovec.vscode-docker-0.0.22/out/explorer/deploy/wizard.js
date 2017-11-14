"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
class WizardBase {
    constructor(output) {
        this.output = output;
        this._steps = [];
    }
    run(promptOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // Go through the prompts...
            for (var i = 0; i < this.steps.length; i++) {
                const step = this.steps[i];
                try {
                    yield this.steps[i].prompt();
                }
                catch (err) {
                    if (err instanceof UserCancelledError) {
                        return {
                            status: 'Cancelled',
                            step: step,
                            error: err
                        };
                    }
                    return {
                        status: 'Faulted',
                        step: step,
                        error: err
                    };
                }
            }
            if (promptOnly) {
                return {
                    status: 'PromptCompleted',
                    step: this.steps[this.steps.length - 1],
                    error: null
                };
            }
            return this.execute();
        });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            // Execute each step...
            this.output.show(true);
            for (var i = 0; i < this.steps.length; i++) {
                const step = this.steps[i];
                try {
                    this.beforeExecute(step, i);
                    yield this.steps[i].execute();
                }
                catch (err) {
                    this.onExecuteError(step, i, err);
                    if (err instanceof UserCancelledError) {
                        this._result = {
                            status: 'Cancelled',
                            step: step,
                            error: err
                        };
                    }
                    else {
                        this._result = {
                            status: 'Faulted',
                            step: step,
                            error: err
                        };
                    }
                    return this._result;
                }
            }
            this._result = {
                status: 'Completed',
                step: this.steps[this.steps.length - 1],
                error: null
            };
            return this._result;
        });
    }
    get steps() {
        return this._steps;
    }
    findStep(predicate, errorMessage) {
        const step = this.steps.find(predicate);
        if (!step) {
            throw new Error(errorMessage);
        }
        return step;
    }
    write(text) {
        this.output.append(text);
    }
    writeline(text) {
        this.output.appendLine(text);
    }
    beforeExecute(step, stepIndex) { }
    onExecuteError(step, stepIndex, error) { }
}
exports.WizardBase = WizardBase;
class WizardStep {
    constructor(wizard, stepTitle) {
        this.wizard = wizard;
        this.stepTitle = stepTitle;
    }
    prompt() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    get stepIndex() {
        return this.wizard.steps.findIndex(step => step === this);
    }
    get stepProgressText() {
        return `Step ${this.stepIndex + 1}/${this.wizard.steps.length}`;
    }
    showQuickPick(items, options, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showQuickPick(items, options, token);
            if (!result) {
                throw new UserCancelledError();
            }
            return result;
        });
    }
    showInputBox(options, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showInputBox(options, token);
            if (!result) {
                throw new UserCancelledError();
            }
            return result;
        });
    }
}
exports.WizardStep = WizardStep;
class SubscriptionStepBase extends WizardStep {
    constructor(wizard, title, azureAccount, _subscription) {
        super(wizard, title);
        this.azureAccount = azureAccount;
        this._subscription = _subscription;
    }
    getSubscriptionsAsQuickPickItems() {
        return __awaiter(this, void 0, void 0, function* () {
            const quickPickItems = [];
            yield Promise.all([this.azureAccount.getFilteredSubscriptions(), this.azureAccount.getAllSubscriptions()]).then(results => {
                const inFilterSubscriptions = results[0];
                const otherSubscriptions = results[1];
                inFilterSubscriptions.forEach(s => {
                    const index = otherSubscriptions.findIndex(other => other.subscriptionId === s.subscriptionId);
                    if (index >= 0) {
                        otherSubscriptions.splice(index, 1);
                    }
                    const item = {
                        label: `${s.displayName}`,
                        description: '',
                        detail: s.subscriptionId,
                        data: s
                    };
                    quickPickItems.push(item);
                });
            });
            return quickPickItems;
        });
    }
    get subscription() {
        return this._subscription;
    }
}
exports.SubscriptionStepBase = SubscriptionStepBase;
class UserCancelledError extends Error {
}
exports.UserCancelledError = UserCancelledError;
//# sourceMappingURL=wizard.js.map