// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
/* This class can be used to limit how often can some code be executed e.g. Max once every 10 seconds */
var ExecutionsLimiter = (function () {
    function ExecutionsLimiter() {
        this.executionToLastTimestamp = {};
    }
    ExecutionsLimiter.prototype.execute = function (id, limitInSeconds, lambda) {
        var now = new Date().getTime();
        var lastExecution = this.executionToLastTimestamp[id] || 0;
        if (now - lastExecution >= limitInSeconds * 1000) {
            this.executionToLastTimestamp[id] = now;
            lambda();
        }
    };
    return ExecutionsLimiter;
}());
exports.ExecutionsLimiter = ExecutionsLimiter;
var ExecutionsFilterBeforeTimestamp = (function () {
    function ExecutionsFilterBeforeTimestamp(delayInSeconds) {
        this.sinceWhenToStopFiltering = this.now() + delayInSeconds * ExecutionsFilterBeforeTimestamp.MILLISECONDS_IN_ONE_SECOND;
    }
    ExecutionsFilterBeforeTimestamp.prototype.execute = function (lambda) {
        if (this.now() >= this.sinceWhenToStopFiltering) {
            lambda();
        }
    };
    ExecutionsFilterBeforeTimestamp.prototype.now = function () {
        return new Date().getTime();
    };
    ExecutionsFilterBeforeTimestamp.MILLISECONDS_IN_ONE_SECOND = 1000;
    return ExecutionsFilterBeforeTimestamp;
}());
exports.ExecutionsFilterBeforeTimestamp = ExecutionsFilterBeforeTimestamp;

//# sourceMappingURL=executionsLimiter.js.map
