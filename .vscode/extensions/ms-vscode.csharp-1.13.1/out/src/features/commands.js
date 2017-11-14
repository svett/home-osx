/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const serverUtils = require("../omnisharp/utils");
const launcher_1 = require("../omnisharp/launcher");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const protocol = require("../omnisharp/protocol");
const vscode = require("vscode");
const processPicker_1 = require("./processPicker");
const assets_1 = require("../assets");
let channel = vscode.window.createOutputChannel('.NET');
function registerCommands(server, reporter) {
    let d1 = vscode.commands.registerCommand('o.restart', () => restartOmniSharp(server));
    let d2 = vscode.commands.registerCommand('o.pickProjectAndStart', () => pickProjectAndStart(server));
    let d3 = vscode.commands.registerCommand('o.showOutput', () => server.getChannel().show(vscode.ViewColumn.Three));
    let d4 = vscode.commands.registerCommand('dotnet.restore', () => dotnetRestoreAllProjects(server));
    // register empty handler for csharp.installDebugger
    // running the command activates the extension, which is all we need for installation to kickoff
    let d5 = vscode.commands.registerCommand('csharp.downloadDebugger', () => { });
    // register process picker for attach
    let attachItemsProvider = processPicker_1.DotNetAttachItemsProviderFactory.Get();
    let attacher = new processPicker_1.AttachPicker(attachItemsProvider);
    let d6 = vscode.commands.registerCommand('csharp.listProcess', () => attacher.ShowAttachEntries());
    // Register command for generating tasks.json and launch.json assets.
    let d7 = vscode.commands.registerCommand('dotnet.generateAssets', () => assets_1.generateAssets(server));
    let d8 = vscode.commands.registerCommand('csharp.listRemoteProcess', (args) => processPicker_1.RemoteAttachPicker.ShowAttachEntries(args));
    return vscode.Disposable.from(d1, d2, d3, d4, d5, d6, d7, d8);
}
exports.default = registerCommands;
function restartOmniSharp(server) {
    if (server.isRunning()) {
        server.restart();
    }
    else {
        server.autoStart('');
    }
}
function pickProjectAndStart(server) {
    return launcher_1.findLaunchTargets().then(targets => {
        let currentPath = server.getSolutionPathOrFolder();
        if (currentPath) {
            for (let target of targets) {
                if (target.target === currentPath) {
                    target.label = `\u2713 ${target.label}`;
                }
            }
        }
        return vscode.window.showQuickPick(targets, {
            matchOnDescription: true,
            placeHolder: `Select 1 of ${targets.length} projects`
        }).then(launchTarget => {
            if (launchTarget) {
                return server.restart(launchTarget);
            }
        });
    });
}
function projectsToCommands(projects) {
    return projects.map(project => {
        let projectDirectory = project.Directory;
        return new Promise((resolve, reject) => {
            fs.lstat(projectDirectory, (err, stats) => {
                if (err) {
                    return reject(err);
                }
                if (stats.isFile()) {
                    projectDirectory = path.dirname(projectDirectory);
                }
                resolve({
                    label: `dotnet restore - (${project.Name || path.basename(project.Directory)})`,
                    description: projectDirectory,
                    execute() {
                        return dotnetRestore(projectDirectory);
                    }
                });
            });
        });
    });
}
function dotnetRestoreAllProjects(server) {
    if (!server.isRunning()) {
        return Promise.reject('OmniSharp server is not running.');
    }
    return serverUtils.requestWorkspaceInformation(server).then(info => {
        let descriptors = protocol.getDotNetCoreProjectDescriptors(info);
        if (descriptors.length === 0) {
            return Promise.reject("No .NET Core projects found");
        }
        let commandPromises = projectsToCommands(descriptors);
        return Promise.all(commandPromises).then(commands => {
            return vscode.window.showQuickPick(commands);
        }).then(command => {
            if (command) {
                return command.execute();
            }
        });
    });
}
exports.dotnetRestoreAllProjects = dotnetRestoreAllProjects;
function dotnetRestoreForProject(server, filePath) {
    if (!server.isRunning()) {
        return Promise.reject('OmniSharp server is not running.');
    }
    return serverUtils.requestWorkspaceInformation(server).then(info => {
        let descriptors = protocol.getDotNetCoreProjectDescriptors(info);
        if (descriptors.length === 0) {
            return Promise.reject("No .NET Core projects found");
        }
        for (let descriptor of descriptors) {
            if (descriptor.FilePath === filePath) {
                return dotnetRestore(descriptor.Directory, filePath);
            }
        }
    });
}
exports.dotnetRestoreForProject = dotnetRestoreForProject;
function dotnetRestore(cwd, filePath) {
    return new Promise((resolve, reject) => {
        channel.clear();
        channel.show();
        let cmd = 'dotnet';
        let args = ['restore'];
        if (filePath) {
            args.push(filePath);
        }
        let dotnet = cp.spawn(cmd, args, { cwd: cwd, env: process.env });
        function handleData(stream) {
            stream.on('data', chunk => {
                channel.append(chunk.toString());
            });
            stream.on('err', err => {
                channel.append(`ERROR: ${err}`);
            });
        }
        handleData(dotnet.stdout);
        handleData(dotnet.stderr);
        dotnet.on('close', (code, signal) => {
            channel.appendLine(`Done: ${code}.`);
            resolve();
        });
        dotnet.on('error', err => {
            channel.appendLine(`ERROR: ${err}`);
            reject(err);
        });
    });
}
//# sourceMappingURL=commands.js.map