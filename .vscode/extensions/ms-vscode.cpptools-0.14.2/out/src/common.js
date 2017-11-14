Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
const child_process = require("child_process");
const vscode = require("vscode");
const Telemetry = require("./telemetry");
const HttpsProxyAgent = require("https-proxy-agent");
const url = require("url");
function setExtensionContext(context) {
    exports.extensionContext = context;
}
exports.setExtensionContext = setExtensionContext;
exports.packageJson = vscode.extensions.getExtension("ms-vscode.cpptools").packageJSON;
let showLaunchJsonReloadPrompt = false;
function setShowLaunchJsonReloadPrompt(show) { showLaunchJsonReloadPrompt = show; }
exports.setShowLaunchJsonReloadPrompt = setShowLaunchJsonReloadPrompt;
function getShowLaunchJsonReloadPrompt() { return showLaunchJsonReloadPrompt; }
exports.getShowLaunchJsonReloadPrompt = getShowLaunchJsonReloadPrompt;
function getExtensionFilePath(extensionfile) {
    return path.resolve(exports.extensionContext.extensionPath, extensionfile);
}
exports.getExtensionFilePath = getExtensionFilePath;
function getPackageJsonPath() {
    return getExtensionFilePath("package.json");
}
exports.getPackageJsonPath = getPackageJsonPath;
function getPackageJsonString() {
    exports.packageJson.main = "./out/src/main";
    return JSON.stringify(exports.packageJson, null, 2);
}
exports.getPackageJsonString = getPackageJsonString;
const progressInstallSuccess = 100;
const progressExecutableStarted = 150;
const progressExecutableSuccess = 200;
const progressParseRootSuccess = 300;
const progressIntelliSenseNoSquiggles = 1000;
let installProgressStr = "CPP." + exports.packageJson.version + ".Progress";
let intelliSenseProgressStr = "CPP." + exports.packageJson.version + ".IntelliSenseProgress";
function getProgress() {
    return exports.extensionContext.globalState.get(installProgressStr, -1);
}
exports.getProgress = getProgress;
function getIntelliSenseProgress() {
    return exports.extensionContext.globalState.get(intelliSenseProgressStr, -1);
}
exports.getIntelliSenseProgress = getIntelliSenseProgress;
function setProgress(progress) {
    if (getProgress() < progress) {
        exports.extensionContext.globalState.update(installProgressStr, progress);
        let telemetryProperties = {};
        let progressName;
        switch (progress) {
            case 0:
                progressName = "install started";
                break;
            case progressInstallSuccess:
                progressName = "install succeeded";
                break;
            case progressExecutableStarted:
                progressName = "executable started";
                break;
            case progressExecutableSuccess:
                progressName = "executable succeeded";
                break;
            case progressParseRootSuccess:
                progressName = "parse root succeeded";
                break;
        }
        telemetryProperties['progress'] = progressName;
        Telemetry.logDebuggerEvent("progress", telemetryProperties);
    }
}
exports.setProgress = setProgress;
function setIntelliSenseProgress(progress) {
    if (getIntelliSenseProgress() < progress) {
        exports.extensionContext.globalState.update(intelliSenseProgressStr, progress);
        let telemetryProperties = {};
        let progressName;
        switch (progress) {
            case progressIntelliSenseNoSquiggles:
                progressName = "IntelliSense no squiggles";
                break;
        }
        telemetryProperties['progress'] = progressName;
        Telemetry.logDebuggerEvent("progress", telemetryProperties);
    }
}
exports.setIntelliSenseProgress = setIntelliSenseProgress;
function getProgressInstallSuccess() { return progressInstallSuccess; }
exports.getProgressInstallSuccess = getProgressInstallSuccess;
function getProgressExecutableStarted() { return progressExecutableStarted; }
exports.getProgressExecutableStarted = getProgressExecutableStarted;
function getProgressExecutableSuccess() { return progressExecutableSuccess; }
exports.getProgressExecutableSuccess = getProgressExecutableSuccess;
function getProgressParseRootSuccess() { return progressParseRootSuccess; }
exports.getProgressParseRootSuccess = getProgressParseRootSuccess;
function getProgressIntelliSenseNoSquiggles() { return progressIntelliSenseNoSquiggles; }
exports.getProgressIntelliSenseNoSquiggles = getProgressIntelliSenseNoSquiggles;
function showReleaseNotes() {
    vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.file(getExtensionFilePath("ReleaseNotes.html")), vscode.ViewColumn.One, "C/C++ Extension Release Notes");
}
exports.showReleaseNotes = showReleaseNotes;
function resolveVariables(input) {
    if (input === null)
        return "";
    let regexp = /\$\{(env:|env.)?(.*?)\}/g;
    let ret = input.replace(regexp, (match, ignored, name) => {
        let newValue = process.env[name];
        return (newValue != null) ? newValue : match;
    });
    regexp = /^\~/g;
    ret = ret.replace(regexp, (match, name) => {
        let newValue = process.env.HOME;
        return (newValue != null) ? newValue : match;
    });
    return ret;
}
exports.resolveVariables = resolveVariables;
function asFolder(uri) {
    let result = uri.toString();
    if (result.charAt(result.length - 1) !== '/') {
        result += '/';
    }
    return result;
}
exports.asFolder = asFolder;
function getOpenCommand() {
    if (os.platform() == 'win32') {
        return 'explorer';
    }
    else if (os.platform() == 'darwin') {
        return '/usr/bin/open';
    }
    else {
        return '/usr/bin/xdg-open';
    }
}
exports.getOpenCommand = getOpenCommand;
function getDebugAdaptersPath(file) {
    return path.resolve(getExtensionFilePath("debugAdapters"), file);
}
exports.getDebugAdaptersPath = getDebugAdaptersPath;
function GetHttpsProxyAgent() {
    let proxy = vscode.workspace.getConfiguration().get('http.proxy');
    if (!proxy) {
        proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
        if (!proxy)
            return null;
    }
    let proxyUrl = url.parse(proxy);
    if (proxyUrl.protocol !== "https:" && proxyUrl.protocol !== "http:")
        return null;
    let strictProxy = vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true);
    let proxyOptions = {
        host: proxyUrl.hostname,
        port: parseInt(proxyUrl.port, 10),
        auth: proxyUrl.auth,
        rejectUnauthorized: strictProxy
    };
    return new HttpsProxyAgent(proxyOptions);
}
exports.GetHttpsProxyAgent = GetHttpsProxyAgent;
function checkLockFile() {
    return checkFileExists(getInstallLockPath());
}
exports.checkLockFile = checkLockFile;
function touchLockFile() {
    return new Promise((resolve, reject) => {
        fs.writeFile(getInstallLockPath(), "", (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
exports.touchLockFile = touchLockFile;
function checkFileExists(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (stats && stats.isFile()) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
exports.checkFileExists = checkFileExists;
function readFileText(filePath, encoding = "utf8") {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, encoding, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}
exports.readFileText = readFileText;
function writeFileText(filePath, content, encoding = "utf8") {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, { encoding }, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
exports.writeFileText = writeFileText;
function getInstallLockPath() {
    return getExtensionFilePath("install.lock");
}
exports.getInstallLockPath = getInstallLockPath;
function getReadmeMessage() {
    const readmePath = getExtensionFilePath("README.md");
    const readmeMessage = `Please refer to ${readmePath} for troubleshooting information. Issues can be created at https://github.com/Microsoft/vscppsamples/issues`;
    return readmeMessage;
}
exports.getReadmeMessage = getReadmeMessage;
function logToFile(message) {
    var logFolder = getExtensionFilePath("extension.log");
    fs.writeFileSync(logFolder, `${message}${os.EOL}`, { flag: 'a' });
}
exports.logToFile = logToFile;
function execChildProcess(process, workingDirectory, channel) {
    return new Promise((resolve, reject) => {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, (error, stdout, stderr) => {
            if (channel) {
                let message = "";
                let err = false;
                if (stdout && stdout.length > 0) {
                    message += stdout;
                }
                if (stderr && stderr.length > 0) {
                    message += stderr;
                    err = true;
                }
                if (error) {
                    message += error.message;
                    err = true;
                }
                if (err) {
                    channel.append(message);
                    channel.show();
                }
            }
            if (error) {
                reject(error);
                return;
            }
            if (stderr && stderr.length > 0) {
                reject(new Error(stderr));
                return;
            }
            resolve(stdout);
        });
    });
}
exports.execChildProcess = execChildProcess;
function spawnChildProcess(process, args, workingDirectory, dataCallback, errorCallback) {
    return new Promise(function (resolve, reject) {
        const child = child_process.spawn(process, args, { cwd: workingDirectory });
        child.stdout.on('data', (data) => {
            dataCallback(`${data}`);
        });
        child.stderr.on('data', (data) => {
            errorCallback(`${data}`);
        });
        child.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`${process} exited with error code ${code}`));
            }
            else {
                resolve();
            }
        });
    });
}
exports.spawnChildProcess = spawnChildProcess;
var outputChannel;
function getOutputChannel() {
    if (outputChannel == undefined)
        outputChannel = vscode.window.createOutputChannel("C/C++");
    return outputChannel;
}
exports.getOutputChannel = getOutputChannel;
function allowExecution(file) {
    return new Promise((resolve, reject) => {
        if (process.platform != 'win32') {
            checkFileExists(file).then((exists) => {
                if (exists) {
                    fs.chmod(file, '755', (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                }
                else {
                    getOutputChannel().appendLine("");
                    getOutputChannel().appendLine(`Warning: Expected file ${file} is missing.`);
                    resolve();
                }
            });
        }
        else {
            resolve();
        }
    });
}
exports.allowExecution = allowExecution;
//# sourceMappingURL=common.js.map