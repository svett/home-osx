/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const ImmedateDelayMax = 25;
const NearImmediateDelayMax = 50;
const ShortDelayMax = 250;
const MediumDelayMax = 500;
const IdleDelayMax = 1500;
const NonFocusDelayMax = 3000;
class DelayTracker {
    constructor(name) {
        this._immediateDelays = 0; // 0-25 milliseconds
        this._nearImmediateDelays = 0; // 26-50 milliseconds
        this._shortDelays = 0; // 51-250 milliseconds
        this._mediumDelays = 0; // 251-500 milliseconds
        this._idleDelays = 0; // 501-1500 milliseconds
        this._nonFocusDelays = 0; // 1501-3000 milliseconds
        this._bigDelays = 0; // 3000+ milliseconds
        this._name = name;
    }
    reportDelay(elapsedTime) {
        if (elapsedTime <= ImmedateDelayMax) {
            this._immediateDelays += 1;
        }
        else if (elapsedTime <= NearImmediateDelayMax) {
            this._nearImmediateDelays += 1;
        }
        else if (elapsedTime <= ShortDelayMax) {
            this._shortDelays += 1;
        }
        else if (elapsedTime <= MediumDelayMax) {
            this._mediumDelays += 1;
        }
        else if (elapsedTime <= IdleDelayMax) {
            this._idleDelays += 1;
        }
        else if (elapsedTime <= NonFocusDelayMax) {
            this._nonFocusDelays += 1;
        }
        else {
            this._bigDelays += 1;
        }
    }
    name() {
        return this._name;
    }
    clearMeasures() {
        this._immediateDelays = 0;
        this._nearImmediateDelays = 0;
        this._shortDelays = 0;
        this._mediumDelays = 0;
        this._idleDelays = 0;
        this._nonFocusDelays = 0;
        this._bigDelays = 0;
    }
    hasMeasures() {
        return this._immediateDelays > 0
            || this._nearImmediateDelays > 0
            || this._shortDelays > 0
            || this._mediumDelays > 0
            || this._idleDelays > 0
            || this._nonFocusDelays > 0
            || this._bigDelays > 0;
    }
    getMeasures() {
        return {
            immediateDelays: this._immediateDelays,
            nearImmediateDelays: this._nearImmediateDelays,
            shortDelays: this._shortDelays,
            mediumDelays: this._mediumDelays,
            idleDelays: this._idleDelays,
            nonFocusDelays: this._nonFocusDelays,
            bigDelays: this._bigDelays
        };
    }
}
exports.DelayTracker = DelayTracker;
//# sourceMappingURL=delayTracker.js.map