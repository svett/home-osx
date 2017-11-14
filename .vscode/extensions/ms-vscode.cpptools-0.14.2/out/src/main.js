'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const os = require("os");
const fs = require("fs");
const util = require("./common");
const Telemetry = require("./telemetry");
const LanguageServer = require("./LanguageServer/extension");
const DebuggerExtension = require("./Debugger/extension");
const platform_1 = require("./platform");
const packageManager_1 = require("./packageManager");
const url = require("url");
const https = require("https");
const releaseNotesVersion = 3;
const userBucketMax = 100;
let delayedCommandsToExecute;
let unregisterTempCommands;
function registerTempCommand(command) {
    unregisterTempCommands.push(vscode.commands.registerCommand(command, () => {
        delayedCommandsToExecute.add(command);
    }));
}
const userBucketString = "CPP.UserBucket";
function downloadCpptoolsJson(urlString) {
    return new Promise((resolve, reject) => {
        let parsedUrl = url.parse(urlString);
        let request = https.request({
            host: parsedUrl.host,
            path: parsedUrl.path,
            agent: util.GetHttpsProxyAgent(),
            rejectUnauthorized: vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true)
        }, (response) => {
            if (response.statusCode == 301 || response.statusCode == 302) {
                let redirectUrl;
                if (typeof response.headers.location === "string") {
                    redirectUrl = response.headers.location;
                }
                else {
                    redirectUrl = response.headers.location[0];
                }
                return resolve(downloadCpptoolsJson(redirectUrl));
            }
            if (response.statusCode != 200)
                return reject();
            let downloadedBytes = 0;
            let cppToolsJsonFile = fs.createWriteStream(util.getExtensionFilePath("cpptools.json"));
            response.on('data', (data) => { downloadedBytes += data.length; });
            response.on('end', () => { cppToolsJsonFile.close(); });
            cppToolsJsonFile.on('close', () => { resolve(); });
            response.on('error', (error) => { reject(); });
            response.pipe(cppToolsJsonFile, { end: false });
        });
        request.on('error', (error) => { reject(); });
        request.end();
    });
}
function downloadCpptoolsJsonPkg() {
    let hasError = false;
    let telemetryProperties = {};
    return downloadCpptoolsJson("https://go.microsoft.com/fwlink/?linkid=852750")
        .catch((error) => {
        hasError = true;
    })
        .then(() => {
        telemetryProperties['success'] = (!hasError).toString();
        Telemetry.logDebuggerEvent("cpptoolsJsonDownload", telemetryProperties);
    });
}
function activate(context) {
    util.setExtensionContext(context);
    Telemetry.activate();
    util.setProgress(0);
    if (context.globalState.get(userBucketString, -1) == -1) {
        let bucket = Math.floor(Math.random() * userBucketMax) + 1;
        context.globalState.update(userBucketString, bucket);
    }
    delayedCommandsToExecute = new Set();
    unregisterTempCommands = [];
    registerTempCommand("extension.pickNativeProcess");
    registerTempCommand("extension.pickRemoteNativeProcess");
    registerTempCommand("C_Cpp.ConfigurationEdit");
    registerTempCommand("C_Cpp.ConfigurationSelect");
    registerTempCommand("C_Cpp.SwitchHeaderSource");
    registerTempCommand("C_Cpp.Navigate");
    registerTempCommand("C_Cpp.GoToDeclaration");
    registerTempCommand("C_Cpp.PeekDeclaration");
    registerTempCommand("C_Cpp.ToggleErrorSquiggles");
    registerTempCommand("C_Cpp.ToggleIncludeFallback");
    registerTempCommand("C_Cpp.ShowReleaseNotes");
    registerTempCommand("C_Cpp.ResetDatabase");
    registerTempCommand("C_Cpp.PauseParsing");
    registerTempCommand("C_Cpp.ResumeParsing");
    registerTempCommand("C_Cpp.ShowParsingCommands");
    processRuntimeDependencies(() => {
        util.readFileText(util.getExtensionFilePath("cpptools.json"))
            .then((cpptoolsString) => {
            let cpptoolsObject = JSON.parse(cpptoolsString);
            let intelliSenseEnginePercentage = cpptoolsObject.intelliSenseEngine_default_percentage;
            if (!util.packageJson.extensionFolderPath.includes(".vscode-insiders")) {
                let prevIntelliSenseEngineDefault = util.packageJson.contributes.configuration.properties["C_Cpp.intelliSenseEngine"].default;
                if (util.extensionContext.globalState.get(userBucketString, userBucketMax + 1) <= intelliSenseEnginePercentage) {
                    util.packageJson.contributes.configuration.properties["C_Cpp.intelliSenseEngine"].default = "Default";
                }
                else {
                    util.packageJson.contributes.configuration.properties["C_Cpp.intelliSenseEngine"].default = "Tag Parser";
                }
                if (prevIntelliSenseEngineDefault != util.packageJson.contributes.configuration.properties["C_Cpp.intelliSenseEngine"].default)
                    return util.writeFileText(util.getPackageJsonPath(), util.getPackageJsonString());
            }
        })
            .catch((error) => {
        })
            .then(() => {
            unregisterTempCommands.forEach((command) => {
                command.dispose();
            });
            unregisterTempCommands = [];
            DebuggerExtension.activate();
            LanguageServer.activate();
            delayedCommandsToExecute.forEach((command) => {
                vscode.commands.executeCommand(command);
            });
            delayedCommandsToExecute.clear();
        });
    });
    setInterval(() => {
        downloadCpptoolsJsonPkg();
    }, 30 * 60 * 1000);
}
exports.activate = activate;
function deactivate() {
    DebuggerExtension.deactivate();
    unregisterTempCommands.forEach((command) => {
        command.dispose();
    });
    Telemetry.deactivate();
    return LanguageServer.deactivate();
}
exports.deactivate = deactivate;
function removePotentialPII(str) {
    let words = str.split(" ");
    let result = "";
    for (let word of words) {
        if (word.indexOf(".") == -1 && word.indexOf("/") == -1 && word.indexOf("\\") == -1 && word.indexOf(":") == -1) {
            result += word + " ";
        }
        else {
            result += "? ";
        }
    }
    return result;
}
function processRuntimeDependencies(activateExtensions) {
    util.checkLockFile().then((lockExists) => {
        if (!lockExists) {
            let channel = util.getOutputChannel();
            channel.appendLine("Updating C/C++ dependencies...");
            var statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            let errorMessage = '';
            let hasError = false;
            let installationStage = 'getPlatformInfo';
            let platformInfo;
            let packageManager;
            let telemetryProperties = {};
            platform_1.PlatformInformation.GetPlatformInformation()
                .then((info) => {
                platformInfo = info;
                packageManager = new packageManager_1.PackageManager(info, channel, statusItem);
                channel.appendLine("");
                installationStage = "downloadPackages";
                return packageManager.DownloadPackages();
            })
                .then(() => {
                channel.appendLine("");
                installationStage = "installPackages";
                return packageManager.InstallPackages();
            })
                .then(() => {
                installationStage = "makeBinariesExecutable";
                return util.allowExecution(util.getDebugAdaptersPath("OpenDebugAD7"));
            })
                .then(() => {
                if (os.platform() !== 'win32') {
                    installationStage = "removeUnnecessaryFile";
                    let sourcePath = util.getDebugAdaptersPath("bin/OpenDebugAD7.exe.config");
                    if (fs.existsSync(sourcePath))
                        return fs.rename(sourcePath, util.getDebugAdaptersPath("bin/OpenDebugAD7.exe.config.unused"), (err) => {
                            channel.appendLine("removeUnnecessaryFile: fs.rename failed: " + err.message);
                        });
                }
            })
                .then(() => {
                installationStage = "rewriteManifest";
                return rewriteManifest();
            })
                .then(() => {
                checkDistro(channel, platformInfo);
                installationStage = "touchLockFile";
                return util.touchLockFile();
            })
                .then(() => {
                installationStage = "downloadCpptoolsJson";
                return downloadCpptoolsJsonPkg();
            })
                .catch((error) => {
                hasError = true;
                telemetryProperties['stage'] = installationStage;
                if (error instanceof packageManager_1.PackageManagerError) {
                    if (error instanceof packageManager_1.PackageManagerWebResponseError) {
                        let webRequestPackageError = error;
                        if (webRequestPackageError.socket) {
                            let address = webRequestPackageError.socket.address();
                            if (address) {
                                telemetryProperties['error.targetIP'] = address.address + ':' + address.port;
                            }
                        }
                    }
                    let packageError = error;
                    telemetryProperties['error.methodName'] = packageError.methodName;
                    telemetryProperties['error.message'] = packageError.message;
                    if (packageError.innerError) {
                        errorMessage = packageError.innerError.toString();
                        telemetryProperties['error.innerError'] = removePotentialPII(errorMessage);
                    }
                    else {
                        errorMessage = packageError.message;
                    }
                    if (packageError.pkg) {
                        telemetryProperties['error.packageName'] = packageError.pkg.description;
                        telemetryProperties['error.packageUrl'] = packageError.pkg.url;
                    }
                    if (packageError.errorCode) {
                        telemetryProperties['error.errorCode'] = removePotentialPII(packageError.errorCode);
                    }
                }
                else {
                    errorMessage = error.toString();
                    telemetryProperties['error.toString'] = removePotentialPII(errorMessage);
                }
                if (installationStage == "downloadPackages")
                    channel.appendLine("");
                channel.appendLine(`Failed at stage: ${installationStage}`);
                channel.appendLine(errorMessage);
                channel.appendLine("");
                channel.show();
            })
                .then(() => {
                channel.appendLine("");
                installationStage = '';
                channel.appendLine("Finished installing dependencies");
                channel.appendLine("");
                telemetryProperties['success'] = (!hasError).toString();
                if (platformInfo.distribution) {
                    telemetryProperties['linuxDistroName'] = platformInfo.distribution.name;
                    telemetryProperties['linuxDistroVersion'] = platformInfo.distribution.version;
                }
                if (!hasError) {
                    util.setProgress(util.getProgressInstallSuccess());
                    const releaseNotesVersionString = "CPP.ReleaseNotesVersion";
                    if (util.extensionContext.globalState.get(releaseNotesVersionString, -1) < releaseNotesVersion) {
                        util.showReleaseNotes();
                        util.extensionContext.globalState.update(releaseNotesVersionString, releaseNotesVersion);
                    }
                }
                telemetryProperties['osArchitecture'] = platformInfo.architecture;
                Telemetry.logDebuggerEvent("acquisition", telemetryProperties);
                statusItem.dispose();
                if (!hasError)
                    activateExtensions();
            });
        }
        else {
            activateExtensions();
            downloadCpptoolsJsonPkg();
        }
    });
}
function checkDistro(channel, platformInfo) {
    if (platformInfo.platform != 'win32' && platformInfo.platform != 'linux' && platformInfo.platform != 'darwin') {
        channel.appendLine(`Warning: Debugging has not been tested for this platform. ${util.getReadmeMessage()}`);
    }
}
function rewriteManifest() {
    util.packageJson.activationEvents = [
        "onLanguage:cpp",
        "onLanguage:c",
        "onCommand:extension.pickNativeProcess",
        "onCommand:extension.pickRemoteNativeProcess",
        "onCommand:C_Cpp.ConfigurationEdit",
        "onCommand:C_Cpp.ConfigurationSelect",
        "onCommand:C_Cpp.SwitchHeaderSource",
        "onCommand:C_Cpp.Navigate",
        "onCommand:C_Cpp.GoToDeclaration",
        "onCommand:C_Cpp.PeekDeclaration",
        "onCommand:C_Cpp.ToggleErrorSquiggles",
        "onCommand:C_Cpp.ToggleIncludeFallback",
        "onCommand:C_Cpp.ShowReleaseNotes",
        "onCommand:C_Cpp.ResetDatabase",
        "onCommand:C_Cpp.PauseParsing",
        "onCommand:C_Cpp.ResumeParsing",
        "onCommand:C_Cpp.ShowParsingCommands",
        "workspaceContains:.vscode/c_cpp_properties.json",
        "onDebug"
    ];
    util.packageJson.contributes.debuggers[0].runtime = undefined;
    util.packageJson.contributes.debuggers[0].program = './debugAdapters/OpenDebugAD7';
    util.packageJson.contributes.debuggers[0].windows = { "program": "./debugAdapters/bin/OpenDebugAD7.exe" };
    if (os.platform() === 'win32') {
        util.packageJson.contributes.debuggers[1].runtime = undefined;
        util.packageJson.contributes.debuggers[1].program = './debugAdapters/vsdbg/bin/vsdbg.exe';
    }
    if (util.packageJson.extensionFolderPath.includes(".vscode-insiders"))
        util.packageJson.contributes.configuration.properties["C_Cpp.intelliSenseEngine"].default = "Default";
    return util.writeFileText(util.getPackageJsonPath(), util.getPackageJsonString());
}
//# sourceMappingURL=main.js.map