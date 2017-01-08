// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var fileSystem_1 = require("../../common/node/fileSystem");
var Q = require("q");
var path = require("path");
var PackageNameResolver = (function () {
    function PackageNameResolver(applicationName) {
        this.applicationName = applicationName;
    }
    /**
     * Tries to find the package name in AndroidManifest.xml. If not found, it returns the default package name,
     * which is the application name prefixed with the default prefix.
     */
    PackageNameResolver.prototype.resolvePackageName = function (projectRoot) {
        var expectedAndroidManifestPath = path.join.apply(this, [projectRoot].concat(PackageNameResolver.DefaultManifestLocation));
        return this.readPackageName(expectedAndroidManifestPath);
    };
    /**
     * Given a manifest file path, it parses the file and returns the package name.
     * If the package name cannot be parsed, the default packge name is returned.
     */
    PackageNameResolver.prototype.readPackageName = function (manifestPath) {
        var _this = this;
        if (manifestPath) {
            var fs_1 = new fileSystem_1.FileSystem();
            return fs_1.exists(manifestPath).then(function (exists) {
                if (exists) {
                    return fs_1.readFile(manifestPath)
                        .then(function (manifestContent) {
                        var packageName = _this.parsePackageName(manifestContent);
                        if (!packageName) {
                            packageName = _this.getDefaultPackageName(_this.applicationName);
                        }
                        return packageName;
                    });
                }
                else {
                    return _this.getDefaultPackageName(_this.applicationName);
                }
            });
        }
        else {
            return Q.resolve(this.getDefaultPackageName(this.applicationName));
        }
    };
    /**
     * Gets the default package name, based on the application name.
     */
    PackageNameResolver.prototype.getDefaultPackageName = function (applicationName) {
        return (PackageNameResolver.DefaultPackagePrefix + applicationName).toLowerCase();
    };
    /**
     * Parses the application package name from the contents of an Android manifest file.
     * If a match was found, it is returned. Otherwise null is returned.
     */
    PackageNameResolver.prototype.parsePackageName = function (manifestContents) {
        // first we remove all the comments from the file
        var match = manifestContents.match(PackageNameResolver.PackageNameRegexp);
        return match ? match[1] : null;
    };
    PackageNameResolver.PackageNameRegexp = /package="(.+?)"/;
    PackageNameResolver.ManifestName = "AndroidManifest.xml";
    PackageNameResolver.DefaultPackagePrefix = "com.";
    PackageNameResolver.SourceRootRelPath = ["android", "app", "src", "main"];
    PackageNameResolver.DefaultManifestLocation = PackageNameResolver.SourceRootRelPath.concat(PackageNameResolver.ManifestName);
    return PackageNameResolver;
}());
exports.PackageNameResolver = PackageNameResolver;

//# sourceMappingURL=packageNameResolver.js.map
