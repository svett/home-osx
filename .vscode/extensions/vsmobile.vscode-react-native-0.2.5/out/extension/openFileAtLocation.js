// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var remoteExtension_1 = require("../common/remoteExtension");
var reactNativeProjectHelper_1 = require("../common/reactNativeProjectHelper");
var internalErrorCode_1 = require("../common/error/internalErrorCode");
var errorHelper_1 = require("../common/error/errorHelper");
var path = require("path");
var Q = require("q");
/* Usage:
...path\openFileAtLocation.js filename:lineNumber
...path\openFileAtLocation.js filename
...path\openFileAtLocation.js workspace filename:lineNumber
...path\openFileAtLocation.js workspace filename
*/
{
    if (process.argv.length < 3) {
        throw "Wrong number of parameters provided. Please refer to the usage of this script for proper use.";
    }
    var fullpath = void 0;
    var workspace = void 0;
    if (process.argv.length === 3) {
        fullpath = process.argv[2];
        workspace = null;
    }
    else {
        fullpath = process.argv[3];
        workspace = process.argv[2];
    }
    var dirname = path.normalize(path.dirname(fullpath));
    // In Windows this should make sure c:\ is always lowercase and in
    // Unix '/'.toLowerCase() = '/'
    var normalizedDirname = dirname.toLowerCase();
    var filenameAndNumber = path.basename(fullpath);
    var fileInfo = filenameAndNumber.split(":");
    var filename_1 = path.join(normalizedDirname, fileInfo[0]);
    var lineNumber_1 = 1;
    if (fileInfo.length >= 2) {
        lineNumber_1 = parseInt(fileInfo[1], 10);
    }
    getReactNativeWorkspaceForFile(filename_1, workspace).then(function (projectRootPath) {
        var remoteExtension = remoteExtension_1.RemoteExtension.atProjectRootPath(projectRootPath);
        return remoteExtension.openFileAtLocation(filename_1, lineNumber_1);
    }).done(function () { }, function (reason) {
        throw errorHelper_1.ErrorHelper.getNestedError(reason, internalErrorCode_1.InternalErrorCode.CommandFailed, "Unable to communicate with VSCode. Please make sure it is open in the appropriate workspace.");
    });
}
function getReactNativeWorkspaceForFile(file, workspace) {
    if (workspace) {
        return Q(workspace);
    }
    return getPathForRNParentWorkspace(path.dirname(file))
        .catch(function (reason) {
        return Q.reject(errorHelper_1.ErrorHelper.getNestedError(reason, internalErrorCode_1.InternalErrorCode.WorkspaceNotFound, "Error while looking at workspace for file: " + file + "."));
    });
}
function getPathForRNParentWorkspace(dir) {
    var reactNativeProjectHelper = new reactNativeProjectHelper_1.ReactNativeProjectHelper(dir);
    return reactNativeProjectHelper.isReactNativeProject().then(function (isRNProject) {
        if (isRNProject) {
            return dir;
        }
        if (dir === "" || dir === "." || dir === "/" || dir === path.dirname(dir)) {
            return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.WorkspaceNotFound, "React Native project workspace not found."));
        }
        return getPathForRNParentWorkspace(path.dirname(dir));
    });
}

//# sourceMappingURL=openFileAtLocation.js.map
