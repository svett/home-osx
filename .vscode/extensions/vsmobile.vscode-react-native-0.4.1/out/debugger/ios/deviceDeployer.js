// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const commandExecutor_1 = require("../../common/commandExecutor");
const xcodeproj_1 = require("../../common/ios/xcodeproj");
const errorHelper_1 = require("../../common/error/errorHelper");
const internalErrorCode_1 = require("../../common/error/internalErrorCode");
class DeviceDeployer {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    deploy() {
        return new xcodeproj_1.Xcodeproj().findXcodeprojFile(this.projectRoot).then((projectFile) => {
            const pathToCompiledApp = path.join(this.projectRoot, "build", "Build", "Products", "Debug-iphoneos", `${projectFile.projectName}.app`);
            return new commandExecutor_1.CommandExecutor(this.projectRoot)
                .spawn("ideviceinstaller", ["-i", pathToCompiledApp]).catch((err) => {
                if (err.errorCode === internalErrorCode_1.InternalErrorCode.CommandFailed && err.innerError.code === "ENOENT") {
                    throw errorHelper_1.ErrorHelper.getNestedError(err, internalErrorCode_1.InternalErrorCode.IDeviceInstallerNotFound);
                }
                throw err;
            });
        });
    }
}
exports.DeviceDeployer = DeviceDeployer;

//# sourceMappingURL=deviceDeployer.js.map
