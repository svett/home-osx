// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var path = require("path");
var node_1 = require("../../common/node/node");
var xcodeproj_1 = require("./xcodeproj");
var PlistBuddy = (function () {
    function PlistBuddy(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.nodeChildProcess, nodeChildProcess = _c === void 0 ? new node_1.Node.ChildProcess() : _c, _d = _b.xcodeproj, xcodeproj = _d === void 0 ? new xcodeproj_1.Xcodeproj() : _d;
        this.nodeChildProcess = nodeChildProcess;
        this.xcodeproj = xcodeproj;
    }
    PlistBuddy.prototype.getBundleId = function (projectRoot, simulator) {
        var _this = this;
        if (simulator === void 0) { simulator = true; }
        return this.xcodeproj.findXcodeprojFile(projectRoot).then(function (projectFile) {
            var infoPlistPath = path.join(projectRoot, "build", "Build", "Products", simulator ? "Debug-iphonesimulator" : "Debug-iphoneos", projectFile.projectName + ".app", "Info.plist");
            return _this.invokePlistBuddy("Print:CFBundleIdentifier", infoPlistPath);
        });
    };
    PlistBuddy.prototype.setPlistProperty = function (plistFile, property, value) {
        var _this = this;
        // Attempt to set the value, and if it fails due to the key not existing attempt to create the key
        return this.invokePlistBuddy("Set " + property + " " + value, plistFile).fail(function () {
            return _this.invokePlistBuddy("Add " + property + " string " + value, plistFile);
        }).then(function () { });
    };
    PlistBuddy.prototype.deletePlistProperty = function (plistFile, property) {
        return this.invokePlistBuddy("Delete " + property, plistFile).then(function () { });
    };
    PlistBuddy.prototype.readPlistProperty = function (plistFile, property) {
        return this.invokePlistBuddy("Print " + property, plistFile);
    };
    PlistBuddy.prototype.invokePlistBuddy = function (command, plistFile) {
        return this.nodeChildProcess.exec(PlistBuddy.plistBuddyExecutable + " -c '" + command + "' '" + plistFile + "'").outcome.then(function (result) {
            return result.toString().trim();
        });
    };
    PlistBuddy.plistBuddyExecutable = "/usr/libexec/PlistBuddy";
    return PlistBuddy;
}());
exports.PlistBuddy = PlistBuddy;

//# sourceMappingURL=plistBuddy.js.map
