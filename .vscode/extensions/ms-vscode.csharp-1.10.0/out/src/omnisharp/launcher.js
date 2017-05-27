/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const semver_1 = require("semver");
const platform_1 = require("../platform");
const path = require("path");
const vscode = require("vscode");
const util = require("../common");
const options_1 = require("./options");
var LaunchTargetKind;
(function (LaunchTargetKind) {
    LaunchTargetKind[LaunchTargetKind["Solution"] = 0] = "Solution";
    LaunchTargetKind[LaunchTargetKind["ProjectJson"] = 1] = "ProjectJson";
    LaunchTargetKind[LaunchTargetKind["Folder"] = 2] = "Folder";
    LaunchTargetKind[LaunchTargetKind["Csx"] = 3] = "Csx";
})(LaunchTargetKind = exports.LaunchTargetKind || (exports.LaunchTargetKind = {}));
/**
 * Returns a list of potential targets on which OmniSharp can be launched.
 * This includes `project.json` files, `*.sln` files (if any `*.csproj` files are found), and the root folder
 * (if it doesn't contain a `project.json` file, but `project.json` files exist). In addition, the root folder
 * is included if there are any `*.csproj` files present, but a `*.sln* file is not found.
 */
function findLaunchTargets() {
    if (!vscode.workspace.rootPath) {
        return Promise.resolve([]);
    }
    const options = options_1.Options.Read();
    return vscode.workspace.findFiles(
    /*include*/ '{**/*.sln,**/*.csproj,**/project.json,**/*.csx}', 
    /*exclude*/ '{**/node_modules/**,**/.git/**,**/bower_components/**}', 
    /*maxResults*/ options.maxProjectResults)
        .then(resources => {
        return select(resources, vscode.workspace.rootPath);
    });
}
exports.findLaunchTargets = findLaunchTargets;
function select(resources, rootPath) {
    // The list of launch targets is calculated like so:
    //   * If there are .csproj files, .sln files are considered as launch targets.
    //   * Any project.json file is considered a launch target.
    //   * If there is no project.json file in the root, the root as added as a launch target.
    //   * Additionally, if there are .csproj files, but no .sln file, the root is added as a launch target.
    //
    // TODO:
    //   * It should be possible to choose a .csproj as a launch target
    //   * It should be possible to choose a .sln file even when no .csproj files are found 
    //     within the root.
    if (!Array.isArray(resources)) {
        return [];
    }
    let targets = [], hasCsProjFiles = false, hasSlnFile = false, hasProjectJson = false, hasProjectJsonAtRoot = false, hasCSX = false;
    hasCsProjFiles = resources.some(isCSharpProject);
    resources.forEach(resource => {
        // Add .sln files if there are .csproj files
        if (hasCsProjFiles && isSolution(resource)) {
            hasSlnFile = true;
            targets.push({
                label: path.basename(resource.fsPath),
                description: vscode.workspace.asRelativePath(path.dirname(resource.fsPath)),
                target: resource.fsPath,
                directory: path.dirname(resource.fsPath),
                kind: LaunchTargetKind.Solution
            });
        }
        // Add project.json files
        if (isProjectJson(resource)) {
            const dirname = path.dirname(resource.fsPath);
            hasProjectJson = true;
            hasProjectJsonAtRoot = hasProjectJsonAtRoot || dirname === rootPath;
            targets.push({
                label: path.basename(resource.fsPath),
                description: vscode.workspace.asRelativePath(path.dirname(resource.fsPath)),
                target: dirname,
                directory: dirname,
                kind: LaunchTargetKind.ProjectJson
            });
        }
        // Discover if there is any CSX file
        if (!hasCSX && isCsx(resource)) {
            hasCSX = true;
        }
    });
    // Add the root folder under the following circumstances:
    // * If there are .csproj files, but no .sln file, and none in the root.
    // * If there are project.json files, but none in the root.
    if ((hasCsProjFiles && !hasSlnFile) || (hasProjectJson && !hasProjectJsonAtRoot)) {
        targets.push({
            label: path.basename(rootPath),
            description: '',
            target: rootPath,
            directory: rootPath,
            kind: LaunchTargetKind.Folder
        });
    }
    // if we noticed any CSX file(s), add a single CSX-specific target pointing at the root folder
    if (hasCSX) {
        targets.push({
            label: "CSX",
            description: path.basename(rootPath),
            target: rootPath,
            directory: rootPath,
            kind: LaunchTargetKind.Csx
        });
    }
    return targets.sort((a, b) => a.directory.localeCompare(b.directory));
}
function isCSharpProject(resource) {
    return /\.csproj$/i.test(resource.fsPath);
}
function isSolution(resource) {
    return /\.sln$/i.test(resource.fsPath);
}
function isProjectJson(resource) {
    return /\project.json$/i.test(resource.fsPath);
}
function isCsx(resource) {
    return /\.csx$/i.test(resource.fsPath);
}
function launchOmniSharp(cwd, args) {
    return new Promise((resolve, reject) => {
        launch(cwd, args)
            .then(result => {
            // async error - when target not not ENEOT
            result.process.on('error', err => {
                reject(err);
            });
            // success after a short freeing event loop
            setTimeout(function () {
                resolve(result);
            }, 0);
        });
    });
}
exports.launchOmniSharp = launchOmniSharp;
function launch(cwd, args) {
    return platform_1.PlatformInformation.GetCurrent().then(platformInfo => {
        const options = options_1.Options.Read();
        if (options.useEditorFormattingSettings) {
            let editorConfig = vscode.workspace.getConfiguration('editor');
            args.push(`formattingOptions:useTabs=${!editorConfig.get('insertSpaces', true)}`);
            args.push(`formattingOptions:tabSize=${editorConfig.get('tabSize', 4)}`);
            args.push(`formattingOptions:indentationSize=${editorConfig.get('tabSize', 4)}`);
        }
        if (options.path && options.useMono) {
            return launchNixMono(options.path, cwd, args);
        }
        const launchPath = options.path || getLaunchPath(platformInfo);
        if (platformInfo.isWindows()) {
            return launchWindows(launchPath, cwd, args);
        }
        else {
            return launchNix(launchPath, cwd, args);
        }
    });
}
function getLaunchPath(platformInfo) {
    const binPath = util.getBinPath();
    return platformInfo.isWindows()
        ? path.join(binPath, 'omnisharp', 'OmniSharp.exe')
        : path.join(binPath, 'run');
}
function launchWindows(launchPath, cwd, args) {
    function escapeIfNeeded(arg) {
        const hasSpaceWithoutQuotes = /^[^"].* .*[^"]/;
        return hasSpaceWithoutQuotes.test(arg)
            ? `"${arg}"`
            : arg.replace("&", "^&");
    }
    let argsCopy = args.slice(0); // create copy of args
    argsCopy.unshift(launchPath);
    argsCopy = [[
            '/s',
            '/c',
            '"' + argsCopy.map(escapeIfNeeded).join(' ') + '"'
        ].join(' ')];
    let process = child_process_1.spawn('cmd', argsCopy, {
        windowsVerbatimArguments: true,
        detached: false,
        cwd: cwd
    });
    return {
        process,
        command: launchPath,
        usingMono: false
    };
}
function launchNix(launchPath, cwd, args) {
    let process = child_process_1.spawn(launchPath, args, {
        detached: false,
        cwd: cwd
    });
    return {
        process,
        command: launchPath,
        usingMono: true
    };
}
function launchNixMono(launchPath, cwd, args) {
    return canLaunchMono()
        .then(() => {
        let argsCopy = args.slice(0); // create copy of details args
        argsCopy.unshift(launchPath);
        let process = child_process_1.spawn('mono', argsCopy, {
            detached: false,
            cwd: cwd
        });
        return {
            process,
            command: launchPath,
            usingMono: true
        };
    });
}
function canLaunchMono() {
    return new Promise((resolve, reject) => {
        hasMono('>=4.6.0').then(success => {
            if (success) {
                resolve();
            }
            else {
                reject(new Error('Cannot start Omnisharp because Mono version >=4.0.1 is required.'));
            }
        });
    });
}
function hasMono(range) {
    const versionRegexp = /(\d+\.\d+\.\d+)/;
    return new Promise((resolve, reject) => {
        let childprocess;
        try {
            childprocess = child_process_1.spawn('mono', ['--version']);
        }
        catch (e) {
            return resolve(false);
        }
        childprocess.on('error', function (err) {
            resolve(false);
        });
        let stdout = '';
        childprocess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        childprocess.stdout.on('close', () => {
            let match = versionRegexp.exec(stdout), ret;
            if (!match) {
                ret = false;
            }
            else if (!range) {
                ret = true;
            }
            else {
                ret = semver_1.satisfies(match[1], range);
            }
            resolve(ret);
        });
    });
}
exports.hasMono = hasMono;
//# sourceMappingURL=launcher.js.map