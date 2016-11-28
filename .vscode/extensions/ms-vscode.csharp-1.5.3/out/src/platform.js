/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var fs = require('fs');
var os = require('os');
var util = require('./common');
var unknown = 'unknown';
/**
 * There is no standard way on Linux to find the distribution name and version.
 * Recently, systemd has pushed to standardize the os-release file. This has
 * seen adoption in "recent" versions of all major distributions.
 * https://www.freedesktop.org/software/systemd/man/os-release.html
 */
var LinuxDistribution = (function () {
    function LinuxDistribution(name, version, idLike) {
        this.name = name;
        this.version = version;
        this.idLike = idLike;
    }
    LinuxDistribution.GetCurrent = function () {
        // Try /etc/os-release and fallback to /usr/lib/os-release per the synopsis
        // at https://www.freedesktop.org/software/systemd/man/os-release.html.
        return LinuxDistribution.FromFilePath('/etc/os-release')
            .catch(function () { return LinuxDistribution.FromFilePath('/usr/lib/os-release'); })
            .catch(function () { return Promise.resolve(new LinuxDistribution(unknown, unknown)); });
    };
    LinuxDistribution.prototype.toString = function () {
        return "name=" + this.name + ", version=" + this.version;
    };
    LinuxDistribution.FromFilePath = function (filePath) {
        return new Promise(function (resolve, reject) {
            fs.readFile(filePath, 'utf8', function (error, data) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(LinuxDistribution.FromReleaseInfo(data));
                }
            });
        });
    };
    LinuxDistribution.FromReleaseInfo = function (releaseInfo, eol) {
        if (eol === void 0) { eol = os.EOL; }
        var name = unknown;
        var version = unknown;
        var idLike = null;
        var lines = releaseInfo.split(eol);
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            line = line.trim();
            var equalsIndex = line.indexOf('=');
            if (equalsIndex >= 0) {
                var key = line.substring(0, equalsIndex);
                var value = line.substring(equalsIndex + 1);
                // Strip double quotes if necessary
                if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                if (key === 'ID') {
                    name = value;
                }
                else if (key === 'VERSION_ID') {
                    version = value;
                }
                else if (key === 'ID_LIKE') {
                    idLike = value.split(" ");
                }
                if (name !== unknown && version !== unknown && idLike !== null) {
                    break;
                }
            }
        }
        return new LinuxDistribution(name, version, idLike);
    };
    return LinuxDistribution;
}());
exports.LinuxDistribution = LinuxDistribution;
var PlatformInformation = (function () {
    function PlatformInformation(platform, architecture, distribution) {
        if (distribution === void 0) { distribution = null; }
        this.platform = platform;
        this.architecture = architecture;
        this.distribution = distribution;
        try {
            this.runtimeId = PlatformInformation.getRuntimeId(platform, architecture, distribution);
        }
        catch (err) {
            this.runtimeId = null;
        }
    }
    PlatformInformation.prototype.isWindows = function () {
        return this.platform === 'win32';
    };
    PlatformInformation.prototype.isMacOS = function () {
        return this.platform === 'darwin';
    };
    PlatformInformation.prototype.isLinux = function () {
        return this.platform === 'linux';
    };
    PlatformInformation.prototype.toString = function () {
        var result = this.platform;
        if (this.architecture) {
            if (result) {
                result += ', ';
            }
            result += this.architecture;
        }
        if (this.distribution) {
            if (result) {
                result += ', ';
            }
            result += this.distribution.toString();
        }
        return result;
    };
    PlatformInformation.GetCurrent = function () {
        var platform = os.platform();
        var architecturePromise;
        var distributionPromise;
        switch (platform) {
            case 'win32':
                architecturePromise = PlatformInformation.GetWindowsArchitecture();
                distributionPromise = Promise.resolve(null);
                break;
            case 'darwin':
                architecturePromise = PlatformInformation.GetUnixArchitecture();
                distributionPromise = Promise.resolve(null);
                break;
            case 'linux':
                architecturePromise = PlatformInformation.GetUnixArchitecture();
                distributionPromise = LinuxDistribution.GetCurrent();
                break;
            default:
                throw new Error("Unsupported platform: " + platform);
        }
        return Promise.all([architecturePromise, distributionPromise])
            .then(function (_a) {
            var arch = _a[0], distro = _a[1];
            return new PlatformInformation(platform, arch, distro);
        });
    };
    PlatformInformation.GetWindowsArchitecture = function () {
        return util.execChildProcess('wmic os get osarchitecture')
            .then(function (architecture) {
            if (architecture) {
                var archArray = architecture.split(os.EOL);
                if (archArray.length >= 2) {
                    var arch = archArray[1].trim();
                    // Note: This string can be localized. So, we'll just check to see if it contains 32 or 64.
                    if (arch.indexOf('64') >= 0) {
                        return "x86_64";
                    }
                    else if (arch.indexOf('32') >= 0) {
                        return "x86";
                    }
                }
            }
            return unknown;
        }).catch(function (error) {
            return unknown;
        });
    };
    PlatformInformation.GetUnixArchitecture = function () {
        return util.execChildProcess('uname -m')
            .then(function (architecture) {
            if (architecture) {
                return architecture.trim();
            }
            return null;
        });
    };
    /**
     * Returns a supported .NET Core Runtime ID (RID) for the current platform. The list of Runtime IDs
     * is available at https://github.com/dotnet/corefx/tree/master/pkg/Microsoft.NETCore.Platforms.
     */
    PlatformInformation.getRuntimeId = function (platform, architecture, distribution) {
        // Note: We could do much better here. Currently, we only return a limited number of RIDs that
        // are officially supported.
        switch (platform) {
            case 'win32':
                switch (architecture) {
                    case 'x86': return 'win7-x86';
                    case 'x86_64': return 'win7-x64';
                }
                throw new Error("Unsupported Windows architecture: " + architecture);
            case 'darwin':
                if (architecture === 'x86_64') {
                    // Note: We return the El Capitan RID for Sierra
                    return 'osx.10.11-x64';
                }
                throw new Error("Unsupported macOS architecture: " + architecture);
            case 'linux':
                if (architecture === 'x86_64') {
                    var unknown_distribution = 'unknown_distribution';
                    var unknown_version = 'unknown_version';
                    // First try the distribution name
                    var runtimeId = PlatformInformation.getRuntimeIdHelper(distribution.name, distribution.version);
                    // If the distribution isn't one that we understand, but the 'ID_LIKE' field has something that we understand, use that
                    //
                    // NOTE: 'ID_LIKE' doesn't specify the version of the 'like' OS. So we will use the 'VERSION_ID' value. This will restrict
                    // how useful ID_LIKE will be since it requires the version numbers to match up, but it is the best we can do.
                    if (runtimeId === unknown_distribution && distribution.idLike && distribution.idLike.length > 0) {
                        for (var _i = 0, _a = distribution.idLike; _i < _a.length; _i++) {
                            var id = _a[_i];
                            runtimeId = PlatformInformation.getRuntimeIdHelper(id, distribution.version);
                            if (runtimeId !== unknown_distribution) {
                                break;
                            }
                        }
                    }
                    if (runtimeId !== unknown_distribution && runtimeId !== unknown_version) {
                        return runtimeId;
                    }
                }
                // If we got here, this is not a Linux distro or architecture that we currently support.
                throw new Error("Unsupported Linux distro: " + distribution.name + ", " + distribution.version + ", " + architecture);
        }
        // If we got here, we've ended up with a platform we don't support  like 'freebsd' or 'sunos'.
        // Chances are, VS Code doesn't support these platforms either.
        throw Error('Unsupported platform ' + platform);
    };
    PlatformInformation.getRuntimeIdHelper = function (distributionName, distributionVersion) {
        var unknown_distribution = 'unknown_distribution';
        var unknown_version = 'unknown_version';
        var centos_7 = 'centos.7-x64';
        var debian_8 = 'debian.8-x64';
        var fedora_23 = 'fedora.23-x64';
        var opensuse_13_2 = 'opensuse.13.2-x64';
        var rhel_7 = 'rhel.7-x64';
        var ubuntu_14_04 = 'ubuntu.14.04-x64';
        var ubuntu_16_04 = 'ubuntu.16.04-x64';
        switch (distributionName) {
            case 'ubuntu':
                if (distributionVersion.startsWith("14")) {
                    // This also works for Linux Mint
                    return ubuntu_14_04;
                }
                else if (distributionVersion.startsWith("16")) {
                    return ubuntu_16_04;
                }
                break;
            case 'elementary':
            case 'elementary OS':
                if (distributionVersion.startsWith("0.3")) {
                    // Elementary OS 0.3 Freya is binary compatible with Ubuntu 14.04
                    return ubuntu_14_04;
                }
                else if (distributionVersion.startsWith("0.4")) {
                    // Elementary OS 0.4 Loki is binary compatible with Ubuntu 16.04
                    return ubuntu_16_04;
                }
                break;
            case 'linuxmint':
                if (distributionVersion.startsWith("18")) {
                    // Linux Mint 18 is binary compatible with Ubuntu 16.04
                    return ubuntu_16_04;
                }
                break;
            case 'centos':
            case 'ol':
                // Oracle Linux is binary compatible with CentOS
                return centos_7;
            case 'fedora':
                return fedora_23;
            case 'opensuse':
                return opensuse_13_2;
            case 'rhel':
                return rhel_7;
            case 'debian':
                return debian_8;
            case 'galliumos':
                if (distributionVersion.startsWith("2.0")) {
                    return ubuntu_16_04;
                }
                break;
            default:
                return unknown_distribution;
        }
        return unknown_version;
    };
    return PlatformInformation;
}());
exports.PlatformInformation = PlatformInformation;
//# sourceMappingURL=platform.js.map