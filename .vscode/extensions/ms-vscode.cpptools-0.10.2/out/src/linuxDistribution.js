"use strict";
var fs = require('fs');
var os = require('os');
var LinuxDistribution = (function () {
    function LinuxDistribution(name, version) {
        this.name = name;
        this.version = version;
    }
    LinuxDistribution.GetDistroInformation = function () {
        var linuxDistro;
        linuxDistro = LinuxDistribution.getDistroInformationFromFile('/etc/os-release')
            .catch(function () {
            return LinuxDistribution.getDistroInformationFromFile('/usr/lib/os-release');
        }).catch(function () {
            return Promise.resolve(new LinuxDistribution('unknown', 'unknown'));
        });
        return linuxDistro;
    };
    LinuxDistribution.getDistroInformationFromFile = function (path) {
        return new Promise(function (resolve, reject) {
            fs.readFile(path, 'utf8', function (error, data) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(LinuxDistribution.getDistroInformation(data));
            });
        });
    };
    LinuxDistribution.getDistroInformation = function (data) {
        var idKey = 'ID';
        var versionKey = 'VERSION_ID';
        var distroName = 'unknown';
        var distroVersion = 'unknown';
        var keyValues = data.split(os.EOL);
        for (var i = 0; i < keyValues.length; i++) {
            var keyValue = keyValues[i].split('=');
            if (keyValue.length == 2) {
                if (keyValue[0] === idKey) {
                    distroName = keyValue[1];
                }
                else if (keyValue[0] === versionKey) {
                    distroVersion = keyValue[1];
                }
            }
        }
        return new LinuxDistribution(distroName, distroVersion);
    };
    return LinuxDistribution;
}());
exports.LinuxDistribution = LinuxDistribution;
//# sourceMappingURL=linuxDistribution.js.map