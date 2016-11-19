// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var pathModule = require("path");
var Q = require("q");
var fileSystem_1 = require("./fileSystem");
var Package = (function () {
    function Package(path, _a) {
        var _b = (_a === void 0 ? {} : _a).fileSystem, fileSystem = _b === void 0 ? new fileSystem_1.FileSystem() : _b;
        this.INFORMATION_PACKAGE_FILENAME = "package.json";
        this.DEPENDENCIES_SUBFOLDER = "node_modules";
        this._path = path;
        this.fileSystem = fileSystem;
    }
    Package.prototype.parsePackageInformation = function () {
        return this.fileSystem.readFile(this.informationJsonFilePath(), "utf8")
            .then(function (data) {
            return JSON.parse(data);
        });
    };
    Package.prototype.name = function () {
        return this.parseProperty("name");
    };
    Package.prototype.dependencies = function () {
        return this.parseProperty("dependencies");
    };
    Package.prototype.version = function () {
        var _this = this;
        return this.parseProperty("version").then(function (version) {
            return typeof version === "string"
                ? version
                : Q.reject("Couldn't parse the version component of the package at " + _this.informationJsonFilePath() + ": version = " + version);
        });
    };
    Package.prototype.setMainFile = function (value) {
        var _this = this;
        return this.parsePackageInformation()
            .then(function (packageInformation) {
            packageInformation.main = value;
            return _this.fileSystem.writeFile(_this.informationJsonFilePath(), JSON.stringify(packageInformation));
        });
    };
    Package.prototype.dependencyPath = function (dependencyName) {
        return pathModule.resolve(this._path, this.DEPENDENCIES_SUBFOLDER, dependencyName);
    };
    Package.prototype.dependencyPackage = function (dependencyName) {
        return new Package(this.dependencyPath(dependencyName), { fileSystem: this.fileSystem });
    };
    Package.prototype.informationJsonFilePath = function () {
        return pathModule.resolve(this._path, this.INFORMATION_PACKAGE_FILENAME);
    };
    Package.prototype.parseProperty = function (name) {
        return this.parsePackageInformation()
            .then(function (packageInformation) {
            return packageInformation[name];
        });
    };
    return Package;
}());
exports.Package = Package;

//# sourceMappingURL=package.js.map
