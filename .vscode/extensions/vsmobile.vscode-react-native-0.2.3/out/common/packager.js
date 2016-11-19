// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var commandExecutor_1 = require("./commandExecutor");
var errorHelper_1 = require("./error/errorHelper");
var internalErrorCode_1 = require("./error/internalErrorCode");
var log_1 = require("./log/log");
var logHelper_1 = require("./log/logHelper");
var node_1 = require("./node/node");
var package_1 = require("./node/package");
var promise_1 = require("./node/promise");
var request_1 = require("./node/request");
var Q = require("q");
var path = require("path");
var XDL = require("../common/exponent/xdlInterface");
var url = require("url");
(function (PackagerRunAs) {
    PackagerRunAs[PackagerRunAs["REACT_NATIVE"] = 0] = "REACT_NATIVE";
    PackagerRunAs[PackagerRunAs["EXPONENT"] = 1] = "EXPONENT";
    PackagerRunAs[PackagerRunAs["NOT_RUNNING"] = 2] = "NOT_RUNNING";
})(exports.PackagerRunAs || (exports.PackagerRunAs = {}));
var PackagerRunAs = exports.PackagerRunAs;
var Packager = (function () {
    function Packager(projectPath) {
        this.projectPath = projectPath;
        this.packagerRunningAs = PackagerRunAs.NOT_RUNNING;
    }
    Packager.getHostForPort = function (port) {
        return "localhost:" + port;
    };
    Packager.prototype.getHost = function () {
        return Packager.getHostForPort(this.port);
    };
    Packager.prototype.getRunningAs = function () {
        return this.packagerRunningAs;
    };
    Packager.prototype.startAsReactNative = function (port) {
        return this.start(port, PackagerRunAs.REACT_NATIVE);
    };
    Packager.prototype.startAsExponent = function (port) {
        var _this = this;
        return this.isRunning()
            .then(function (running) {
            if (running && _this.packagerRunningAs === PackagerRunAs.REACT_NATIVE) {
                return _this.killPackagerProcess()
                    .then(function () {
                    return _this.start(port, PackagerRunAs.EXPONENT);
                });
            }
            else if (running && _this.packagerRunningAs === PackagerRunAs.NOT_RUNNING) {
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager running outside of VS Code. To avoid issues with exponent make sure it is running with .vscode/ as a root."));
                return Q.resolve(void 0);
            }
            else if (_this.packagerRunningAs !== PackagerRunAs.EXPONENT) {
                return _this.start(port, PackagerRunAs.EXPONENT);
            }
        })
            .then(function () {
            return XDL.setOptions(_this.projectPath, { packagerPort: port });
        }).then(function () {
            return XDL.startExponentServer(_this.projectPath);
        }).then(function () {
            return XDL.startTunnels(_this.projectPath);
        }).then(function () {
            return XDL.getUrl(_this.projectPath, { dev: true, minify: false });
        }).then(function (exponentUrl) {
            return "exp://" + url.parse(exponentUrl).host;
        }).catch(function (reason) {
            return Q.reject(reason);
        });
    };
    Packager.prototype.stop = function () {
        var _this = this;
        return this.isRunning()
            .then(function (running) {
            if (running) {
                if (!_this.packagerProcess) {
                    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is still running. If the packager was started outside VS Code, please quit the packager process using the task manager."));
                    return Q.resolve(void 0);
                }
                return _this.killPackagerProcess();
            }
            else {
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is not running"));
                return Q.resolve(void 0);
            }
        }).then(function () {
            _this.packagerRunningAs = PackagerRunAs.NOT_RUNNING;
        });
    };
    Packager.prototype.restart = function (port) {
        var _this = this;
        if (this.port && this.port !== port) {
            return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.PackagerRunningInDifferentPort, port, this.port));
        }
        var currentRunningState = this.packagerRunningAs;
        return this.isRunning()
            .then(function (running) {
            if (running) {
                if (!_this.packagerProcess) {
                    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is still running. If the packager was started outside VS Code, please quit the packager process using the task manager. Then try the restart packager again."));
                    return Q.resolve(false);
                }
                return _this.killPackagerProcess().then(function () { return Q.resolve(true); });
            }
            else {
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is not running"));
                return Q.resolve(true);
            }
        })
            .then(function (stoppedOK) {
            if (stoppedOK) {
                return _this.start(port, currentRunningState, true);
            }
            else {
                return Q.resolve(void 0);
            }
        });
    };
    Packager.prototype.prewarmBundleCache = function (platform) {
        var _this = this;
        if (platform === "exponent") {
            return Q.resolve(void 0);
        }
        return this.isRunning()
            .then(function (running) {
            if (running) {
                return _this.prewarmBundleCacheWithBundleFilename("index." + platform, platform);
            }
        });
    };
    Packager.isPackagerRunning = function (packagerURL) {
        var statusURL = "http://" + packagerURL + "/status";
        return new request_1.Request().request(statusURL)
            .then(function (body) {
            return body === "packager-status:running";
        }, function (error) {
            return false;
        });
    };
    Packager.prototype.isRunning = function () {
        return Packager.isPackagerRunning(this.getHost());
    };
    Packager.prototype.prewarmBundleCacheWithBundleFilename = function (bundleFilename, platform) {
        var bundleURL = "http://" + this.getHost() + "/" + bundleFilename + ".bundle?platform=" + platform;
        log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "About to get: " + bundleURL);
        return new request_1.Request().request(bundleURL, true).then(function () {
            log_1.Log.logMessage("The Bundle Cache was prewarmed.");
        }).catch(function () {
            // The attempt to prefetch the bundle failed.
            // This may be because the bundle has a different name that the one we guessed so we shouldn't treat this as fatal.
        });
    };
    Packager.prototype.start = function (port, runAs, resetCache) {
        var _this = this;
        if (resetCache === void 0) { resetCache = false; }
        if (this.port && this.port !== port) {
            return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.PackagerRunningInDifferentPort, port, this.port));
        }
        this.port = port;
        var executedStartPackagerCmd = false;
        return this.isRunning()
            .then(function (running) {
            if (!running) {
                executedStartPackagerCmd = true;
                return _this.monkeyPatchOpnForRNPackager()
                    .then(function () {
                    var args = ["--port", port.toString()];
                    if (resetCache) {
                        args = args.concat("--resetCache");
                    }
                    if (runAs === PackagerRunAs.EXPONENT) {
                        args = args.concat(["--root", ".vscode"]);
                    }
                    var reactEnv = Object.assign({}, process.env, {
                        REACT_DEBUGGER: "echo A debugger is not needed: ",
                        REACT_EDITOR: _this.openFileAtLocationCommand(),
                    });
                    log_1.Log.logMessage("Starting Packager");
                    // The packager will continue running while we debug the application, so we can"t
                    // wait for this command to finish
                    var spawnOptions = { env: reactEnv };
                    var packagerSpawnResult = new commandExecutor_1.CommandExecutor(_this.projectPath).spawnReactPackager(args, spawnOptions);
                    _this.packagerProcess = packagerSpawnResult.spawnedProcess;
                    packagerSpawnResult.outcome.done(function () { }, function () { }); /* Q prints a warning if we don't call .done().
                                                                             We ignore all outcome errors */
                    return packagerSpawnResult.startup;
                });
            }
        })
            .then(function () {
            return _this.awaitStart();
        })
            .then(function () {
            if (executedStartPackagerCmd) {
                log_1.Log.logMessage("Packager started.");
                _this.packagerRunningAs = runAs;
            }
            else {
                log_1.Log.logMessage("Packager is already running.");
                if (!_this.packagerProcess) {
                    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("React Native Packager running outside of VS Code. If you want to debug please use the 'Attach to packager' option"));
                }
            }
        });
    };
    Packager.prototype.awaitStart = function (retryCount, delay) {
        var _this = this;
        if (retryCount === void 0) { retryCount = 30; }
        if (delay === void 0) { delay = 2000; }
        var pu = new promise_1.PromiseUtil();
        return pu.retryAsync(function () { return _this.isRunning(); }, function (running) { return running; }, retryCount, delay, "Could not start the packager.");
    };
    Packager.prototype.findOpnPackage = function () {
        try {
            var flatDependencyPackagePath = path.resolve(this.projectPath, Packager.NODE_MODULES_FODLER_NAME, Packager.OPN_PACKAGE_NAME, Packager.OPN_PACKAGE_MAIN_FILENAME);
            var nestedDependencyPackagePath = path.resolve(this.projectPath, Packager.NODE_MODULES_FODLER_NAME, Packager.REACT_NATIVE_PACKAGE_NAME, Packager.NODE_MODULES_FODLER_NAME, Packager.OPN_PACKAGE_NAME, Packager.OPN_PACKAGE_MAIN_FILENAME);
            var fsHelper_1 = new node_1.Node.FileSystem();
            // Attempt to find the 'opn' package directly under the project's node_modules folder (node4 +)
            // Else, attempt to find the package within the dependent node_modules of react-native package
            var possiblePaths = [flatDependencyPackagePath, nestedDependencyPackagePath];
            return Q.any(possiblePaths.map(function (path) {
                return fsHelper_1.exists(path).then(function (exists) {
                    return exists
                        ? Q.resolve(path)
                        : Q.reject("opn package location not found");
                });
            }));
        }
        catch (err) {
            console.error("The package \'opn\' was not found." + err);
        }
    };
    Packager.prototype.monkeyPatchOpnForRNPackager = function () {
        var opnPackage;
        var destnFilePath;
        // Finds the 'opn' package
        return this.findOpnPackage()
            .then(function (opnIndexFilePath) {
            destnFilePath = opnIndexFilePath;
            // Read the package's "package.json"
            opnPackage = new package_1.Package(path.resolve(path.dirname(destnFilePath)));
            return opnPackage.parsePackageInformation();
        }).then(function (packageJson) {
            if (packageJson.main !== Packager.JS_INJECTOR_FILENAME) {
                // Copy over the patched 'opn' main file
                return new node_1.Node.FileSystem().copyFile(Packager.JS_INJECTOR_FILEPATH, path.resolve(path.dirname(destnFilePath), Packager.JS_INJECTOR_FILENAME))
                    .then(function () {
                    // Write/over-write the "main" attribute with the new file
                    return opnPackage.setMainFile(Packager.JS_INJECTOR_FILENAME);
                });
            }
        });
    };
    Packager.prototype.killPackagerProcess = function () {
        var _this = this;
        log_1.Log.logMessage("Stopping Packager");
        return new commandExecutor_1.CommandExecutor(this.projectPath).killReactPackager(this.packagerProcess).then(function () {
            _this.packagerProcess = null;
            _this.port = null;
            if (_this.packagerRunningAs === PackagerRunAs.EXPONENT) {
                log_1.Log.logMessage("Stopping Exponent");
                return XDL.stopAll(_this.projectPath)
                    .then(function () {
                    return log_1.Log.logMessage("Exponent Stopped");
                });
            }
            return Q.resolve(void 0);
        });
    };
    Packager.prototype.openFileAtLocationCommand = function () {
        return "node " + path.join(__dirname, "..", "..", "scripts", "atom");
    };
    Packager.DEFAULT_PORT = 8081;
    Packager.JS_INJECTOR_FILENAME = "opn-main.js";
    Packager.JS_INJECTOR_FILEPATH = path.resolve(path.dirname(path.dirname(__dirname)), "js-patched", Packager.JS_INJECTOR_FILENAME);
    Packager.NODE_MODULES_FODLER_NAME = "node_modules";
    Packager.OPN_PACKAGE_NAME = "opn";
    Packager.REACT_NATIVE_PACKAGE_NAME = "react-native";
    Packager.OPN_PACKAGE_MAIN_FILENAME = "index.js";
    return Packager;
}());
exports.Packager = Packager;

//# sourceMappingURL=packager.js.map
