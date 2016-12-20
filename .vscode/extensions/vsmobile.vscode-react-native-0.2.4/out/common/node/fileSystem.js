// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var nodeFs = require("fs");
var path = require("path");
var Q = require("q");
var FileSystem = (function () {
    function FileSystem(_a) {
        var _b = (_a === void 0 ? {} : _a).fs, fs = _b === void 0 ? nodeFs : _b;
        this.fs = fs;
    }
    FileSystem.prototype.ensureDirectory = function (dir) {
        var _this = this;
        return Q.nfcall(this.fs.stat, dir).then(function (stat) {
            if (stat.isDirectory()) {
                return;
            }
            throw new Error("Expected " + dir + " to be a directory");
        }, function (err) {
            if (err && err.code === "ENOENT") {
                return Q.nfcall(_this.fs.mkdir, dir);
            }
            throw err;
        });
    };
    FileSystem.prototype.ensureFileWithContents = function (file, contents) {
        var _this = this;
        return Q.nfcall(this.fs.stat, file).then(function (stat) {
            if (!stat.isFile()) {
                throw new Error("Expected " + file + " to be a file");
            }
            return _this.readFile(file).then(function (existingContents) {
                if (contents !== existingContents) {
                    return _this.writeFile(file, contents);
                }
            });
        }, function (err) {
            if (err && err.code === "ENOENT") {
                return Q.nfcall(_this.fs.writeFile, file, contents);
            }
            throw err;
        });
    };
    /**
     *  Helper function to check if a file or directory exists
     */
    FileSystem.prototype.existsSync = function (filename) {
        try {
            this.fs.statSync(filename);
            return true;
        }
        catch (error) {
            return false;
        }
    };
    /**
     *  Helper (asynchronous) function to check if a file or directory exists
     */
    FileSystem.prototype.exists = function (filename) {
        return Q.nfcall(this.fs.stat, filename)
            .then(function () {
            return Q.resolve(true);
        })
            .catch(function (err) {
            return Q.resolve(false);
        });
    };
    /**
     *  Helper async function to read the contents of a directory
     */
    FileSystem.prototype.readDir = function (directory) {
        return Q.nfcall(this.fs.readdir, directory);
    };
    /**
     *  Helper (synchronous) function to create a directory recursively
     */
    FileSystem.prototype.makeDirectoryRecursiveSync = function (dirPath) {
        var parentPath = path.dirname(dirPath);
        if (!this.existsSync(parentPath)) {
            this.makeDirectoryRecursiveSync(parentPath);
        }
        this.fs.mkdirSync(dirPath);
    };
    /**
     *  Helper function to asynchronously copy a file
     */
    FileSystem.prototype.copyFile = function (from, to, encoding) {
        var deferred = Q.defer();
        var destFile = this.fs.createWriteStream(to, { encoding: encoding });
        var srcFile = this.fs.createReadStream(from, { encoding: encoding });
        destFile.on("finish", function () {
            deferred.resolve(void 0);
        });
        destFile.on("error", function (e) {
            deferred.reject(e);
        });
        srcFile.on("error", function (e) {
            deferred.reject(e);
        });
        srcFile.pipe(destFile);
        return deferred.promise;
    };
    FileSystem.prototype.deleteFileIfExistsSync = function (filename) {
        if (this.existsSync(filename)) {
            this.fs.unlinkSync(filename);
        }
    };
    FileSystem.prototype.readFile = function (filename, encoding) {
        if (encoding === void 0) { encoding = "utf8"; }
        return Q.nfcall(this.fs.readFile, filename, encoding);
    };
    FileSystem.prototype.writeFile = function (filename, data) {
        return Q.nfcall(this.fs.writeFile, filename, data);
    };
    FileSystem.prototype.unlink = function (filename) {
        return Q.nfcall(this.fs.unlink, filename);
    };
    FileSystem.prototype.mkDir = function (p) {
        return Q.nfcall(this.fs.mkdir, p);
    };
    FileSystem.prototype.stat = function (path) {
        return Q.nfcall(this.fs.stat, path);
    };
    FileSystem.prototype.directoryExists = function (directoryPath) {
        return this.stat(directoryPath).then(function (stats) {
            return stats.isDirectory();
        }).catch(function (reason) {
            return reason.code === "ENOENT"
                ? false
                : Q.reject(reason);
        });
    };
    /**
     * Delete 'dirPath' if it's an empty folder. If not fail.
     *
     * @param {dirPath} path to the folder
     * @returns {void} Nothing
     */
    FileSystem.prototype.rmdir = function (dirPath) {
        return Q.nfcall(this.fs.rmdir, dirPath);
    };
    /**
     * Recursively copy 'source' to 'target' asynchronously
     *
     * @param {string} source Location to copy from
     * @param {string} target Location to copy to
     * @returns {Q.Promise} A promise which is fulfilled when the copy completes, and is rejected on error
     */
    FileSystem.prototype.copyRecursive = function (source, target) {
        var _this = this;
        return Q.nfcall(this.fs.stat, source).then(function (stats) {
            if (stats.isDirectory()) {
                return _this.exists(target).then(function (exists) {
                    if (!exists) {
                        return Q.nfcall(_this.fs.mkdir, target);
                    }
                })
                    .then(function () {
                    return Q.nfcall(_this.fs.readdir, source);
                })
                    .then(function (contents) {
                    Q.all(contents.map(function (childPath) {
                        return _this.copyRecursive(path.join(source, childPath), path.join(target, childPath));
                    }));
                });
            }
            else {
                return _this.copyFile(source, target);
            }
        });
    };
    FileSystem.prototype.removePathRecursivelyAsync = function (p) {
        var _this = this;
        return this.exists(p).then(function (exists) {
            if (exists) {
                return Q.nfcall(_this.fs.stat, p).then(function (stats) {
                    if (stats.isDirectory()) {
                        return Q.nfcall(_this.fs.readdir, p).then(function (childPaths) {
                            var result = Q(void 0);
                            childPaths.forEach(function (childPath) {
                                return result = result.then(function () { return _this.removePathRecursivelyAsync(path.join(p, childPath)); });
                            });
                            return result;
                        }).then(function () {
                            return Q.nfcall(_this.fs.rmdir, p);
                        });
                    }
                    else {
                        /* file */
                        return Q.nfcall(_this.fs.unlink, p);
                    }
                });
            }
        });
    };
    FileSystem.prototype.removePathRecursivelySync = function (p) {
        var _this = this;
        if (this.fs.existsSync(p)) {
            var stats = this.fs.statSync(p);
            if (stats.isDirectory()) {
                var contents = this.fs.readdirSync(p);
                contents.forEach(function (childPath) {
                    return _this.removePathRecursivelySync(path.join(p, childPath));
                });
                this.fs.rmdirSync(p);
            }
            else {
                /* file */
                this.fs.unlinkSync(p);
            }
        }
    };
    return FileSystem;
}());
exports.FileSystem = FileSystem;

//# sourceMappingURL=fileSystem.js.map
