/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var fs = require('fs-extra-promise');
var path = require('path');
var vscode = require('vscode');
var serverUtils = require('./omnisharp/utils');
function getPaths() {
    var vscodeFolder = path.join(vscode.workspace.rootPath, '.vscode');
    return {
        vscodeFolder: vscodeFolder,
        tasksJsonPath: path.join(vscodeFolder, 'tasks.json'),
        launchJsonPath: path.join(vscodeFolder, 'launch.json')
    };
}
function hasOperations(operations) {
    return operations.addLaunchJson ||
        operations.updateTasksJson ||
        operations.addLaunchJson;
}
function getOperations() {
    var paths = getPaths();
    return getBuildOperations(paths.tasksJsonPath).then(function (operations) {
        return getLaunchOperations(paths.launchJsonPath, operations);
    });
}
function getBuildOperations(tasksJsonPath) {
    return new Promise(function (resolve, reject) {
        return fs.existsAsync(tasksJsonPath).then(function (exists) {
            if (exists) {
                fs.readFileAsync(tasksJsonPath).then(function (buffer) {
                    var text = buffer.toString();
                    var tasksJson = JSON.parse(text);
                    var buildTask = tasksJson.tasks.find(function (td) { return td.taskName === 'build'; });
                    resolve({ updateTasksJson: (buildTask === undefined) });
                });
            }
            else {
                resolve({ addTasksJson: true });
            }
        });
    });
}
function getLaunchOperations(launchJsonPath, operations) {
    return new Promise(function (resolve, reject) {
        return fs.existsAsync(launchJsonPath).then(function (exists) {
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
function promptToAddAssets() {
    return new Promise(function (resolve, reject) {
        var yesItem = { title: 'Yes', result: PromptResult.Yes };
        var noItem = { title: 'Not Now', result: PromptResult.No, isCloseAffordance: true };
        var disableItem = { title: "Don't Ask Again", result: PromptResult.Disable };
        var projectName = path.basename(vscode.workspace.rootPath);
        vscode.window.showWarningMessage("Required assets to build and debug are missing from '" + projectName + "'. Add them?", disableItem, noItem, yesItem)
            .then(function (selection) { return resolve(selection.result); });
    });
}
function computeProgramPath(projectData) {
    if (!projectData) {
        // If there's no target project data, use a placeholder for the path.
        return '${workspaceRoot}/bin/Debug/<target-framework>/<project-name.dll>';
    }
    var result = '${workspaceRoot}';
    if (projectData.projectPath) {
        result = path.join(result, path.relative(vscode.workspace.rootPath, projectData.projectPath.fsPath));
    }
    result = path.join(result, "bin/" + projectData.configurationName + "/" + projectData.targetFramework + "/" + projectData.executableName);
    return result;
}
function createLaunchConfiguration(projectData) {
    return {
        name: '.NET Core Launch (console)',
        type: 'coreclr',
        request: 'launch',
        preLaunchTask: 'build',
        program: computeProgramPath(projectData),
        args: [],
        cwd: '${workspaceRoot}',
        externalConsole: false,
        stopAtEntry: false,
        internalConsoleOptions: "openOnSessionStart"
    };
}
function createWebLaunchConfiguration(projectData) {
    return {
        name: '.NET Core Launch (web)',
        type: 'coreclr',
        request: 'launch',
        preLaunchTask: 'build',
        program: computeProgramPath(projectData),
        args: [],
        cwd: '${workspaceRoot}',
        stopAtEntry: false,
        internalConsoleOptions: "openOnSessionStart",
        launchBrowser: {
            enabled: true,
            args: '${auto-detect-url}',
            windows: {
                command: 'cmd.exe',
                args: '/C start ${auto-detect-url}'
            },
            osx: {
                command: 'open'
            },
            linux: {
                command: 'xdg-open'
            }
        },
        env: {
            ASPNETCORE_ENVIRONMENT: "Development"
        },
        sourceFileMap: {
            "/Views": "${workspaceRoot}/Views"
        }
    };
}
function createAttachConfiguration() {
    return {
        name: '.NET Core Attach',
        type: 'coreclr',
        request: 'attach',
        processId: "${command.pickProcess}"
    };
}
function createLaunchJson(projectData, isWebProject) {
    var version = '0.2.0';
    if (!isWebProject) {
        return {
            version: version,
            configurations: [
                createLaunchConfiguration(projectData),
                createAttachConfiguration()
            ]
        };
    }
    else {
        return {
            version: version,
            configurations: [
                createWebLaunchConfiguration(projectData),
                createAttachConfiguration()
            ]
        };
    }
}
function createBuildTaskDescription(projectData) {
    var buildPath = '';
    if (projectData) {
        buildPath = path.join('${workspaceRoot}', path.relative(vscode.workspace.rootPath, projectData.projectJsonPath.fsPath));
    }
    return {
        taskName: 'build',
        args: [buildPath],
        isBuildCommand: true,
        problemMatcher: '$msCompile'
    };
}
function createTasksConfiguration(projectData) {
    return {
        version: '0.1.0',
        command: 'dotnet',
        isShellCommand: true,
        args: [],
        tasks: [createBuildTaskDescription(projectData)]
    };
}
function addTasksJsonIfNecessary(projectData, paths, operations) {
    return new Promise(function (resolve, reject) {
        if (!operations.addTasksJson) {
            return resolve();
        }
        var tasksJson = createTasksConfiguration(projectData);
        var tasksJsonText = JSON.stringify(tasksJson, null, '    ');
        return fs.writeFileAsync(paths.tasksJsonPath, tasksJsonText);
    });
}
function findTargetProjectData(projects) {
    // TODO: For now, assume the Debug configuration. Eventually, we'll need to revisit
    // this when we allow selecting configurations.
    var configurationName = 'Debug';
    var executableProjects = findExecutableProjects(projects, configurationName);
    // TODO: We arbitrarily pick the first executable projec that we find. This will need
    // revisiting when we project a "start up project" selector.
    var targetProject = executableProjects.length > 0
        ? executableProjects[0]
        : undefined;
    if (targetProject && targetProject.Frameworks.length > 0) {
        var config = targetProject.Configurations.find(function (c) { return c.Name === configurationName; });
        if (config) {
            return {
                projectPath: targetProject.Path ? vscode.Uri.file(targetProject.Path) : undefined,
                projectJsonPath: vscode.Uri.file(path.join(targetProject.Path, 'project.json')),
                targetFramework: targetProject.Frameworks[0].ShortName,
                executableName: path.basename(config.CompilationOutputAssemblyFile),
                configurationName: configurationName
            };
        }
    }
    return undefined;
}
function findExecutableProjects(projects, configName) {
    var result = [];
    projects.forEach(function (project) {
        project.Configurations.forEach(function (configuration) {
            if (configuration.Name === configName && configuration.EmitEntryPoint === true) {
                if (project.Frameworks.length > 0) {
                    result.push(project);
                }
            }
        });
    });
    return result;
}
function hasWebServerDependency(targetProjectData) {
    if (!targetProjectData || !targetProjectData.projectJsonPath) {
        return false;
    }
    var projectJson = fs.readFileSync(targetProjectData.projectJsonPath.fsPath, 'utf8');
    projectJson = projectJson.replace(/^\uFEFF/, '');
    var projectJsonObject;
    try {
        // TODO: This error should be surfaced to the user. If the JSON can't be parsed
        // (maybe due to a syntax error like an extra comma), the user should be notified
        // to fix up their project.json.
        projectJsonObject = JSON.parse(projectJson);
    }
    catch (error) {
        projectJsonObject = null;
    }
    if (projectJsonObject == null) {
        return false;
    }
    for (var key in projectJsonObject.dependencies) {
        if (key.toLowerCase().startsWith("microsoft.aspnetcore.server")) {
            return true;
        }
    }
    return false;
}
function addLaunchJsonIfNecessary(projectData, paths, operations) {
    return new Promise(function (resolve, reject) {
        if (!operations.addLaunchJson) {
            return resolve();
        }
        var isWebProject = hasWebServerDependency(projectData);
        var launchJson = createLaunchJson(projectData, isWebProject);
        var launchJsonText = JSON.stringify(launchJson, null, '    ');
        return fs.writeFileAsync(paths.launchJsonPath, launchJsonText);
    });
}
function addAssets(data, paths, operations) {
    var promises = [
        addTasksJsonIfNecessary(data, paths, operations),
        addLaunchJsonIfNecessary(data, paths, operations)
    ];
    return Promise.all(promises);
}
(function (AddAssetResult) {
    AddAssetResult[AddAssetResult["NotApplicable"] = 0] = "NotApplicable";
    AddAssetResult[AddAssetResult["Done"] = 1] = "Done";
    AddAssetResult[AddAssetResult["Disable"] = 2] = "Disable";
    AddAssetResult[AddAssetResult["Cancelled"] = 3] = "Cancelled";
})(exports.AddAssetResult || (exports.AddAssetResult = {}));
var AddAssetResult = exports.AddAssetResult;
function addAssetsIfNecessary(server) {
    return new Promise(function (resolve, reject) {
        if (!vscode.workspace.rootPath) {
            return resolve(AddAssetResult.NotApplicable);
        }
        serverUtils.requestWorkspaceInformation(server).then(function (info) {
            // If there are no .NET Core projects, we won't bother offering to add assets.
            if (info.DotNet && info.DotNet.Projects.length > 0) {
                return getOperations().then(function (operations) {
                    if (!hasOperations(operations)) {
                        return resolve(AddAssetResult.NotApplicable);
                    }
                    promptToAddAssets().then(function (result) {
                        if (result === PromptResult.Disable) {
                            return resolve(AddAssetResult.Disable);
                        }
                        if (result !== PromptResult.Yes) {
                            return resolve(AddAssetResult.Cancelled);
                        }
                        var data = findTargetProjectData(info.DotNet.Projects);
                        var paths = getPaths();
                        return fs.ensureDirAsync(paths.vscodeFolder).then(function () {
                            return addAssets(data, paths, operations).then(function () {
                                return resolve(AddAssetResult.Done);
                            });
                        });
                    });
                });
            }
        }).catch(function (err) {
            return reject(err);
        });
    });
}
exports.addAssetsIfNecessary = addAssetsIfNecessary;
function doesAnyAssetExist(paths) {
    return new Promise(function (resolve, reject) {
        fs.existsAsync(paths.launchJsonPath).then(function (res) {
            if (res) {
                resolve(true);
            }
            else {
                fs.existsAsync(paths.tasksJsonPath).then(function (res) {
                    resolve(res);
                });
            }
        });
    });
}
function deleteAsset(path) {
    return new Promise(function (resolve, reject) {
        fs.existsAsync(path).then(function (res) {
            if (res) {
                // TODO: Should we check after unlinking to see if the file still exists?
                fs.unlinkAsync(path).then(function () {
                    resolve();
                });
            }
        });
    });
}
function deleteAssets(paths) {
    return Promise.all([
        deleteAsset(paths.launchJsonPath),
        deleteAsset(paths.tasksJsonPath)
    ]);
}
function shouldGenerateAssets(paths) {
    return new Promise(function (resolve, reject) {
        doesAnyAssetExist(paths).then(function (res) {
            if (res) {
                var yesItem_1 = { title: 'Yes' };
                var cancelItem = { title: 'Cancel', isCloseAffordance: true };
                vscode.window.showWarningMessage('Replace existing build and debug assets?', cancelItem, yesItem_1)
                    .then(function (selection) {
                    if (selection === yesItem_1) {
                        deleteAssets(paths).then(function (_) { return resolve(true); });
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
    serverUtils.requestWorkspaceInformation(server).then(function (info) {
        if (info.DotNet && info.DotNet.Projects.length > 0) {
            getOperations().then(function (operations) {
                if (hasOperations(operations)) {
                    var paths_1 = getPaths();
                    shouldGenerateAssets(paths_1).then(function (res) {
                        if (res) {
                            fs.ensureDirAsync(paths_1.vscodeFolder).then(function () {
                                var data = findTargetProjectData(info.DotNet.Projects);
                                addAssets(data, paths_1, operations);
                            });
                        }
                    });
                }
            });
        }
        else {
            vscode.window.showErrorMessage("Could not locate .NET Core project. Assets were not generated.");
        }
    });
}
exports.generateAssets = generateAssets;
//# sourceMappingURL=assets.js.map