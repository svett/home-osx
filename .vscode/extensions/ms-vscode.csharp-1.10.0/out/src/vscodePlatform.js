/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const platform_1 = require("./platform");
/*
 * extension to the PlatformInformation that calls VS Code APIs in order to obtain the runtime id
 * for distributions that the extension doesn't understand
 */
class VSCodePlatformInformation {
    static GetCurrent() {
        class VSCodeLinuxRuntimeIdFallback {
            getFallbackLinuxRuntimeId() {
                return VSCodePlatformInformation.fallbackDebuggerLinuxRuntimeId();
            }
        }
        ;
        return platform_1.PlatformInformation.GetCurrent(new VSCodeLinuxRuntimeIdFallback());
    }
    static isFallbackDebuggerLinuxRuntimeIdSet() {
        if (VSCodePlatformInformation.fallbackDebuggerLinuxRuntimeId()) {
            return true;
        }
        return false;
    }
    static fallbackDebuggerLinuxRuntimeId() {
        const config = vscode.workspace.getConfiguration('csharp');
        return config.get('fallbackDebuggerLinuxRuntimeId', '');
    }
}
exports.VSCodePlatformInformation = VSCodePlatformInformation;
;
//# sourceMappingURL=vscodePlatform.js.map