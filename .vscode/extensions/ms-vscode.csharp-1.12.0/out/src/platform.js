"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const util = require("./common");
const unknown = 'unknown';
/**
 * There is no standard way on Linux to find the distribution name and version.
 * Recently, systemd has pushed to standardize the os-release file. This has
 * seen adoption in "recent" versions of all major distributions.
 * https://www.freedesktop.org/software/systemd/man/os-release.html
 */
class LinuxDistribution {
    constructor(name, version, idLike) {
        this.name = name;
        this.version = version;
        this.idLike = idLike;
    }
    static GetCurrent() {
        // Try /etc/os-release and fallback to /usr/lib/os-release per the synopsis
        // at https://www.freedesktop.org/software/systemd/man/os-release.html.
        return LinuxDistribution.FromFilePath('/etc/os-release')
            .catch(() => LinuxDistribution.FromFilePath('/usr/lib/os-release'))
            .catch(() => Promise.resolve(new LinuxDistribution(unknown, unknown)));
    }
    toString() {
        return `name=${this.name}, version=${this.version}`;
    }
    static FromFilePath(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(LinuxDistribution.FromReleaseInfo(data));
                }
            });
        });
    }
    static FromReleaseInfo(releaseInfo, eol = os.EOL) {
        let name = unknown;
        let version = unknown;
        let idLike = null;
        const lines = releaseInfo.split(eol);
        for (let line of lines) {
            line = line.trim();
            let equalsIndex = line.indexOf('=');
            if (equalsIndex >= 0) {
                let key = line.substring(0, equalsIndex);
                let value = line.substring(equalsIndex + 1);
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
    }
}
exports.LinuxDistribution = LinuxDistribution;
class PlatformInformation {
    constructor(platform, architecture, distribution = null) {
        this.platform = platform;
        this.architecture = architecture;
        this.distribution = distribution;
    }
    isWindows() {
        return this.platform === 'win32';
    }
    isMacOS() {
        return this.platform === 'darwin';
    }
    isLinux() {
        return this.platform === 'linux';
    }
    toString() {
        let result = this.platform;
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
    }
    static GetCurrent() {
        let platform = os.platform();
        let architecturePromise;
        let distributionPromise;
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
                throw new Error(`Unsupported platform: ${platform}`);
        }
        return Promise.all([architecturePromise, distributionPromise])
            .then(([arch, distro]) => {
            return new PlatformInformation(platform, arch, distro);
        });
    }
    static GetWindowsArchitecture() {
        return new Promise((resolve, reject) => {
            if (process.env.PROCESSOR_ARCHITECTURE === 'x86' && process.env.PROCESSOR_ARCHITEW6432 === undefined) {
                resolve('x86');
            }
            else {
                resolve('x86_64');
            }
        });
    }
    static GetUnixArchitecture() {
        return util.execChildProcess('uname -m')
            .then(architecture => {
            if (architecture) {
                return architecture.trim();
            }
            return null;
        });
    }
}
exports.PlatformInformation = PlatformInformation;
//# sourceMappingURL=platform.js.map