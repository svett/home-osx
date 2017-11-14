"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const protocol = require("./omnisharp/protocol");
const serverUtils = require("./omnisharp/utils");
const util = require("./common");
const vscode = require("vscode");
const json_1 = require("./json");
class AssetGenerator {
    constructor(workspaceInfo, workspaceFolder = undefined) {
        if (workspaceFolder) {
            this.workspaceFolder = workspaceFolder;
        }
        else {
            let resourcePath = undefined;
            if (!resourcePath && workspaceInfo.Cake) {
                resourcePath = workspaceInfo.Cake.Path;
            }
            if (!resourcePath && workspaceInfo.ScriptCs) {
                resourcePath = workspaceInfo.ScriptCs.Path;
            }
            if (!resourcePath && workspaceInfo.DotNet && workspaceInfo.DotNet.Projects.length > 0) {
                resourcePath = workspaceInfo.DotNet.Projects[0].Path;
            }
            if (!resourcePath && workspaceInfo.MsBuild) {
                resourcePath = workspaceInfo.MsBuild.SolutionPath;
            }
            this.workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(resourcePath));
        }
        this.vscodeFolder = path.join(this.workspaceFolder.uri.fsPath, '.vscode');
        this.tasksJsonPath = path.join(this.vscodeFolder, 'tasks.json');
        this.launchJsonPath = path.join(this.vscodeFolder, 'launch.json');
        this.initializeProjectData(workspaceInfo);
    }
    initializeProjectData(workspaceInfo) {
        // TODO: For now, assume the Debug configuration. Eventually, we'll need to revisit
        // this when we allow selecting configurations.
        const configurationName = 'Debug';
        // First, we'll check for .NET Core .csproj projects.
        if (workspaceInfo.MsBuild && workspaceInfo.MsBuild.Projects) {
            const executableMSBuildProjects = protocol.findExecutableMSBuildProjects(workspaceInfo.MsBuild.Projects);
            const targetMSBuildProject = executableMSBuildProjects.length > 0
                ? executableMSBuildProjects[0]
                : undefined;
            if (targetMSBuildProject) {
                this.hasProject = true;
                this.projectPath = path.dirname(targetMSBuildProject.Path);
                this.projectFilePath = targetMSBuildProject.Path;
                this.targetFramework = protocol.findNetCoreAppTargetFramework(targetMSBuildProject).ShortName;
                this.executableName = targetMSBuildProject.AssemblyName + ".dll";
                this.configurationName = configurationName;
                return;
            }
        }
        // Next, we'll try looking for project.json projects.
        const executableProjects = protocol.findExecutableProjectJsonProjects(workspaceInfo.DotNet.Projects, configurationName);
        // TODO: We arbitrarily pick the first executable project that we find. This will need
        // revisiting when we project a "start up project" selector.
        const targetProject = executableProjects.length > 0
            ? executableProjects[0]
            : undefined;
        if (targetProject && targetProject.Frameworks.length > 0) {
            const config = targetProject.Configurations.find(c => c.Name === configurationName);
            if (config) {
                this.hasProject = true;
                this.projectPath = targetProject.Path;
                this.projectFilePath = path.join(targetProject.Path, 'project.json');
                this.targetFramework = targetProject.Frameworks[0].ShortName;
                this.executableName = path.basename(config.CompilationOutputAssemblyFile);
                this.configurationName = configurationName;
            }
        }
        return undefined;
    }
    hasWebServerDependency() {
        // TODO: Update to handle .NET Core projects.
        if (!this.projectFilePath) {
            return false;
        }
        let projectFileText = fs.readFileSync(this.projectFilePath, 'utf8');
        if (path.basename(this.projectFilePath).toLowerCase() === 'project.json') {
            let projectJsonObject;
            try {
                projectJsonObject = json_1.tolerantParse(projectFileText);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to parse project.json file');
                projectJsonObject = null;
            }
            if (projectJsonObject == null) {
                return false;
            }
            for (let key in projectJsonObject.dependencies) {
                if (key.toLowerCase().startsWith("microsoft.aspnetcore.server")) {
                    return true;
                }
            }
        }
        // Assume that this is an MSBuild project. In that case, look for the 'Sdk="Microsoft.NET.Sdk.Web"' attribute.
        // TODO: Have OmniSharp provide the list of SDKs used by a project and check that list instead.
        return projectFileText.toLowerCase().indexOf('sdk="microsoft.net.sdk.web"') >= 0;
    }
    computeProgramPath() {
        if (!this.hasProject) {
            // If there's no target project data, use a placeholder for the path.
            return '${workspaceFolder}/bin/Debug/<insert-target-framework-here>/<insert-project-name-here>.dll';
        }
        let result = '${workspaceFolder}';
        if (this.projectPath) {
            result = path.join(result, path.relative(this.workspaceFolder.uri.fsPath, this.projectPath));
        }
        result = path.join(result, `bin/${this.configurationName}/${this.targetFramework}/${this.executableName}`);
        return result;
    }
    computeWorkingDirectory() {
        if (!this.hasProject) {
            // If there's no target project data, use a placeholder for the path.
            return '${workspaceFolder}';
        }
        let result = '${workspaceFolder}';
        if (this.projectPath) {
            result = path.join(result, path.relative(this.workspaceFolder.uri.fsPath, this.projectPath));
        }
        return result;
    }
    createLaunchJson(isWebProject) {
        if (!isWebProject) {
            const launchConfigurationsMassaged = indentJsonString(createLaunchConfiguration(this.computeProgramPath(), this.computeWorkingDirectory()));
            const attachConfigurationsMassaged = indentJsonString(createAttachConfiguration());
            return `
[
    ${launchConfigurationsMassaged},
    ${attachConfigurationsMassaged}
]`;
        }
        else {
            const webLaunchConfigurationsMassaged = indentJsonString(createWebLaunchConfiguration(this.computeProgramPath(), this.computeWorkingDirectory()));
            const attachConfigurationsMassaged = indentJsonString(createAttachConfiguration());
            return `
[
    ${webLaunchConfigurationsMassaged},
    ${attachConfigurationsMassaged}
]`;
        }
    }
    createBuildTaskDescription() {
        let buildPath = '';
        if (this.hasProject) {
            buildPath = path.join('${workspaceFolder}', path.relative(this.workspaceFolder.uri.fsPath, this.projectFilePath));
        }
        return {
            taskName: 'build',
            command: 'dotnet',
            type: 'process',
            args: ['build', util.convertNativePathToPosix(buildPath)],
            problemMatcher: '$msCompile'
        };
    }
    createTasksConfiguration() {
        return {
            version: "2.0.0",
            tasks: [this.createBuildTaskDescription()]
        };
    }
}
exports.AssetGenerator = AssetGenerator;
function createWebLaunchConfiguration(programPath, workingDirectory) {
    return `
{
    "name": ".NET Core Launch (web)",
    "type": "coreclr",
    "request": "launch",
    "preLaunchTask": "build",
    // If you have changed target frameworks, make sure to update the program path.
    "program": "${util.convertNativePathToPosix(programPath)}",
    "args": [],
    "cwd": "${util.convertNativePathToPosix(workingDirectory)}",
    "stopAtEntry": false,
    "internalConsoleOptions": "openOnSessionStart",
    "launchBrowser": {
        "enabled": true,
        "args": "\${auto-detect-url}",
        "windows": {
            "command": "cmd.exe",
            "args": "/C start \${auto-detect-url}"
        },
        "osx": {
            "command": "open"
        },
        "linux": {
            "command": "xdg-open"
        }
    },
    "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
    },
    "sourceFileMap": {
        "/Views": "\${workspaceFolder}/Views"
    }
}`;
}
exports.createWebLaunchConfiguration = createWebLaunchConfiguration;
function createLaunchConfiguration(programPath, workingDirectory) {
    return `
{
    "name": ".NET Core Launch (console)",
    "type": "coreclr",
    "request": "launch",
    "preLaunchTask": "build",
    // If you have changed target frameworks, make sure to update the program path.
    "program": "${util.convertNativePathToPosix(programPath)}",
    "args": [],
    "cwd": "${util.convertNativePathToPosix(workingDirectory)}",
    // For more information about the 'console' field, see https://github.com/OmniSharp/omnisharp-vscode/blob/master/debugger-launchjson.md#console-terminal-window
    "console": "internalConsole",
    "stopAtEntry": false,
    "internalConsoleOptions": "openOnSessionStart"
}`;
}
exports.createLaunchConfiguration = createLaunchConfiguration;
// AttachConfiguration
function createAttachConfiguration() {
    return `
{
    "name": ".NET Core Attach",
    "type": "coreclr",
    "request": "attach",
    "processId": "\${command:pickProcess}"
}`;
}
exports.createAttachConfiguration = createAttachConfiguration;
function hasAddOperations(operations) {
    return operations.addLaunchJson || operations.addLaunchJson;
}
function getOperations(generator) {
    return getBuildOperations(generator.tasksJsonPath).then(operations => getLaunchOperations(generator.launchJsonPath, operations));
}
/**
 * Will return old (version=0.1.0) or new (version=2.0.0) tasks. If there are any of them, do not
 * write over the tasks.json.
 */
function getBuildTasks(tasksConfiguration) {
    let result = [];
    const tasksV1 = "0.1.0";
    const tasksV2 = "2.0.0";
    function findBuildTask(version, tasksDescriptions) {
        let buildTask = undefined;
        // Find the old tasks
        if (version === tasksV1 && tasksDescriptions) {
            buildTask = tasksDescriptions.find(td => td.isBuildCommand);
        }
        else if (version === tasksV2 && tasksDescriptions) {
            buildTask = tasksDescriptions.find(td => td.group === 'build');
        }
        if (buildTask !== undefined) {
            result.push(buildTask);
        }
    }
    findBuildTask(tasksConfiguration.version, tasksConfiguration.tasks);
    if (tasksConfiguration.windows) {
        findBuildTask(tasksConfiguration.version, tasksConfiguration.windows.tasks);
    }
    if (tasksConfiguration.osx) {
        findBuildTask(tasksConfiguration.version, tasksConfiguration.osx.tasks);
    }
    if (tasksConfiguration.linux) {
        findBuildTask(tasksConfiguration.version, tasksConfiguration.linux.tasks);
    }
    return result;
}
function getBuildOperations(tasksJsonPath) {
    return new Promise((resolve, reject) => {
        fs.exists(tasksJsonPath, exists => {
            if (exists) {
                fs.readFile(tasksJsonPath, (err, buffer) => {
                    if (err) {
                        return reject(err);
                    }
                    const text = buffer.toString();
                    let tasksConfiguration;
                    try {
                        tasksConfiguration = json_1.tolerantParse(text);
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Failed to parse tasks.json file`);
                        return resolve({ updateTasksJson: false });
                    }
                    let buildTasks = getBuildTasks(tasksConfiguration);
                    resolve({ updateTasksJson: buildTasks.length === 0 });
                });
            }
            else {
                resolve({ addTasksJson: true });
            }
        });
    });
}
function getLaunchOperations(launchJsonPath, operations) {
    return new Promise((resolve, reject) => {
        return fs.exists(launchJsonPath, exists => {
            if (exists) {
                resolve(operations);
            }
            else {
                operations.addLaunchJson = true;
                resolve(operations);
            }
        });
    });
}
var PromptResult;
(function (PromptResult) {
    PromptResult[PromptResult["Yes"] = 0] = "Yes";
    PromptResult[PromptResult["No"] = 1] = "No";
    PromptResult[PromptResult["Disable"] = 2] = "Disable";
})(PromptResult || (PromptResult = {}));
function promptToAddAssets(workspaceFolder) {
    return new Promise((resolve, reject) => {
        const yesItem = { title: 'Yes', result: PromptResult.Yes };
        const noItem = { title: 'Not Now', result: PromptResult.No, isCloseAffordance: true };
        const disableItem = { title: "Don't Ask Again", result: PromptResult.Disable };
        const projectName = path.basename(workspaceFolder.uri.fsPath);
        vscode.window.showWarningMessage(`Required assets to build and debug are missing from '${projectName}'. Add them?`, disableItem, noItem, yesItem)
            .then(selection => resolve(selection.result));
    });
}
function addTasksJsonIfNecessary(generator, operations) {
    return new Promise((resolve, reject) => {
        if (!operations.addTasksJson) {
            return resolve();
        }
        const tasksJson = generator.createTasksConfiguration();
        const tasksJsonText = JSON.stringify(tasksJson, null, '    ');
        fs.writeFile(generator.tasksJsonPath, tasksJsonText, err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
exports.addTasksJsonIfNecessary = addTasksJsonIfNecessary;
function indentJsonString(json, numSpaces = 4) {
    return json.split('\n').map(line => ' '.repeat(numSpaces) + line).join('\n').trim();
}
function addLaunchJsonIfNecessary(generator, operations) {
    return new Promise((resolve, reject) => {
        if (!operations.addLaunchJson) {
            return resolve();
        }
        const isWebProject = generator.hasWebServerDependency();
        const launchJson = generator.createLaunchJson(isWebProject);
        const configurationsMassaged = indentJsonString(launchJson);
        const launchJsonText = `
{
   // Use IntelliSense to find out which attributes exist for C# debugging
   // Use hover for the description of the existing attributes
   // For further information visit https://github.com/OmniSharp/omnisharp-vscode/blob/master/debugger-launchjson.md
   "version": "0.2.0",
   "configurations": ${configurationsMassaged}
}`;
        fs.writeFile(generator.launchJsonPath, launchJsonText.trim(), err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
function addAssets(generator, operations) {
    const promises = [
        addTasksJsonIfNecessary(generator, operations),
        addLaunchJsonIfNecessary(generator, operations)
    ];
    return Promise.all(promises);
}
var AddAssetResult;
(function (AddAssetResult) {
    AddAssetResult[AddAssetResult["NotApplicable"] = 0] = "NotApplicable";
    AddAssetResult[AddAssetResult["Done"] = 1] = "Done";
    AddAssetResult[AddAssetResult["Disable"] = 2] = "Disable";
    AddAssetResult[AddAssetResult["Cancelled"] = 3] = "Cancelled";
})(AddAssetResult = exports.AddAssetResult || (exports.AddAssetResult = {}));
function addAssetsIfNecessary(server) {
    return new Promise((resolve, reject) => {
        if (!vscode.workspace.workspaceFolders) {
            return resolve(AddAssetResult.NotApplicable);
        }
        serverUtils.requestWorkspaceInformation(server).then(info => {
            // If there are no .NET Core projects, we won't bother offering to add assets.
            if (protocol.containsDotNetCoreProjects(info)) {
                const generator = new AssetGenerator(info);
                return getOperations(generator).then(operations => {
                    if (!hasAddOperations(operations)) {
                        return resolve(AddAssetResult.NotApplicable);
                    }
                    promptToAddAssets(generator.workspaceFolder).then(result => {
                        if (result === PromptResult.Disable) {
                            return resolve(AddAssetResult.Disable);
                        }
                        if (result !== PromptResult.Yes) {
                            return resolve(AddAssetResult.Cancelled);
                        }
                        fs.ensureDir(generator.vscodeFolder, err => {
                            addAssets(generator, operations).then(() => resolve(AddAssetResult.Done));
                        });
                    });
                });
            }
        }).catch(err => reject(err));
    });
}
exports.addAssetsIfNecessary = addAssetsIfNecessary;
function doesAnyAssetExist(generator) {
    return new Promise((resolve, reject) => {
        fs.exists(generator.launchJsonPath, exists => {
            if (exists) {
                resolve(true);
            }
            else {
                fs.exists(generator.tasksJsonPath, exists => {
                    resolve(exists);
                });
            }
        });
    });
}
function deleteAssets(generator) {
    return Promise.all([
        util.deleteIfExists(generator.launchJsonPath),
        util.deleteIfExists(generator.tasksJsonPath)
    ]);
}
function shouldGenerateAssets(generator) {
    return new Promise((resolve, reject) => {
        doesAnyAssetExist(generator).then(res => {
            if (res) {
                const yesItem = { title: 'Yes' };
                const cancelItem = { title: 'Cancel', isCloseAffordance: true };
                vscode.window.showWarningMessage('Replace existing build and debug assets?', cancelItem, yesItem)
                    .then(selection => {
                    if (selection === yesItem) {
                        deleteAssets(generator).then(_ => resolve(true));
                    }
                    else {
                        // The user clicked cancel
                        resolve(false);
                    }
                });
            }
            else {
                // The assets don't exist, so we're good to go.
                resolve(true);
            }
        });
    });
}
function generateAssets(server) {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceInformation = yield serverUtils.requestWorkspaceInformation(server);
        if (protocol.containsDotNetCoreProjects(workspaceInformation)) {
            const generator = new AssetGenerator(workspaceInformation);
            let operations = yield getOperations(generator);
            if (hasAddOperations(operations)) {
                let doGenerateAssets = yield shouldGenerateAssets(generator);
                if (doGenerateAssets) {
                    yield fs.ensureDir(generator.vscodeFolder);
                    yield addAssets(generator, operations);
                }
            }
        }
        else {
            yield vscode.window.showErrorMessage("Could not locate .NET Core project. Assets were not generated.");
        }
    });
}
exports.generateAssets = generateAssets;
//# sourceMappingURL=assets.js.map