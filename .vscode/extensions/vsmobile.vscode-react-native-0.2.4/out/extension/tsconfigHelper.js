// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var Q = require("q");
var vscode = require("vscode");
var path = require("path");
var fileSystem_1 = require("../common/node/fileSystem");
var JsConfigHelper = (function () {
    function JsConfigHelper() {
    }
    Object.defineProperty(JsConfigHelper, "tsConfigPath", {
        // We're not going to create tsconfig.json - we just need this property to
        // check for existense of tsconfig.json and cancel setup if it's present
        get: function () {
            return path.join(vscode.workspace.rootPath, "tsconfig.json");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(JsConfigHelper, "jsConfigPath", {
        get: function () {
            return path.join(vscode.workspace.rootPath, "jsconfig.json");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Constructs a JSON object from jsconfig.json. Will create the file if needed.
     */
    JsConfigHelper.createJsConfigIfNotPresent = function () {
        var fileSystem = new fileSystem_1.FileSystem();
        return Q.all([fileSystem.exists(JsConfigHelper.jsConfigPath), fileSystem.exists(JsConfigHelper.tsConfigPath)])
            .spread(function (hasJsConfig, hasTsConfig) {
            if (hasJsConfig || hasTsConfig) {
                return;
            }
            return fileSystem.writeFile(JsConfigHelper.jsConfigPath, JSON.stringify(JsConfigHelper.defaultJsConfig, null, 4));
        });
    };
    JsConfigHelper.defaultJsConfig = {
        compilerOptions: {
            allowJs: true,
            allowSyntheticDefaultImports: true,
        },
        exclude: ["node_modules"],
    };
    return JsConfigHelper;
}());
exports.JsConfigHelper = JsConfigHelper;

//# sourceMappingURL=tsconfigHelper.js.map
