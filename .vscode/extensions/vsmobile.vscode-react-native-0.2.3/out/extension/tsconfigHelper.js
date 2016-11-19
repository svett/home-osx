// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var vscode = require("vscode");
var path = require("path");
var fileSystem_1 = require("../common/node/fileSystem");
var TsConfigHelper = (function () {
    function TsConfigHelper() {
    }
    Object.defineProperty(TsConfigHelper, "tsConfigPath", {
        get: function () {
            return path.join(vscode.workspace.rootPath, "tsconfig.json");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Constructs a JSON object from tsconfig.json. Will create the file if needed.
     */
    TsConfigHelper.createTsConfigIfNotPresent = function () {
        var tsConfigPath = TsConfigHelper.tsConfigPath;
        var fileSystem = new fileSystem_1.FileSystem();
        return fileSystem.exists(tsConfigPath)
            .then(function (exists) {
            if (!exists) {
                var defaultTsConfig = {
                    compilerOptions: {
                        allowJs: true,
                        allowSyntheticDefaultImports: true,
                    },
                    exclude: ["node_modules"],
                };
                return fileSystem.writeFile(tsConfigPath, JSON.stringify(defaultTsConfig, null, 4));
            }
        });
    };
    return TsConfigHelper;
}());
exports.TsConfigHelper = TsConfigHelper;

//# sourceMappingURL=tsconfigHelper.js.map
