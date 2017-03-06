"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fs = require('fs');
var https = require('https');
var path = require('path');
var vscode = require('vscode');
var url = require('url');
var tmp = require('tmp');
var yauzl = require('yauzl');
var mkdirp = require('mkdirp');
var util = require('./common');
var HttpsProxyAgent = require('https-proxy-agent');
var PackageManagerError = (function (_super) {
    __extends(PackageManagerError, _super);
    function PackageManagerError(message, methodName, pkg, innerError, errorCode) {
        if (pkg === void 0) { pkg = null; }
        if (innerError === void 0) { innerError = null; }
        if (errorCode === void 0) { errorCode = ''; }
        _super.call(this, message);
        this.message = message;
        this.methodName = methodName;
        this.pkg = pkg;
        this.innerError = innerError;
        this.errorCode = errorCode;
    }
    return PackageManagerError;
}(Error));
exports.PackageManagerError = PackageManagerError;
var PackageManagerWebResponseError = (function (_super) {
    __extends(PackageManagerWebResponseError, _super);
    function PackageManagerWebResponseError(socket, message, methodName, pkg, innerError, errorCode) {
        if (pkg === void 0) { pkg = null; }
        if (innerError === void 0) { innerError = null; }
        if (errorCode === void 0) { errorCode = ''; }
        _super.call(this, message, methodName, pkg, innerError, errorCode);
        this.socket = socket;
        this.message = message;
        this.methodName = methodName;
        this.pkg = pkg;
        this.innerError = innerError;
        this.errorCode = errorCode;
    }
    return PackageManagerWebResponseError;
}(PackageManagerError));
exports.PackageManagerWebResponseError = PackageManagerWebResponseError;
var PackageManager = (function () {
    function PackageManager(platformInfo, outputChannel, statusItem) {
        this.platformInfo = platformInfo;
        this.outputChannel = outputChannel;
        this.statusItem = statusItem;
        tmp.setGracefulCleanup();
    }
    PackageManager.prototype.DownloadPackages = function () {
        var _this = this;
        return this.GetPackages()
            .then(function (packages) {
            return _this.BuildPromiseChain(packages, function (pkg) { return _this.DownloadPackage(pkg); });
        });
    };
    PackageManager.prototype.InstallPackages = function () {
        var _this = this;
        return this.GetPackages()
            .then(function (packages) {
            return _this.BuildPromiseChain(packages, function (pkg) { return _this.InstallPackage(pkg); });
        });
    };
    PackageManager.prototype.BuildPromiseChain = function (items, promiseBuilder) {
        var promiseChain = Promise.resolve(null);
        var _loop_1 = function(item) {
            promiseChain = promiseChain.then(function () {
                return promiseBuilder(item);
            });
        };
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            _loop_1(item);
        }
        return promiseChain;
    };
    PackageManager.prototype.GetPackageList = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.allPackages) {
                var extensionId = "ms-vscode.cpptools";
                var extension = vscode.extensions.getExtension(extensionId);
                if (extension.packageJSON.runtimeDependencies) {
                    _this.allPackages = extension.packageJSON.runtimeDependencies;
                    for (var _i = 0, _a = _this.allPackages; _i < _a.length; _i++) {
                        var pkg = _a[_i];
                        if (pkg.binaries) {
                            pkg.binaries = pkg.binaries.map(function (value) {
                                return path.resolve(util.getExtensionPath(), value);
                            });
                        }
                    }
                    resolve(_this.allPackages);
                }
                else {
                    reject(new PackageManagerError('Package manifest does not exist', 'GetPackageList'));
                }
            }
            else {
                resolve(_this.allPackages);
            }
        });
    };
    PackageManager.prototype.GetPackages = function () {
        var _this = this;
        return this.GetPackageList()
            .then(function (list) {
            return list.filter(function (value, index, array) {
                return (!value.architectures || value.architectures.indexOf(_this.platformInfo.architecture) !== -1) &&
                    (!value.platforms || value.platforms.indexOf(_this.platformInfo.platform) !== -1);
            });
        });
    };
    PackageManager.prototype.DownloadPackage = function (pkg) {
        var _this = this;
        this.AppendChannel("Downloading package '" + pkg.description + "' ");
        this.SetStatusText("$(cloud-download) Downloading packages...");
        this.SetStatusTooltip("Downloading package '" + pkg.description + "'...");
        return new Promise(function (resolve, reject) {
            tmp.file({ prefix: "package-" }, function (err, path, fd, cleanupCallback) {
                if (err) {
                    return reject(new PackageManagerError('Error from temp.file', 'DownloadPackage', pkg, err));
                }
                resolve({ name: path, fd: fd, removeCallback: cleanupCallback });
            });
        })
            .then(function (tmpResult) {
            pkg.tmpFile = tmpResult;
            return _this.DownloadFile(pkg.url, pkg)
                .then(function () {
                _this.AppendLineChannel(" Done!");
            });
        });
    };
    PackageManager.prototype.DownloadFile = function (urlString, pkg) {
        var _this = this;
        var parsedUrl = url.parse(urlString);
        var proxyStrictSSL = vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true);
        var options = {
            host: parsedUrl.host,
            path: parsedUrl.path,
            agent: this.GetHttpsProxyAgent(),
            rejectUnauthorized: proxyStrictSSL
        };
        return new Promise(function (resolve, reject) {
            if (!pkg.tmpFile || pkg.tmpFile.fd == 0) {
                return reject(new PackageManagerError('Temporary Package file unavailable', 'DownloadFile', pkg));
            }
            var request = https.request(options, function (response) {
                if (response.statusCode == 301 || response.statusCode == 302) {
                    return resolve(_this.DownloadFile(response.headers.location, pkg));
                }
                else if (response.statusCode != 200) {
                    var errorMessage = "failed (error code '" + response.statusCode + "')";
                    return reject(new PackageManagerWebResponseError(response.socket, 'HTTP/HTTPS Response Error', 'DownloadFile', pkg, errorMessage, response.statusCode.toString()));
                }
                else {
                    var packageSize_1 = parseInt(response.headers['content-length'], 10);
                    var downloadedBytes_1 = 0;
                    var downloadPercentage_1 = 0;
                    var dots_1 = 0;
                    var tmpFile = fs.createWriteStream(null, { fd: pkg.tmpFile.fd });
                    _this.AppendChannel("(" + Math.ceil(packageSize_1 / 1024) + " KB) ");
                    response.on('data', function (data) {
                        downloadedBytes_1 += data.length;
                        var newPercentage = Math.ceil(100 * (downloadedBytes_1 / packageSize_1));
                        if (newPercentage !== downloadPercentage_1) {
                            _this.SetStatusTooltip("Downloading package '" + pkg.description + "'... " + downloadPercentage_1 + "%");
                            downloadPercentage_1 = newPercentage;
                        }
                        var newDots = Math.ceil(downloadPercentage_1 / 5);
                        if (newDots > dots_1) {
                            _this.AppendChannel(".".repeat(newDots - dots_1));
                            dots_1 = newDots;
                        }
                    });
                    response.on('end', function () {
                        resolve();
                    });
                    response.on('error', function (error) {
                        reject(new PackageManagerWebResponseError(response.socket, 'HTTP/HTTPS Response error', 'DownloadFile', pkg, error, error.code));
                    });
                    response.pipe(tmpFile, { end: false });
                }
            });
            request.on('error', function (error) {
                reject(new PackageManagerError('HTTP/HTTPS Request error', 'DownloadFile', pkg, error, error.code));
            });
            request.end();
        });
    };
    PackageManager.prototype.GetHttpsProxyAgent = function () {
        var proxy = vscode.workspace.getConfiguration().get('http.proxy');
        if (!proxy) {
            proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
            if (!proxy) {
                return null;
            }
        }
        var proxyUrl = url.parse(proxy);
        if (proxyUrl.protocol !== "https:" && proxyUrl.protocol !== "http:") {
            return null;
        }
        var strictProxy = vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true);
        var proxyOptions = {
            host: proxyUrl.hostname,
            port: parseInt(proxyUrl.port, 10),
            auth: proxyUrl.auth,
            rejectUnauthorized: strictProxy
        };
        return new HttpsProxyAgent(proxyOptions);
    };
    PackageManager.prototype.InstallPackage = function (pkg) {
        var _this = this;
        this.AppendLineChannel("Installing package '" + pkg.description + "'");
        this.SetStatusText("$(desktop-download) Installing packages...");
        this.SetStatusTooltip("Installing package '" + pkg.description + "'");
        return new Promise(function (resolve, reject) {
            if (!pkg.tmpFile || pkg.tmpFile.fd == 0) {
                return reject(new PackageManagerError('Downloaded file unavailable', 'InstallPackage', pkg));
            }
            yauzl.fromFd(pkg.tmpFile.fd, { lazyEntries: true }, function (err, zipfile) {
                if (err) {
                    return reject(new PackageManagerError('Zip file error', 'InstallPackage', pkg, err));
                }
                zipfile.readEntry();
                zipfile.on('entry', function (entry) {
                    var absoluteEntryPath = path.resolve(util.getExtensionPath(), entry.fileName);
                    if (entry.fileName.endsWith("/")) {
                        mkdirp.mkdirp(absoluteEntryPath, { mode: 509 }, function (err) {
                            if (err) {
                                return reject(new PackageManagerError('Error creating directory', 'InstallPackage', pkg, err, err.code));
                            }
                            zipfile.readEntry();
                        });
                    }
                    else {
                        util.checkFileExists(absoluteEntryPath).then(function (exists) {
                            if (!exists) {
                                zipfile.openReadStream(entry, function (err, readStream) {
                                    if (err) {
                                        return reject(new PackageManagerError('Error reading zip stream', 'InstallPackage', pkg, err));
                                    }
                                    mkdirp.mkdirp(path.dirname(absoluteEntryPath), { mode: 509 }, function (err) {
                                        if (err) {
                                            return reject(new PackageManagerError('Error creating directory', 'InstallPackage', pkg, err, err.code));
                                        }
                                        var fileMode = (pkg.binaries && pkg.binaries.indexOf(absoluteEntryPath) !== -1) ? 493 : 436;
                                        var writeStream = fs.createWriteStream(absoluteEntryPath, { mode: fileMode });
                                        readStream.pipe(writeStream);
                                        writeStream.on('close', function () {
                                            zipfile.readEntry();
                                        });
                                    });
                                });
                            }
                            else {
                                if (path.extname(absoluteEntryPath) != ".txt")
                                    _this.AppendLineChannel("Warning: File '" + absoluteEntryPath + "' already exists and was not updated.");
                                zipfile.readEntry();
                            }
                        });
                    }
                });
                zipfile.on('end', function () {
                    resolve();
                });
                zipfile.on('error', function (err) {
                    reject(new PackageManagerError('Zip File Error', 'InstallPackage', pkg, err, err.code));
                });
            });
        })
            .then(function () {
            pkg.tmpFile.removeCallback();
        });
    };
    PackageManager.prototype.AppendChannel = function (text) {
        if (this.outputChannel) {
            this.outputChannel.append(text);
        }
    };
    PackageManager.prototype.AppendLineChannel = function (text) {
        if (this.outputChannel) {
            this.outputChannel.appendLine(text);
        }
    };
    PackageManager.prototype.SetStatusText = function (text) {
        if (this.statusItem) {
            this.statusItem.text = text;
            this.statusItem.show();
        }
    };
    PackageManager.prototype.SetStatusTooltip = function (text) {
        if (this.statusItem) {
            this.statusItem.tooltip = text;
            this.statusItem.show();
        }
    };
    return PackageManager;
}());
exports.PackageManager = PackageManager;
//# sourceMappingURL=packageManager.js.map