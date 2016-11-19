// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var path = require("path");
var fileSystem_1 = require("../../common/node/fileSystem");
var Xcodeproj = (function () {
    function Xcodeproj(_a) {
        var _b = (_a === void 0 ? {} : _a).nodeFileSystem, nodeFileSystem = _b === void 0 ? new fileSystem_1.FileSystem() : _b;
        this.nodeFileSystem = nodeFileSystem;
    }
    Xcodeproj.prototype.findXcodeprojFile = function (projectRoot) {
        return this.nodeFileSystem
            .readDir(projectRoot)
            .then(function (files) {
            var sorted = files.sort();
            var candidate = sorted.find(function (file) {
                return [".xcodeproj", ".xcworkspace"].indexOf(path.extname(file)) !== -1;
            });
            if (!candidate) {
                throw new Error("Unable to find any xcodeproj or xcworkspace files.");
            }
            var fileName = path.join(projectRoot, candidate);
            var fileType = path.extname(candidate);
            var projectName = path.basename(candidate, fileType);
            return {
                fileName: fileName,
                fileType: fileType,
                projectName: projectName,
            };
        });
    };
    return Xcodeproj;
}());
exports.Xcodeproj = Xcodeproj;

//# sourceMappingURL=xcodeproj.js.map
