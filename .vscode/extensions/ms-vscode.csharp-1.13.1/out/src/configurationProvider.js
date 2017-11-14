"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const serverUtils = require("./omnisharp/utils");
const assets_1 = require("./assets");
const protocol_1 = require("./omnisharp/protocol");
const common_1 = require("./common");
const jsonc_parser_1 = require("jsonc-parser");
class CSharpConfigurationProvider {
    constructor(server) {
        this.server = server;
    }
    /**
     * TODO: Remove function when https://github.com/OmniSharp/omnisharp-roslyn/issues/909 is resolved.
     *
     * Note: serverUtils.requestWorkspaceInformation only retrieves one folder for multi-root workspaces. Therefore, generator will be incorrect for all folders
     * except the first in a workspace. Currently, this only works if the requested folder is the same as the server's solution path or folder.
     */
    checkWorkspaceInformationMatchesWorkspaceFolder(folder) {
        const solutionPathOrFolder = this.server.getSolutionPathOrFolder();
        // Make sure folder, folder.uri, and solutionPathOrFolder are defined.
        if (!folder || !folder.uri || !solutionPathOrFolder) {
            return Promise.resolve(false);
        }
        let serverFolder = solutionPathOrFolder;
        // If its a .sln file, get the folder of the solution.
        return fs.lstat(solutionPathOrFolder).then(stat => {
            return stat.isFile();
        }).then(isFile => {
            if (isFile) {
                serverFolder = path.dirname(solutionPathOrFolder);
            }
            // Get absolute paths of current folder and server folder.
            const currentFolder = path.resolve(folder.uri.fsPath);
            serverFolder = path.resolve(serverFolder);
            return currentFolder && folder.uri && common_1.isSubfolderOf(serverFolder, currentFolder);
        });
    }
    /**
     * Returns a list of initial debug configurations based on contextual information, e.g. package.json or folder.
     */
    provideDebugConfigurations(folder, token) {
        return serverUtils.requestWorkspaceInformation(this.server).then(info => {
            return this.checkWorkspaceInformationMatchesWorkspaceFolder(folder).then(workspaceMatches => {
                const generator = new assets_1.AssetGenerator(info);
                if (workspaceMatches && protocol_1.containsDotNetCoreProjects(info)) {
                    const dotVscodeFolder = path.join(folder.uri.fsPath, '.vscode');
                    const tasksJsonPath = path.join(dotVscodeFolder, 'tasks.json');
                    // Make sure .vscode folder exists, addTasksJsonIfNecessary will fail to create tasks.json if the folder does not exist. 
                    return fs.ensureDir(dotVscodeFolder).then(() => {
                        // Check to see if tasks.json exists.
                        return fs.pathExists(tasksJsonPath);
                    }).then(tasksJsonExists => {
                        // Enable addTasksJson if it does not exist.
                        return assets_1.addTasksJsonIfNecessary(generator, { addTasksJson: !tasksJsonExists });
                    }).then(() => {
                        const isWebProject = generator.hasWebServerDependency();
                        const launchJson = generator.createLaunchJson(isWebProject);
                        // jsonc-parser's parse function parses a JSON string with comments into a JSON object. However, this removes the comments. 
                        return jsonc_parser_1.parse(launchJson);
                    });
                }
                // Error to be caught in the .catch() below to write default C# configurations
                throw new Error("Does not contain .NET Core projects.");
            });
        }).catch((err) => {
            // Provider will always create an launch.json file. Providing default C# configurations.
            // jsonc-parser's parse to convert to JSON object without comments. 
            return [
                jsonc_parser_1.parse(assets_1.createLaunchConfiguration("${workspaceFolder}/bin/Debug/<insert-target-framework-here>/<insert-project-name-here>.dll", '${workspaceFolder}')),
                jsonc_parser_1.parse(assets_1.createWebLaunchConfiguration("${workspaceFolder}/bin/Debug/<insert-target-framework-here>/<insert-project-name-here>.dll", '${workspaceFolder}')),
                jsonc_parser_1.parse(assets_1.createAttachConfiguration())
            ];
        });
    }
    /**
     * Try to add all missing attributes to the debug configuration being launched.
     */
    resolveDebugConfiguration(folder, config, token) {
        // vsdbg does the error checking
        return config;
    }
}
exports.CSharpConfigurationProvider = CSharpConfigurationProvider;
//# sourceMappingURL=configurationProvider.js.map