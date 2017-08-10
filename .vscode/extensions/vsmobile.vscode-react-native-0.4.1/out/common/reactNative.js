// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandExecutor_1 = require("./commandExecutor");
class ReactNative {
    runAndroid(projectRoot, variant) {
        let cexec = new commandExecutor_1.CommandExecutor(projectRoot);
        let args = [];
        if (variant) {
            args.push(`--variant=${variant}`);
        }
        return cexec.spawnReactCommand("run-android", args);
    }
    createProject(projectRoot, projectName) {
        throw new Error("Not yet implemented: ReactNative.createProject");
    }
}
exports.ReactNative = ReactNative;

//# sourceMappingURL=reactNative.js.map
