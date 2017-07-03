"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const coreclrdebug = require("./coreclr-debug/activate");
const OmniSharp = require("./omnisharp/extension");
const util = require("./common");
const logger_1 = require("./logger");
const CSharpExtDownloader_1 = require("./CSharpExtDownloader");
const jsonContributions_1 = require("./features/json/jsonContributions");
let _channel = null;
function activate(context) {
    const extensionId = 'ms-vscode.csharp';
    const extension = vscode.extensions.getExtension(extensionId);
    const extensionVersion = extension.packageJSON.version;
    const aiKey = extension.packageJSON.contributes.debuggers[0].aiKey;
    const reporter = new vscode_extension_telemetry_1.default(extensionId, extensionVersion, aiKey);
    util.setExtensionPath(extension.extensionPath);
    _channel = vscode.window.createOutputChannel('C#');
    let logger = new logger_1.Logger(text => _channel.append(text));
    ensureRuntimeDependencies(extension, logger, reporter)
        .then((success) => {
        // activate language services
        OmniSharp.activate(context, reporter);
        // register JSON completion & hover providers for project.json
        context.subscriptions.push(jsonContributions_1.addJSONProviders());
        if (success) {
            // activate coreclr-debug
            coreclrdebug.activate(extension, context, reporter, logger, _channel);
        }
    });
}
exports.activate = activate;
function ensureRuntimeDependencies(extension, logger, reporter) {
    return util.installFileExists(util.InstallFileType.Lock)
        .then(exists => {
        if (!exists) {
            const downloader = new CSharpExtDownloader_1.CSharpExtDownloader(_channel, logger, reporter, extension.packageJSON);
            return downloader.installRuntimeDependencies();
        }
        else {
            return true;
        }
    });
}
//# sourceMappingURL=main.js.map