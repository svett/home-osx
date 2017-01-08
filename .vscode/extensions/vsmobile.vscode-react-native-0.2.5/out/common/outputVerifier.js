// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
/* This class transforms a spawn process to only succeed if all defined success patterns
   are found on stdout, and none of the failure patterns were found on stderr */
var OutputVerifier = (function () {
    function OutputVerifier(generatePatternsForSuccess, generatePatternToFailure) {
        this.output = "";
        this.errors = "";
        this.generatePatternsForSuccess = generatePatternsForSuccess;
        this.generatePatternToFailure = generatePatternToFailure;
    }
    OutputVerifier.prototype.process = function (spawnResult) {
        var _this = this;
        // Store all output
        this.store(spawnResult.stdout, function (new_content) {
            return _this.output += new_content;
        });
        this.store(spawnResult.stderr, function (new_content) {
            return _this.errors += new_content;
        });
        return spawnResult.outcome // Wait for the process to finish
            .then(this.generatePatternToFailure) // Generate the failure patterns to check
            .then(function (patternToFailure) {
            var failureMessage = _this.findAnyFailurePattern(patternToFailure);
            if (failureMessage) {
                return Q.reject(new Error(failureMessage)); // If at least one failure happened, we fail
            }
            else {
                return _this.generatePatternsForSuccess(); // If not we generate the success patterns
            }
        }).then(function (successPatterns) {
            if (!_this.areAllSuccessPatternsPresent(successPatterns)) {
                return Q.reject(new Error("Unknown error"));
            } // else we found all the success patterns, so we succeed
        });
    };
    OutputVerifier.prototype.store = function (stream, append) {
        stream.on("data", function (data) {
            append(data.toString());
        });
    };
    // We check the failure patterns one by one, to see if any of those appeared on the errors. If they did, we return the associated error
    OutputVerifier.prototype.findAnyFailurePattern = function (patternToFailure) {
        var errorsAndOutput = this.errors + this.output;
        var patternThatAppeared = Object.keys(patternToFailure).find(function (pattern) {
            return errorsAndOutput.indexOf(pattern) !== -1;
        });
        return patternThatAppeared ? patternToFailure[patternThatAppeared] : null;
    };
    // We check that all the patterns appeared on the output
    OutputVerifier.prototype.areAllSuccessPatternsPresent = function (successPatterns) {
        var _this = this;
        return successPatterns.every(function (pattern) {
            return _this.output.indexOf(pattern) !== -1;
        });
    };
    return OutputVerifier;
}());
exports.OutputVerifier = OutputVerifier;

//# sourceMappingURL=outputVerifier.js.map
