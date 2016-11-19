// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
/**
 * Utilities for working with promises.
 */
var PromiseUtil = (function () {
    function PromiseUtil() {
    }
    PromiseUtil.prototype.forEach = function (sourcesMaybePromise, promiseGenerator) {
        var sourcesPromise = Q(sourcesMaybePromise);
        return Q(sourcesPromise).then(function (sources) {
            return Q.all(sources.map(function (source) {
                return promiseGenerator(source);
            })).then(function () { });
        });
    };
    /**
     * Retries an operation a given number of times. For each retry, a condition is checked.
     * If the condition is not satisfied after the maximum number of retries, and error is thrown.
     * Otherwise, the result of the operation is returned once the condition is satisfied.
     *
     * @param operation - the function to execute.
     * @param condition - the condition to check between iterations.
     * @param maxRetries - the maximum number of retries.
     * @param delay - time between iterations, in milliseconds.
     * @param failure - error description.
     */
    PromiseUtil.prototype.retryAsync = function (operation, condition, maxRetries, delay, failure) {
        return this.retryAsyncIteration(operation, condition, maxRetries, 0, delay, failure);
    };
    PromiseUtil.prototype.reduce = function (sources, generateAsyncOperation) {
        var promisedSources = Q(sources);
        return promisedSources.then(function (resolvedSources) {
            return resolvedSources.reduce(function (previousReduction, newSource) {
                return previousReduction.then(function () {
                    return generateAsyncOperation(newSource);
                });
            }, Q(void 0));
        });
    };
    PromiseUtil.prototype.retryAsyncIteration = function (operation, condition, maxRetries, iteration, delay, failure) {
        var _this = this;
        return operation()
            .then(function (result) {
            return Q(result).then(condition).then((function (conditionResult) {
                if (conditionResult) {
                    return result;
                }
                if (iteration < maxRetries) {
                    return Q.delay(delay).then(function () { return _this.retryAsyncIteration(operation, condition, maxRetries, iteration + 1, delay, failure); });
                }
                throw new Error(failure);
            }));
        });
    };
    return PromiseUtil;
}());
exports.PromiseUtil = PromiseUtil;

//# sourceMappingURL=promise.js.map
