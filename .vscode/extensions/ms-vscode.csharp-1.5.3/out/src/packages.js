/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fs = require('fs');
var https = require('https');
var mkdirp_1 = require('mkdirp');
var path = require('path');
var tmp = require('tmp');
var url_1 = require('url');
var yauzl = require('yauzl');
var util = require('./common');
var proxy_1 = require('./proxy');
var PackageError = (function (_super) {
    __extends(PackageError, _super);
    // Do not put PII (personally identifiable information) in the 'message' field as it will be logged to telemetry
    function PackageError(message, pkg, innerError) {
        if (pkg === void 0) { pkg = null; }
        if (innerError === void 0) { innerError = null; }
        _super.call(this, message);
        this.message = message;
        this.pkg = pkg;
        this.innerError = innerError;
    }
    return PackageError;
}(Error));
exports.PackageError = PackageError;
var PackageManager = (function () {
    function PackageManager(platformInfo, packageJSON) {
        this.platformInfo = platformInfo;
        this.packageJSON = packageJSON;
        // Ensure our temp files get cleaned up in case of error.
        tmp.setGracefulCleanup();
    }
    PackageManager.prototype.DownloadPackages = function (logger, status, proxy, strictSSL) {
        return this.GetPackages()
            .then(function (packages) {
            return util.buildPromiseChain(packages, function (pkg) { return downloadPackage(pkg, logger, status, proxy, strictSSL); });
        });
    };
    PackageManager.prototype.InstallPackages = function (logger, status) {
        return this.GetPackages()
            .then(function (packages) {
            return util.buildPromiseChain(packages, function (pkg) { return installPackage(pkg, logger, status); });
        });
    };
    PackageManager.prototype.GetAllPackages = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.allPackages) {
                resolve(_this.allPackages);
            }
            else if (_this.packageJSON.runtimeDependencies) {
                _this.allPackages = _this.packageJSON.runtimeDependencies;
                // Convert relative binary paths to absolute
                var _loop_1 = function(pkg) {
                    if (pkg.binaries) {
                        pkg.binaries = pkg.binaries.map(function (value) { return path.resolve(getBaseInstallPath(pkg), value); });
                    }
                };
                for (var _i = 0, _a = _this.allPackages; _i < _a.length; _i++) {
                    var pkg = _a[_i];
                    _loop_1(pkg);
                }
                resolve(_this.allPackages);
            }
            else {
                reject(new PackageError("Package manifest does not exist."));
            }
        });
    };
    PackageManager.prototype.GetPackages = function () {
        var _this = this;
        return this.GetAllPackages()
            .then(function (list) {
            return list.filter(function (pkg) {
                if (pkg.runtimeIds) {
                    if (!_this.platformInfo.runtimeId || pkg.runtimeIds.indexOf(_this.platformInfo.runtimeId) === -1) {
                        return false;
                    }
                }
                if (pkg.architectures && pkg.architectures.indexOf(_this.platformInfo.architecture) === -1) {
                    return false;
                }
                if (pkg.platforms && pkg.platforms.indexOf(_this.platformInfo.platform) === -1) {
                    return false;
                }
                return true;
            });
        });
    };
    return PackageManager;
}());
exports.PackageManager = PackageManager;
function getBaseInstallPath(pkg) {
    var basePath = util.getExtensionPath();
    if (pkg.installPath) {
        basePath = path.join(basePath, pkg.installPath);
    }
    return basePath;
}
function getNoopStatus() {
    return {
        setMessage: function (text) { },
        setDetail: function (text) { }
    };
}
function downloadPackage(pkg, logger, status, proxy, strictSSL) {
    status = status || getNoopStatus();
    logger.append("Downloading package '" + pkg.description + "' ");
    status.setMessage("$(cloud-download) Downloading packages");
    status.setDetail("Downloading package '" + pkg.description + "'...");
    return new Promise(function (resolve, reject) {
        tmp.file({ prefix: 'package-' }, function (err, path, fd, cleanupCallback) {
            if (err) {
                return reject(new PackageError('Error from tmp.file', pkg, err));
            }
            resolve({ name: path, fd: fd, removeCallback: cleanupCallback });
        });
    }).then(function (tmpResult) {
        pkg.tmpFile = tmpResult;
        var result = downloadFile(pkg.url, pkg, logger, status, proxy, strictSSL)
            .then(function () { return logger.appendLine(' Done!'); });
        // If the package has a fallback Url, and downloading from the primary Url failed, try again from 
        // the fallback. This is used for debugger packages as some users have had issues downloading from
        // the CDN link.
        if (pkg.fallbackUrl) {
            result = result.catch(function (primaryUrlError) {
                logger.append("\tRetrying from '" + pkg.fallbackUrl + "' ");
                return downloadFile(pkg.fallbackUrl, pkg, logger, status, proxy, strictSSL)
                    .then(function () { return logger.appendLine(' Done!'); })
                    .catch(function () { return primaryUrlError; });
            });
        }
        return result;
    });
}
function downloadFile(urlString, pkg, logger, status, proxy, strictSSL) {
    var url = url_1.parse(urlString);
    var options = {
        host: url.host,
        path: url.path,
        agent: proxy_1.getProxyAgent(url, proxy, strictSSL),
        rejectUnauthorized: util.isBoolean(strictSSL) ? strictSSL : true
    };
    return new Promise(function (resolve, reject) {
        if (!pkg.tmpFile || pkg.tmpFile.fd == 0) {
            return reject(new PackageError("Temporary package file unavailable", pkg));
        }
        var request = https.request(options, function (response) {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Redirect - download from new location
                return resolve(downloadFile(response.headers.location, pkg, logger, status, proxy, strictSSL));
            }
            if (response.statusCode != 200) {
                // Download failed - print error message
                logger.appendLine("failed (error code '" + response.statusCode + "')");
                return reject(new PackageError(response.statusCode.toString(), pkg));
            }
            // Downloading - hook up events
            var packageSize = parseInt(response.headers['content-length'], 10);
            var downloadedBytes = 0;
            var downloadPercentage = 0;
            var dots = 0;
            var tmpFile = fs.createWriteStream(null, { fd: pkg.tmpFile.fd });
            logger.append("(" + Math.ceil(packageSize / 1024) + " KB) ");
            response.on('data', function (data) {
                downloadedBytes += data.length;
                // Update status bar item with percentage
                var newPercentage = Math.ceil(100 * (downloadedBytes / packageSize));
                if (newPercentage !== downloadPercentage) {
                    status.setDetail("Downloading package '" + pkg.description + "'... " + downloadPercentage + "%");
                    downloadPercentage = newPercentage;
                }
                // Update dots after package name in output console
                var newDots = Math.ceil(downloadPercentage / 5);
                if (newDots > dots) {
                    logger.append('.'.repeat(newDots - dots));
                    dots = newDots;
                }
            });
            response.on('end', function () {
                resolve();
            });
            response.on('error', function (err) {
                reject(new PackageError("Reponse error: " + (err.code || 'NONE'), pkg, err));
            });
            // Begin piping data from the response to the package file
            response.pipe(tmpFile, { end: false });
        });
        request.on('error', function (error) {
            reject(new PackageError("Request error: " + (error.code || 'NONE'), pkg, error));
        });
        // Execute the request
        request.end();
    });
}
function installPackage(pkg, logger, status) {
    status = status || getNoopStatus();
    logger.appendLine("Installing package '" + pkg.description + "'");
    status.setMessage("$(desktop-download) Installing packages...");
    status.setDetail("Installing package '" + pkg.description + "'");
    return new Promise(function (resolve, reject) {
        if (!pkg.tmpFile || pkg.tmpFile.fd == 0) {
            return reject(new PackageError('Downloaded file unavailable', pkg));
        }
        yauzl.fromFd(pkg.tmpFile.fd, { lazyEntries: true }, function (err, zipFile) {
            if (err) {
                return reject(new PackageError('Immediate zip file error', pkg, err));
            }
            zipFile.readEntry();
            zipFile.on('entry', function (entry) {
                var absoluteEntryPath = path.resolve(getBaseInstallPath(pkg), entry.fileName);
                if (entry.fileName.endsWith('/')) {
                    // Directory - create it
                    mkdirp_1.mkdirp(absoluteEntryPath, { mode: 509 }, function (err) {
                        if (err) {
                            return reject(new PackageError('Error creating directory for zip directory entry:' + err.code || '', pkg, err));
                        }
                        zipFile.readEntry();
                    });
                }
                else {
                    // File - extract it
                    zipFile.openReadStream(entry, function (err, readStream) {
                        if (err) {
                            return reject(new PackageError('Error reading zip stream', pkg, err));
                        }
                        mkdirp_1.mkdirp(path.dirname(absoluteEntryPath), { mode: 509 }, function (err) {
                            if (err) {
                                return reject(new PackageError('Error creating directory for zip file entry', pkg, err));
                            }
                            // Make sure executable files have correct permissions when extracted
                            var fileMode = pkg.binaries && pkg.binaries.indexOf(absoluteEntryPath) !== -1
                                ? 493
                                : 436;
                            readStream.pipe(fs.createWriteStream(absoluteEntryPath, { mode: fileMode }));
                            readStream.on('end', function () { return zipFile.readEntry(); });
                        });
                    });
                }
            });
            zipFile.on('end', function () {
                resolve();
            });
            zipFile.on('error', function (err) {
                reject(new PackageError('Zip File Error:' + err.code || '', pkg, err));
            });
        });
    }).then(function () {
        // Clean up temp file
        pkg.tmpFile.removeCallback();
    });
}
//# sourceMappingURL=packages.js.map