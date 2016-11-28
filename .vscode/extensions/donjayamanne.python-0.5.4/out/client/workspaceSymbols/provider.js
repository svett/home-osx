"use strict";
const vscode = require('vscode');
const configSettings_1 = require('../common/configSettings');
const parser_1 = require('./parser');
const utils_1 = require('../common/utils');
const helpers_1 = require('../common/helpers');
const constants_1 = require('../common/constants');
const pythonSettings = configSettings_1.PythonSettings.getInstance();
class WorkspaceSymbolProvider {
    constructor(tagGenerator, outputChannel) {
        this.tagGenerator = tagGenerator;
        this.outputChannel = outputChannel;
    }
    provideWorkspaceSymbols(query, token) {
        if (!pythonSettings.workspaceSymbols.enabled) {
            return Promise.resolve([]);
        }
        return utils_1.fsExistsAsync(pythonSettings.workspaceSymbols.tagFilePath).then(exits => {
            let def = helpers_1.createDeferred();
            if (exits) {
                def.resolve();
            }
            else {
                vscode.commands.executeCommand(constants_1.Commands.Build_Workspace_Symbols, false, token).then(() => def.resolve(), reason => def.reject(reason));
            }
            return def.promise
                .then(() => parser_1.parseTags(query, token))
                .then(items => {
                if (!Array.isArray(items)) {
                    return [];
                }
                return items.map(item => new vscode.SymbolInformation(item.symbolName, item.symbolKind, '', new vscode.Location(vscode.Uri.file(item.fileName), item.position)));
            });
        });
    }
}
exports.WorkspaceSymbolProvider = WorkspaceSymbolProvider;
//# sourceMappingURL=provider.js.map