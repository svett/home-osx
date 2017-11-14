Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const https = require("https");
const path = require("path");
const vscode = require("vscode");
const url = require("url");
const tmp = require("tmp");
const yauzl = require("yauzl");
const mkdirp = require("mkdirp");
const util = require("./common");
const Telemetry = require("./telemetry");
class PackageManagerError extends Error {
    constructor(message, methodName, pkg = null, innerError = null, errorCode = '') {
        super(message);
        this.message = message;
        this.methodName = methodName;
        this.pkg = pkg;
        this.innerError = innerError;
        this.errorCode = errorCode;
    }
}
exports.PackageManagerError = PackageManagerError;
class PackageManagerWebResponseError extends PackageManagerError {
    constructor(socket, message, methodName, pkg = null, innerError = null, errorCode = '') {
        super(message, methodName, pkg, innerError, errorCode);
        this.socket = socket;
        this.message = message;
        this.methodName = methodName;
        this.pkg = pkg;
        this.innerError = innerError;
        this.errorCode = errorCode;
    }
}
exports.PackageManagerWebResponseError = PackageManagerWebResponseError;
class PackageManager {
    constructor(platformInfo, outputChannel, statusItem) {
        this.platformInfo = platformInfo;
        this.outputChannel = outputChannel;
        this.statusItem = statusItem;
        tmp.setGracefulCleanup();
    }
    DownloadPackages() {
        return this.GetPackages()
            .then((packages) => {
            return this.BuildPromiseChain(packages, (pkg) => this.DownloadPackage(pkg));
        });
    }
    InstallPackages() {
        return this.GetPackages()
            .then((packages) => {
            return this.BuildPromiseChain(packages, (pkg) => this.InstallPackage(pkg));
        });
    }
    BuildPromiseChain(items, promiseBuilder) {
        let promiseChain = Promise.resolve(null);
        for (let item of items) {
            promiseChain = promiseChain.then(() => {
                return promiseBuilder(item);
            });
        }
        return promiseChain;
    }
    GetPackageList() {
        return new Promise((resolve, reject) => {
            if (!this.allPackages) {
                if (util.packageJson.runtimeDependencies) {
                    this.allPackages = util.packageJson.runtimeDependencies;
                    for (let pkg of this.allPackages) {
                        if (pkg.binaries) {
                            pkg.binaries = pkg.binaries.map((value) => {
                                return util.getExtensionFilePath(value);
                            });
                        }
                    }
                    resolve(this.allPackages);
                }
                else {
                    reject(new PackageManagerError('Package manifest does not exist', 'GetPackageList'));
                }
            }
            else {
                resolve(this.allPackages);
            }
        });
    }
    GetPackages() {
        return this.GetPackageList()
            .then((list) => {
            return list.filter((value, index, array) => {
                return (!value.architectures || value.architectures.indexOf(this.platformInfo.architecture) !== -1) &&
                    (!value.platforms || value.platforms.indexOf(this.platformInfo.platform) !== -1);
            });
        });
    }
    DownloadPackage(pkg) {
        this.AppendChannel(`Downloading package '${pkg.description}' `);
        this.SetStatusText("$(cloud-download) Downloading packages...");
        this.SetStatusTooltip(`Downloading package '${pkg.description}'...`);
        return new Promise((resolve, reject) => {
            tmp.file({ prefix: "package-" }, (err, path, fd, cleanupCallback) => {
                if (err) {
                    return reject(new PackageManagerError('Error from temp.file', 'DownloadPackage', pkg, err));
                }
                resolve({ name: path, fd: fd, removeCallback: cleanupCallback });
            });
        })
            .then((tmpResult) => {
            pkg.tmpFile = tmpResult;
            let lastError = null;
            let retryCount = 0;
            var handleDownloadFailure = (num, error) => {
                retryCount = num;
                lastError = error;
                this.AppendChannel(` Failed. Retrying...`);
            };
            return this.DownloadFile(pkg.url, pkg, 0).catch((error) => {
                handleDownloadFailure(1, error);
                return this.DownloadFile(pkg.url, pkg, 1).catch((error) => {
                    handleDownloadFailure(2, error);
                    return this.DownloadFile(pkg.url, pkg, 2).catch((error) => {
                        handleDownloadFailure(3, error);
                        return this.DownloadFile(pkg.url, pkg, 3).catch((error) => {
                            handleDownloadFailure(4, error);
                            return this.DownloadFile(pkg.url, pkg, 4).catch((error) => {
                                handleDownloadFailure(5, error);
                                return this.DownloadFile(pkg.url, pkg, 5);
                            });
                        });
                    });
                });
            }).then(() => {
                this.AppendLineChannel(" Done!");
                if (retryCount != 0) {
                    let telemetryProperties = {};
                    telemetryProperties["success"] = `OnRetry${retryCount}`;
                    if (lastError instanceof PackageManagerError) {
                        let packageError = lastError;
                        telemetryProperties['error.methodName'] = packageError.methodName;
                        telemetryProperties['error.message'] = packageError.message;
                        if (packageError.pkg) {
                            telemetryProperties['error.packageName'] = packageError.pkg.description;
                            telemetryProperties['error.packageUrl'] = packageError.pkg.url;
                        }
                        if (packageError.errorCode) {
                            telemetryProperties['error.errorCode'] = packageError.errorCode;
                        }
                    }
                    Telemetry.logDebuggerEvent("acquisition", telemetryProperties);
                }
            });
        });
    }
    DownloadFile(urlString, pkg, delay) {
        let parsedUrl = url.parse(urlString);
        let proxyStrictSSL = vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true);
        let options = {
            host: parsedUrl.host,
            path: parsedUrl.path,
            agent: util.GetHttpsProxyAgent(),
            rejectUnauthorized: proxyStrictSSL
        };
        return new Promise((resolve, reject) => {
            let secondsDelay = Math.pow(2, delay);
            if (secondsDelay == 1)
                secondsDelay = 0;
            if (secondsDelay > 4)
                this.AppendChannel(`Waiting ${secondsDelay} seconds...`);
            setTimeout(() => {
                if (!pkg.tmpFile || pkg.tmpFile.fd == 0) {
                    return reject(new PackageManagerError('Temporary Package file unavailable', 'DownloadFile', pkg));
                }
                var handleHttpResponse = (response) => {
                    if (response.statusCode == 301 || response.statusCode == 302) {
                        let redirectUrl;
                        if (typeof response.headers.location === "string") {
                            redirectUrl = response.headers.location;
                        }
                        else {
                            redirectUrl = response.headers.location[0];
                        }
                        return resolve(this.DownloadFile(redirectUrl, pkg, 0));
                    }
                    else if (response.statusCode != 200) {
                        let errorMessage = `failed (error code '${response.statusCode}')`;
                        return reject(new PackageManagerWebResponseError(response.socket, 'HTTP/HTTPS Response Error', 'DownloadFile', pkg, errorMessage, response.statusCode.toString()));
                    }
                    else {
                        let contentLength = response.headers['content-length'];
                        if (typeof response.headers['content-length'] === "string") {
                            contentLength = response.headers['content-length'];
                        }
                        else {
                            contentLength = response.headers['content-length'][0];
                        }
                        let packageSize = parseInt(contentLength, 10);
                        let downloadedBytes = 0;
                        let downloadPercentage = 0;
                        let dots = 0;
                        let tmpFile = fs.createWriteStream(null, { fd: pkg.tmpFile.fd });
                        this.AppendChannel(`(${Math.ceil(packageSize / 1024)} KB) `);
                        response.on('data', (data) => {
                            downloadedBytes += data.length;
                            let newPercentage = Math.ceil(100 * (downloadedBytes / packageSize));
                            if (newPercentage !== downloadPercentage) {
                                this.SetStatusTooltip(`Downloading package '${pkg.description}'... ${downloadPercentage}%`);
                                downloadPercentage = newPercentage;
                            }
                            let newDots = Math.ceil(downloadPercentage / 5);
                            if (newDots > dots) {
                                this.AppendChannel(".".repeat(newDots - dots));
                                dots = newDots;
                            }
                        });
                        response.on('end', () => {
                            resolve();
                        });
                        response.on('error', (error) => {
                            reject(new PackageManagerWebResponseError(response.socket, 'HTTP/HTTPS Response error', 'DownloadFile', pkg, error.stack, error.name));
                        });
                        response.pipe(tmpFile, { end: false });
                    }
                };
                let request = https.request(options, handleHttpResponse);
                request.on('error', (error) => {
                    reject(new PackageManagerError('HTTP/HTTPS Request error' + (urlString.includes("fwlink") ? ": fwlink" : ""), 'DownloadFile', pkg, error.stack, error.message));
                });
                request.end();
            }, secondsDelay * 1000);
        });
    }
    InstallPackage(pkg) {
        this.AppendLineChannel(`Installing package '${pkg.description}'`);
        this.SetStatusText("$(desktop-download) Installing packages...");
        this.SetStatusTooltip(`Installing package '${pkg.description}'`);
        return new Promise((resolve, reject) => {
            if (!pkg.tmpFile || pkg.tmpFile.fd == 0) {
                return reject(new PackageManagerError('Downloaded file unavailable', 'InstallPackage', pkg));
            }
            yauzl.fromFd(pkg.tmpFile.fd, { lazyEntries: true }, (err, zipfile) => {
                if (err) {
                    return reject(new PackageManagerError('Zip file error', 'InstallPackage', pkg, err));
                }
                zipfile.readEntry();
                zipfile.on('entry', (entry) => {
                    let absoluteEntryPath = util.getExtensionFilePath(entry.fileName);
                    if (entry.fileName.endsWith("/")) {
                        mkdirp.mkdirp(absoluteEntryPath, { mode: 0o775 }, (err) => {
                            if (err) {
                                return reject(new PackageManagerError('Error creating directory', 'InstallPackage', pkg, err, err.code));
                            }
                            zipfile.readEntry();
                        });
                    }
                    else {
                        util.checkFileExists(absoluteEntryPath).then((exists) => {
                            if (!exists) {
                                zipfile.openReadStream(entry, (err, readStream) => {
                                    if (err) {
                                        return reject(new PackageManagerError('Error reading zip stream', 'InstallPackage', pkg, err));
                                    }
                                    mkdirp.mkdirp(path.dirname(absoluteEntryPath), { mode: 0o775 }, (err) => {
                                        if (err) {
                                            return reject(new PackageManagerError('Error creating directory', 'InstallPackage', pkg, err, err.code));
                                        }
                                        let fileMode = (pkg.binaries && pkg.binaries.indexOf(absoluteEntryPath) !== -1) ? 0o755 : 0o664;
                                        let writeStream = fs.createWriteStream(absoluteEntryPath, { mode: fileMode });
                                        readStream.pipe(writeStream);
                                        writeStream.on('close', () => {
                                            zipfile.readEntry();
                                        });
                                    });
                                });
                            }
                            else {
                                if (path.extname(absoluteEntryPath) != ".txt")
                                    this.AppendLineChannel(`Warning: File '${absoluteEntryPath}' already exists and was not updated.`);
                                zipfile.readEntry();
                            }
                        });
                    }
                });
                zipfile.on('end', () => {
                    resolve();
                });
                zipfile.on('error', err => {
                    reject(new PackageManagerError('Zip File Error', 'InstallPackage', pkg, err, err.code));
                });
            });
        })
            .then(() => {
            pkg.tmpFile.removeCallback();
        });
    }
    AppendChannel(text) {
        if (this.outputChannel) {
            this.outputChannel.append(text);
        }
    }
    AppendLineChannel(text) {
        if (this.outputChannel) {
            this.outputChannel.appendLine(text);
        }
    }
    SetStatusText(text) {
        if (this.statusItem) {
            this.statusItem.text = text;
            this.statusItem.show();
        }
    }
    SetStatusTooltip(text) {
        if (this.statusItem) {
            this.statusItem.tooltip = text;
            this.statusItem.show();
        }
    }
}
exports.PackageManager = PackageManager;
//# sourceMappingURL=packageManager.js.map