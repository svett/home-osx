// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var remoteExtension_1 = require("../common/remoteExtension");
var ExtensionTelemetryReporter = (function () {
    function ExtensionTelemetryReporter(extensionId, extensionVersion, key, projectRootPath) {
        this.extensionId = extensionId;
        this.extensionVersion = extensionVersion;
        this.appInsightsKey = key;
        this.remoteExtension = remoteExtension_1.RemoteExtension.atProjectRootPath(projectRootPath);
    }
    ExtensionTelemetryReporter.prototype.sendTelemetryEvent = function (eventName, properties, measures) {
        this.remoteExtension.sendTelemetry(this.extensionId, this.extensionVersion, this.appInsightsKey, eventName, properties, measures)
            .catch(function () { });
    };
    return ExtensionTelemetryReporter;
}());
exports.ExtensionTelemetryReporter = ExtensionTelemetryReporter;
var NullTelemetryReporter = (function () {
    function NullTelemetryReporter() {
    }
    NullTelemetryReporter.prototype.sendTelemetryEvent = function (eventName, properties, measures) {
        // Don't do anything
    };
    return NullTelemetryReporter;
}());
exports.NullTelemetryReporter = NullTelemetryReporter;
var ReassignableTelemetryReporter = (function () {
    function ReassignableTelemetryReporter(initialReporter) {
        this.reporter = initialReporter;
    }
    ReassignableTelemetryReporter.prototype.reassignTo = function (reporter) {
        this.reporter = reporter;
    };
    ReassignableTelemetryReporter.prototype.sendTelemetryEvent = function (eventName, properties, measures) {
        this.reporter.sendTelemetryEvent(eventName, properties, measures);
    };
    return ReassignableTelemetryReporter;
}());
exports.ReassignableTelemetryReporter = ReassignableTelemetryReporter;

//# sourceMappingURL=telemetryReporters.js.map
