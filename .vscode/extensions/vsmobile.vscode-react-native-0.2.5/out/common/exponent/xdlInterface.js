// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var commandExecutor_1 = require("../commandExecutor");
var hostPlatform_1 = require("../hostPlatform");
var log_1 = require("../log/log");
var path = require("path");
var Q = require("q");
var XDL_VERSION = "0.20.0";
var xdlPackage;
function getPackage() {
    if (xdlPackage) {
        return xdlPackage;
    }
    // Don't do the require if we don't actually need it
    try {
        log_1.Log.logMessage("Getting exponent dependecy.", false);
        var xdl_1 = require("xdl");
        xdlPackage = Q(xdl_1);
        return xdlPackage;
    }
    catch (e) {
        if (e.code === "MODULE_NOT_FOUND") {
            log_1.Log.logMessage("Dependency not present. Installing it...", false);
        }
        else {
            throw e;
        }
    }
    var commandExecutor = new commandExecutor_1.CommandExecutor();
    xdlPackage = commandExecutor.spawnWithProgress(hostPlatform_1.HostPlatform.getNpmCliCommand("npm"), ["install", ("xdl@" + XDL_VERSION), "--verbose"], { verbosity: commandExecutor_1.CommandVerbosity.PROGRESS,
        cwd: path.dirname(require.resolve("../../../")) })
        .then(function () {
        return require("xdl");
    });
    return xdlPackage;
}
function configReactNativeVersionWargnings() {
    return getPackage()
        .then(function (xdl) {
        xdl.Config.validation.reactNativeVersionWarnings = false;
    });
}
exports.configReactNativeVersionWargnings = configReactNativeVersionWargnings;
function attachLoggerStream(rootPath, options) {
    return getPackage()
        .then(function (xdl) {
        return xdl.ProjectUtils.attachLoggerStream(rootPath, options);
    });
}
exports.attachLoggerStream = attachLoggerStream;
function supportedVersions() {
    return getPackage()
        .then(function (xdl) {
        return xdl.Versions.facebookReactNativeVersionsAsync();
    });
}
exports.supportedVersions = supportedVersions;
function currentUser() {
    return getPackage()
        .then(function (xdl) {
        return xdl.User.getCurrentUserAsync();
    });
}
exports.currentUser = currentUser;
function login(username, password) {
    return getPackage()
        .then(function (xdl) {
        return xdl.User.loginAsync({ username: username, password: password });
    });
}
exports.login = login;
function mapVersion(reactNativeVersion) {
    return getPackage()
        .then(function (xdl) {
        return xdl.Versions.facebookReactNativeVersionToExponentVersionAsync(reactNativeVersion);
    });
}
exports.mapVersion = mapVersion;
function publish(projectRoot, options) {
    return getPackage()
        .then(function (xdl) {
        return xdl.Project.publishAsync(projectRoot, options);
    });
}
exports.publish = publish;
function setOptions(projectRoot, options) {
    return getPackage()
        .then(function (xdl) {
        return xdl.Project.setOptionsAsync(projectRoot, options);
    });
}
exports.setOptions = setOptions;
function startExponentServer(projectRoot) {
    return getPackage()
        .then(function (xdl) {
        return xdl.Project.startExponentServerAsync(projectRoot);
    });
}
exports.startExponentServer = startExponentServer;
function startTunnels(projectRoot) {
    return getPackage()
        .then(function (xdl) {
        return xdl.Project.startTunnelsAsync(projectRoot);
    });
}
exports.startTunnels = startTunnels;
function getUrl(projectRoot, options) {
    return getPackage()
        .then(function (xdl) {
        return xdl.Project.getUrlAsync(projectRoot, options);
    });
}
exports.getUrl = getUrl;
function stopAll(projectRoot) {
    return getPackage()
        .then(function (xdl) {
        return xdl.Project.stopAsync(projectRoot);
    });
}
exports.stopAll = stopAll;

//# sourceMappingURL=xdlInterface.js.map
