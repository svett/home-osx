// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var path = require("path");
var commandExecutor_1 = require("../../common/commandExecutor");
var xcodeproj_1 = require("../../common/ios/xcodeproj");
var Compiler = (function () {
    function Compiler(projectRoot) {
        this.projectRoot = projectRoot;
    }
    Compiler.prototype.compile = function () {
        var _this = this;
        return this.xcodeBuildArguments().then(function (xcodeArguments) {
            return new commandExecutor_1.CommandExecutor(_this.projectRoot).spawn("xcodebuild", xcodeArguments);
        });
    };
    /*
        Return the appropriate arguments for compiling a react native project
    */
    Compiler.prototype.xcodeBuildArguments = function () {
        var _this = this;
        return new xcodeproj_1.Xcodeproj().findXcodeprojFile(this.projectRoot).then(function (projectFile) {
            return [
                projectFile.fileType === ".xcworkspace" ? "-workspace" : "-project", projectFile.fileName,
                "-scheme", projectFile.projectName,
                "-destination", "generic/platform=iOS",
                "-derivedDataPath", path.join(_this.projectRoot, "build"),
            ];
        });
    };
    return Compiler;
}());
exports.Compiler = Compiler;

//# sourceMappingURL=compiler.js.map
