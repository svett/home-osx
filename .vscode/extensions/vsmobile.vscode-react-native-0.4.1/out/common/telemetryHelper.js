// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const telemetry_1 = require("./telemetry");
class TelemetryGeneratorBase {
    constructor(componentName) {
        this.telemetryProperties = {};
        this.currentStep = "initialStep";
        this.errorIndex = -1; // In case we have more than one error (We start at -1 because we increment it before using it)
        this.componentName = componentName;
        this.currentStepStartTime = process.hrtime();
    }
    add(baseName, value, isPii) {
        return this.addWithPiiEvaluator(baseName, value, () => isPii);
    }
    addWithPiiEvaluator(baseName, value, piiEvaluator) {
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
            this.addString("telemetryGenerationError." + baseName, String(error), () => false);
        }
        return this;
    }
    addError(error) {
        this.add("error.message" + ++this.errorIndex, error.message, /*isPii*/ true);
        let errorWithErrorCode = error;
        if (errorWithErrorCode.errorCode) {
            this.add("error.code" + this.errorIndex, errorWithErrorCode.errorCode, /*isPii*/ false);
        }
        return this;
    }
    time(name, codeToMeasure) {
        let startTime = process.hrtime();
        return Q(codeToMeasure())
            .finally(() => this.finishTime(name, startTime))
            .fail((reason) => {
            this.addError(reason);
            return Q.reject(reason);
        });
    }
    step(name) {
        // First we finish measuring this step time, and we send a telemetry event for this step
        this.finishTime(this.currentStep, this.currentStepStartTime);
        this.sendCurrentStep();
        // Then we prepare to start gathering information about the next step
        this.currentStep = name;
        this.telemetryProperties = {};
        this.currentStepStartTime = process.hrtime();
        return this;
    }
    send() {
        if (this.currentStep) {
            this.add("lastStepExecuted", this.currentStep, /*isPii*/ false);
        }
        this.step(null); // Send the last step
    }
    sendCurrentStep() {
        this.add("step", this.currentStep, /*isPii*/ false);
        let telemetryEvent = new telemetry_1.Telemetry.TelemetryEvent(this.componentName);
        TelemetryHelper.addTelemetryEventProperties(telemetryEvent, this.telemetryProperties);
        this.sendTelemetryEvent(telemetryEvent);
    }
    addArray(baseName, array, piiEvaluator) {
        // Object is an array, we add each element as baseNameNNN
        let elementIndex = 1; // We send telemetry properties in a one-based index
        array.forEach((element) => this.addWithPiiEvaluator(baseName + elementIndex++, element, piiEvaluator));
    }
    addHash(baseName, hash, piiEvaluator) {
        // Object is a hash, we add each element as baseName.KEY
        Object.keys(hash).forEach((key) => this.addWithPiiEvaluator(baseName + "." + key, hash[key], piiEvaluator));
    }
    addString(name, value, piiEvaluator) {
        this.telemetryProperties[name] = TelemetryHelper.telemetryProperty(value, piiEvaluator(value, name));
    }
    combine(...components) {
        let nonNullComponents = components.filter((component) => component !== null);
        return nonNullComponents.join(".");
    }
    finishTime(name, startTime) {
        let endTime = process.hrtime(startTime);
        this.add(this.combine(name, "time"), String(endTime[0] * 1000 + endTime[1] / 1000000), /*isPii*/ false);
    }
}
exports.TelemetryGeneratorBase = TelemetryGeneratorBase;
class TelemetryGenerator extends TelemetryGeneratorBase {
    sendTelemetryEvent(telemetryEvent) {
        telemetry_1.Telemetry.send(telemetryEvent);
    }
}
exports.TelemetryGenerator = TelemetryGenerator;
class TelemetryHelper {
    static sendSimpleEvent(eventName, properties) {
        const event = TelemetryHelper.createTelemetryEvent(eventName, properties);
        telemetry_1.Telemetry.send(event);
    }
    static createTelemetryEvent(eventName, properties) {
        return new telemetry_1.Telemetry.TelemetryEvent(eventName, properties);
    }
    static telemetryProperty(propertyValue, pii) {
        return { value: String(propertyValue), isPii: pii || false };
    }
    static addTelemetryEventProperties(event, properties) {
        if (!properties) {
            return;
        }
        Object.keys(properties).forEach(function (propertyName) {
            TelemetryHelper.addTelemetryEventProperty(event, propertyName, properties[propertyName].value, properties[propertyName].isPii);
        });
    }
    static sendCommandSuccessTelemetry(commandName, commandProperties, args = null) {
        let successEvent = TelemetryHelper.createBasicCommandTelemetry(commandName, args);
        TelemetryHelper.addTelemetryEventProperties(successEvent, commandProperties);
        telemetry_1.Telemetry.send(successEvent);
    }
    static addTelemetryEventProperty(event, propertyName, propertyValue, isPii) {
        if (Array.isArray(propertyValue)) {
            TelemetryHelper.addMultiValuedTelemetryEventProperty(event, propertyName, propertyValue, isPii);
        }
        else {
            TelemetryHelper.setTelemetryEventProperty(event, propertyName, propertyValue, isPii);
        }
    }
    static addPropertiesFromOptions(telemetryProperties, knownOptions, commandOptions, nonPiiOptions = []) {
        // We parse only the known options, to avoid potential private information that may appear on the command line
        let unknownOptionIndex = 1;
        Object.keys(commandOptions).forEach((key) => {
            let value = commandOptions[key];
            if (Object.keys(knownOptions).indexOf(key) >= 0) {
                // This is a known option. We"ll check the list to decide if it"s pii or not
                if (typeof (value) !== "undefined") {
                    // We encrypt all options values unless they are specifically marked as nonPii
                    telemetryProperties["options." + key] = this.telemetryProperty(value, nonPiiOptions.indexOf(key) < 0);
                }
            }
            else {
                // This is a not known option. We"ll assume that both the option and the value are pii
                telemetryProperties["unknownOption" + unknownOptionIndex + ".name"] = this.telemetryProperty(key, /*isPii*/ true);
                telemetryProperties["unknownOption" + unknownOptionIndex++ + ".value"] = this.telemetryProperty(value, /*isPii*/ true);
            }
        });
        return telemetryProperties;
    }
    static generate(name, codeGeneratingTelemetry) {
        let generator = new TelemetryGenerator(name);
        return generator.time(null, () => codeGeneratingTelemetry(generator)).finally(() => generator.send());
    }
    static createBasicCommandTelemetry(commandName, args = null) {
        let commandEvent = new telemetry_1.Telemetry.TelemetryEvent(commandName || "command");
        if (!commandName && args && args.length > 0) {
            commandEvent.setPiiProperty("command", args[0]);
        }
        if (args) {
            TelemetryHelper.addTelemetryEventProperty(commandEvent, "argument", args, true);
        }
        return commandEvent;
    }
    static setTelemetryEventProperty(event, propertyName, propertyValue, isPii) {
        if (isPii) {
            event.setPiiProperty(propertyName, String(propertyValue));
        }
        else {
            event.properties[propertyName] = String(propertyValue);
        }
    }
    static addMultiValuedTelemetryEventProperty(event, propertyName, propertyValue, isPii) {
        for (let i = 0; i < propertyValue.length; i++) {
            TelemetryHelper.setTelemetryEventProperty(event, propertyName + i, propertyValue[i], isPii);
        }
    }
}
exports.TelemetryHelper = TelemetryHelper;
;

//# sourceMappingURL=telemetryHelper.js.map
