// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var vscode = require("vscode");
var path = require("path");
var outputChannelLogger_1 = require("./outputChannelLogger");
var errorHelper_1 = require("../common/error/errorHelper");
var internalErrorCode_1 = require("../common/error/internalErrorCode");
var fileSystem_1 = require("../common/node/fileSystem");
var entryPointHandler_1 = require("../common/entryPointHandler");
/**
 * Manages the lifecycle of the .vscode/.react folder, which hosts the temporary source/map files we need for debugging.
 * We use synchronous operations here because we want to return after the init/cleanup has been done.
 */
var ReactDirManager = (function () {
    function ReactDirManager() {
    }
    ReactDirManager.prototype.setup = function () {
        var fs = new fileSystem_1.FileSystem();
        /* if the folder exists, remove it, then recreate it */
        return fs.removePathRecursivelyAsync(ReactDirManager.ReactDirPath)
            .then(function () {
            return fs.mkDir(ReactDirManager.ReactDirPath);
        });
    };
    ReactDirManager.prototype.dispose = function () {
        new entryPointHandler_1.EntryPointHandler(entryPointHandler_1.ProcessType.Extension, new outputChannelLogger_1.OutputChannelLogger(vscode.window.createOutputChannel("React-Native"))).runFunction("extension.deleteTemporaryFolder", errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.RNTempFolderDeletionFailed, ReactDirManager.ReactDirPath), function () {
            return new fileSystem_1.FileSystem().removePathRecursivelySync(ReactDirManager.ReactDirPath);
        });
    };
    ReactDirManager.ReactDirPath = path.join(vscode.workspace.rootPath, ".vscode", ".react");
    return ReactDirManager;
}());
exports.ReactDirManager = ReactDirManager;

//# sourceMappingURL=reactDirManager.js.map
