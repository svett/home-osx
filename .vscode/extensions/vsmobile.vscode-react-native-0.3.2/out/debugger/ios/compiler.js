// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const commandExecutor_1 = require("../../common/commandExecutor");
const xcodeproj_1 = require("../../common/ios/xcodeproj");
class Compiler {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    compile() {
        return this.xcodeBuildArguments().then((xcodeArguments) => {
            return new commandExecutor_1.CommandExecutor(this.projectRoot).spawn("xcodebuild", xcodeArguments);
        });
    }
    /*
        Return the appropriate arguments for compiling a react native project
    */
    xcodeBuildArguments() {
        return new xcodeproj_1.Xcodeproj().findXcodeprojFile(this.projectRoot).then((projectFile) => {
            return [
                projectFile.fileType === ".xcworkspace" ? "-workspace" : "-project", projectFile.fileName,
                "-scheme", projectFile.projectName,
                "-destination", "generic/platform=iOS",
                "-derivedDataPath", path.join(this.projectRoot, "build"),
            ];
        });
    }
}
exports.Compiler = Compiler;

//# sourceMappingURL=compiler.js.map
