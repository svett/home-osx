// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Q = require("q");
var telemetry_1 = require("./telemetry");
var TelemetryGeneratorBase = (function () {
    function TelemetryGeneratorBase(componentName) {
        this.telemetryProperties = {};
        this.currentStep = "initialStep";
        this.errorIndex = -1; // In case we have more than one error (We start at -1 because we increment it before using it)
        this.componentName = componentName;
        this.currentStepStartTime = process.hrtime();
    }
    TelemetryGeneratorBase.prototype.add = function (baseName, value, isPii) {
        return this.addWithPiiEvaluator(baseName, value, function () { return isPii; });
    };
    TelemetryGeneratorBase.prototype.addWithPiiEvaluator = function (baseName, value, piiEvaluator) {
        // We have 3 cases:
        //     * Object is an array, we add each element as baseNameNNN
        //     * Object is a hash, we add each element as baseName.KEY
        //     * Object is a value, we add the element as baseName
        try {
            if (Array.isArray(value)) {
                this.addArray(baseName, value, piiEvaluator);
            }
            else if (!!value && (typeof value === "object" || typeof value === "function")) {
                this.addHash(baseName, value, piiEvaluator);
            }
            else {
                this.addString(baseName, String(value), piiEvaluator);
            }
        }
        catch (error) {
            // We don"t want to crash the functionality if the telemetry fails.
            // This error message will be a javascript error message, so it"s not pii
            this.addString("telemetryGenerationError." + baseName, String(error), function () { return false; });
        }
        return this;
    };
    TelemetryGeneratorBase.prototype.addError = function (error) {
        this.add("error.message" + ++this.errorIndex, error.message, /*isPii*/ true);
        var errorWithErrorCode = error;
        if (errorWithErrorCode.errorCode) {
            this.add("error.code" + this.errorIndex, errorWithErrorCode.errorCode, /*isPii*/ false);
        }
        return this;
    };
    TelemetryGeneratorBase.prototype.time = function (name, codeToMeasure) {
        var _this = this;
        var startTime = process.hrtime();
        return Q(codeToMeasure())
            .finally(function () { return _this.finishTime(name, startTime); })
            .fail(function (reason) {
            _this.addError(reason);
            return Q.reject(reason);
        });
    };
    TelemetryGeneratorBase.prototype.step = function (name) {
        // First we finish measuring this step time, and we send a telemetry event for this step
        this.finishTime(this.currentStep, this.currentStepStartTime);
        this.sendCurrentStep();
        // Then we prepare to start gathering information about the next step
        this.currentStep = name;
        this.telemetryProperties = {};
        this.currentStepStartTime = process.hrtime();
        return this;
    };
    TelemetryGeneratorBase.prototype.send = function () {
        if (this.currentStep) {
            this.add("lastStepExecuted", this.currentStep, /*isPii*/ false);
        }
        this.step(null); // Send the last step
    };
    TelemetryGeneratorBase.prototype.sendCurrentStep = function () {
        this.add("step", this.currentStep, /*isPii*/ false);
        var telemetryEvent = new telemetry_1.Telemetry.TelemetryEvent(this.componentName);
        TelemetryHelper.addTelemetryEventProperties(telemetryEvent, this.telemetryProperties);
        this.sendTelemetryEvent(telemetryEvent);
    };
    TelemetryGeneratorBase.prototype.addArray = function (baseName, array, piiEvaluator) {
        var _this = this;
        // Object is an array, we add each element as baseNameNNN
        var elementIndex = 1; // We send telemetry properties in a one-based index
        array.forEach(function (element) { return _this.addWithPiiEvaluator(baseName + elementIndex++, element, piiEvaluator); });
    };
    TelemetryGeneratorBase.prototype.addHash = function (baseName, hash, piiEvaluator) {
        var _this = this;
        // Object is a hash, we add each element as baseName.KEY
        Object.keys(hash).forEach(function (key) { return _this.addWithPiiEvaluator(baseName + "." + key, hash[key], piiEvaluator); });
    };
    TelemetryGeneratorBase.prototype.addString = function (name, value, piiEvaluator) {
        this.telemetryProperties[name] = TelemetryHelper.telemetryProperty(value, piiEvaluator(value, name));
    };
    TelemetryGeneratorBase.prototype.combine = function () {
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i - 0] = arguments[_i];
        }
        var nonNullComponents = components.filter(function (component) { return component !== null; });
        return nonNullComponents.join(".");
    };
    TelemetryGeneratorBase.prototype.finishTime = function (name, startTime) {
        var endTime = process.hrtime(startTime);
        this.add(this.combine(name, "time"), String(endTime[0] * 1000 + endTime[1] / 1000000), /*isPii*/ false);
    };
    return TelemetryGeneratorBase;
}());
exports.TelemetryGeneratorBase = TelemetryGeneratorBase;
var TelemetryGenerator = (function (_super) {
    __extends(TelemetryGenerator, _super);
    function TelemetryGenerator() {
        _super.apply(this, arguments);
    }
    TelemetryGenerator.prototype.sendTelemetryEvent = function (telemetryEvent) {
        telemetry_1.Telemetry.send(telemetryEvent);
    };
    return TelemetryGenerator;
}(TelemetryGeneratorBase));
exports.TelemetryGenerator = TelemetryGenerator;
var TelemetryHelper = (function () {
    function TelemetryHelper() {
    }
    TelemetryHelper.sendSimpleEvent = function (eventName, properties) {
        var event = TelemetryHelper.createTelemetryEvent(eventName, properties);
        telemetry_1.Telemetry.send(event);
    };
    TelemetryHelper.createTelemetryEvent = function (eventName, properties) {
        return new telemetry_1.Telemetry.TelemetryEvent(eventName, properties);
    };
    TelemetryHelper.telemetryProperty = function (propertyValue, pii) {
        return { value: String(propertyValue), isPii: pii || false };
    };
    TelemetryHelper.addTelemetryEventProperties = function (event, properties) {
        if (!properties) {
            return;
        }
        Object.keys(properties).forEach(function (propertyName) {
            TelemetryHelper.addTelemetryEventProperty(event, propertyName, properties[propertyName].value, properties[propertyName].isPii);
        });
    };
    TelemetryHelper.sendCommandSuccessTelemetry = function (commandName, commandProperties, args) {
        if (args === void 0) { args = null; }
        var successEvent = TelemetryHelper.createBasicCommandTelemetry(commandName, args);
        TelemetryHelper.addTelemetryEventProperties(successEvent, commandProperties);
        telemetry_1.Telemetry.send(successEvent);
    };
    TelemetryHelper.addTelemetryEventProperty = function (event, propertyName, propertyValue, isPii) {
        if (Array.isArray(propertyValue)) {
            TelemetryHelper.addMultiValuedTelemetryEventProperty(event, propertyName, propertyValue, isPii);
        }
        else {
            TelemetryHelper.setTelemetryEventProperty(event, propertyName, propertyValue, isPii);
        }
    };
    TelemetryHelper.addPropertiesFromOptions = function (telemetryProperties, knownOptions, commandOptions, nonPiiOptions) {
        var _this = this;
        if (nonPiiOptions === void 0) { nonPiiOptions = []; }
        // We parse only the known options, to avoid potential private information that may appear on the command line
        var unknownOptionIndex = 1;
        Object.keys(commandOptions).forEach(function (key) {
            var value = commandOptions[key];
            if (Object.keys(knownOptions).indexOf(key) >= 0) {
                // This is a known option. We"ll check the list to decide if it"s pii or not
                if (typeof (value) !== "undefined") {
                    // We encrypt all options values unless they are specifically marked as nonPii
                    telemetryProperties["options." + key] = _this.telemetryProperty(value, nonPiiOptions.indexOf(key) < 0);
                }
            }
            else {
                // This is a not known option. We"ll assume that both the option and the value are pii
                telemetryProperties["unknownOption" + unknownOptionIndex + ".name"] = _this.telemetryProperty(key, /*isPii*/ true);
                telemetryProperties["unknownOption" + unknownOptionIndex++ + ".value"] = _this.telemetryProperty(value, /*isPii*/ true);
            }
        });
        return telemetryProperties;
    };
    TelemetryHelper.generate = function (name, codeGeneratingTelemetry) {
        var generator = new TelemetryGenerator(name);
        return generator.time(null, function () { return codeGeneratingTelemetry(generator); }).finally(function () { return generator.send(); });
    };
    TelemetryHelper.createBasicCommandTelemetry = function (commandName, args) {
        if (args === void 0) { args = null; }
        var commandEvent = new telemetry_1.Telemetry.TelemetryEvent(commandName || "command");
        if (!commandName && args && args.length > 0) {
            commandEvent.setPiiProperty("command", args[0]);
        }
        if (args) {
            TelemetryHelper.addTelemetryEventProperty(commandEvent, "argument", args, true);
        }
        return commandEvent;
    };
    TelemetryHelper.setTelemetryEventProperty = function (event, propertyName, propertyValue, isPii) {
        if (isPii) {
            event.setPiiProperty(propertyName, String(propertyValue));
        }
        else {
            event.properties[propertyName] = String(propertyValue);
        }
    };
    TelemetryHelper.addMultiValuedTelemetryEventProperty = function (event, propertyName, propertyValue, isPii) {
        for (var i = 0; i < propertyValue.length; i++) {
            TelemetryHelper.setTelemetryEventProperty(event, propertyName + i, propertyValue[i], isPii);
        }
    };
    return TelemetryHelper;
}());
exports.TelemetryHelper = TelemetryHelper;
;

//# sourceMappingURL=telemetryHelper.js.map
