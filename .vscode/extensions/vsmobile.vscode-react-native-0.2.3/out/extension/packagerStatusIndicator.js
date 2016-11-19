// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var vscode_1 = require("vscode");
/**
 * Updates the Status bar with the status of React Native Packager.
 */
(function (PackagerStatus) {
    PackagerStatus[PackagerStatus["PACKAGER_STARTED"] = 0] = "PACKAGER_STARTED";
    PackagerStatus[PackagerStatus["EXPONENT_PACKAGER_STARTED"] = 1] = "EXPONENT_PACKAGER_STARTED";
    PackagerStatus[PackagerStatus["PACKAGER_STOPPED"] = 2] = "PACKAGER_STOPPED";
})(exports.PackagerStatus || (exports.PackagerStatus = {}));
var PackagerStatus = exports.PackagerStatus;
var PackagerStatusIndicator = (function () {
    function PackagerStatusIndicator() {
        this.packagerStatusItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
    }
    PackagerStatusIndicator.prototype.dispose = function () {
        this.packagerStatusItem.dispose();
    };
    PackagerStatusIndicator.prototype.updatePackagerStatus = function (status) {
        switch (status) {
            case PackagerStatus.PACKAGER_STARTED:
                this.packagerStatusItem.text = "$(package) " + PackagerStatusIndicator.PACKAGER_STARTED_STATUS_STR;
                break;
            case PackagerStatus.EXPONENT_PACKAGER_STARTED:
                this.packagerStatusItem.text = "$(package) " + PackagerStatusIndicator.EXPONENT_PACKAGER_STARTED_STATUS_STR;
                break;
            case PackagerStatus.PACKAGER_STOPPED:
                this.packagerStatusItem.text = "$(package) " + PackagerStatusIndicator.PACKAGER_STOPPED_STATUS_STR;
                break;
            default:
                break;
        }
        this.packagerStatusItem.show();
    };
    PackagerStatusIndicator.PACKAGER_STARTED_STATUS_STR = "React Native Packager: Started";
    PackagerStatusIndicator.EXPONENT_PACKAGER_STARTED_STATUS_STR = "Exponent Packager: Started";
    PackagerStatusIndicator.PACKAGER_STOPPED_STATUS_STR = "React Native Packager: Stopped";
    return PackagerStatusIndicator;
}());
exports.PackagerStatusIndicator = PackagerStatusIndicator;

//# sourceMappingURL=packagerStatusIndicator.js.map
