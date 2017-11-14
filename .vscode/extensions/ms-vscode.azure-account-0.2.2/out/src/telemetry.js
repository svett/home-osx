"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
function createReporter(context) {
    const extensionPackage = require(context.asAbsolutePath('./package.json'));
    const reporter = new vscode_extension_telemetry_1.default(extensionPackage.name, extensionPackage.version, extensionPackage.aiKey);
    context.subscriptions.push(reporter);
    return reporter;
}
exports.createReporter = createReporter;
//# sourceMappingURL=telemetry.js.map