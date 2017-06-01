// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandExecutor_1 = require("./commandExecutor");
const exponentHelper_1 = require("./exponent/exponentHelper");
const errorHelper_1 = require("./error/errorHelper");
const internalErrorCode_1 = require("./error/internalErrorCode");
const log_1 = require("./log/log");
const logHelper_1 = require("./log/logHelper");
const node_1 = require("./node/node");
const package_1 = require("./node/package");
const promise_1 = require("./node/promise");
const request_1 = require("./node/request");
const reactNativeProjectHelper_1 = require("./reactNativeProjectHelper");
const Q = require("q");
const path = require("path");
const XDL = require("../common/exponent/xdlInterface");
const url = require("url");
var PackagerRunAs;
(function (PackagerRunAs) {
    PackagerRunAs[PackagerRunAs["REACT_NATIVE"] = 0] = "REACT_NATIVE";
    PackagerRunAs[PackagerRunAs["EXPONENT"] = 1] = "EXPONENT";
    PackagerRunAs[PackagerRunAs["NOT_RUNNING"] = 2] = "NOT_RUNNING";
})(PackagerRunAs = exports.PackagerRunAs || (exports.PackagerRunAs = {}));
class Packager {
    constructor(workspacePath, projectPath) {
        this.workspacePath = workspacePath;
        this.projectPath = projectPath;
        this.packagerRunningAs = PackagerRunAs.NOT_RUNNING;
    }
    static getHostForPort(port) {
        return `localhost:${port}`;
    }
    getHost() {
        return Packager.getHostForPort(this.port);
    }
    getRunningAs() {
        return this.packagerRunningAs;
    }
    startAsReactNative(port) {
        return this.start(port, PackagerRunAs.REACT_NATIVE);
    }
    startAsExponent(port) {
        return this.isRunning()
            .then(running => {
            if (running && this.packagerRunningAs === PackagerRunAs.REACT_NATIVE) {
                return this.killPackagerProcess()
                    .then(() => this.start(port, PackagerRunAs.EXPONENT));
            }
            else if (running && this.packagerRunningAs === PackagerRunAs.NOT_RUNNING) {
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager running outside of VS Code. To avoid issues with exponent make sure it is running with .vscode/ as a root."));
                return Q.resolve(void 0);
            }
            else if (this.packagerRunningAs !== PackagerRunAs.EXPONENT) {
                return this.start(port, PackagerRunAs.EXPONENT);
            }
        })
            .then(() => XDL.setOptions(this.projectPath, { packagerPort: port })).then(() => XDL.startExponentServer(this.projectPath)).then(() => XDL.startTunnels(this.projectPath)).then(() => XDL.getUrl(this.projectPath, { dev: true, minify: false })).then(exponentUrl => {
            return "exp://" + url.parse(exponentUrl).host;
        }).catch(reason => {
            return Q.reject(reason);
        });
    }
    stop() {
        return this.isRunning()
            .then(running => {
            if (running) {
                if (!this.packagerProcess) {
                    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is still running. If the packager was started outside VS Code, please quit the packager process using the task manager."));
                    return Q.resolve(void 0);
                }
                return this.killPackagerProcess();
            }
            else {
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is not running"));
                return Q.resolve(void 0);
            }
        }).then(() => {
            this.packagerRunningAs = PackagerRunAs.NOT_RUNNING;
        });
    }
    restart(port) {
        if (this.port && this.port !== port) {
            return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.PackagerRunningInDifferentPort, port, this.port));
        }
        const currentRunningState = this.packagerRunningAs;
        return this.isRunning()
            .then(running => {
            if (running) {
                if (!this.packagerProcess) {
                    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is still running. If the packager was started outside VS Code, please quit the packager process using the task manager. Then try the restart packager again."));
                    return Q.resolve(false);
                }
                return this.killPackagerProcess().then(() => Q.resolve(true));
            }
            else {
                log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("Packager is not running"));
                return Q.resolve(true);
            }
        })
            .then(stoppedOK => {
            if (stoppedOK) {
                return this.start(port, currentRunningState, true);
            }
            else {
                return Q.resolve(void 0);
            }
        });
    }
    prewarmBundleCache(platform) {
        if (platform === "exponent") {
            return Q.resolve(void 0);
        }
        return this.isRunning()
            .then(running => {
            if (running) {
                return this.prewarmBundleCacheWithBundleFilename(`index.${platform}`, platform);
            }
        });
    }
    static isPackagerRunning(packagerURL) {
        let statusURL = `http://${packagerURL}/status`;
        return new request_1.Request().request(statusURL)
            .then((body) => {
            return body === "packager-status:running";
        }, (error) => {
            return false;
        });
    }
    isRunning() {
        return Packager.isPackagerRunning(this.getHost());
    }
    prewarmBundleCacheWithBundleFilename(bundleFilename, platform) {
        const bundleURL = `http://${this.getHost()}/${bundleFilename}.bundle?platform=${platform}`;
        log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "About to get: " + bundleURL);
        return new request_1.Request().request(bundleURL, true).then(() => {
            log_1.Log.logMessage("The Bundle Cache was prewarmed.");
        }).catch(() => {
            // The attempt to prefetch the bundle failed.
            // This may be because the bundle has a different name that the one we guessed so we shouldn't treat this as fatal.
        });
    }
    start(port, runAs, resetCache = false) {
        if (this.port && this.port !== port) {
            return Q.reject(errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.PackagerRunningInDifferentPort, port, this.port));
        }
        this.port = port;
        let executedStartPackagerCmd = false;
        return this.isRunning()
            .then(running => {
            if (!running) {
                executedStartPackagerCmd = true;
                return this.monkeyPatchOpnForRNPackager()
                    .then(() => {
                    let args = ["--port", port.toString()];
                    if (resetCache) {
                        args = args.concat("--resetCache");
                    }
                    if (runAs !== PackagerRunAs.EXPONENT) {
                        return args;
                    }
                    args = args.concat(["--root", path.relative(this.projectPath, path.resolve(this.workspacePath, ".vscode"))]);
                    let helper = new exponentHelper_1.ExponentHelper(this.workspacePath, this.projectPath);
                    return helper.getExponentPackagerOptions()
                        .then((options) => {
                        return Object.keys(options).reduce((args, key) => {
                            return args.concat(["--" + key, options[key]]);
                        }, args);
                    })
                        .catch(() => {
                        log_1.Log.logWarning("Couldn't read packager's options from exp.json, continue...");
                        return args;
                    });
                })
                    .then((args) => {
                    let reactNativeProjectHelper = new reactNativeProjectHelper_1.ReactNativeProjectHelper(this.projectPath);
                    reactNativeProjectHelper.getReactNativeVersion().then(version => {
                        //  There is a bug with launching VSCode editor for file from stack frame in 0.38, 0.39, 0.40 versions:
                        //  https://github.com/facebook/react-native/commit/f49093f39710173620fead6230d62cc670570210
                        //  This bug will be fixed in 0.41
                        const failedRNVersions = ["0.38.0", "0.39.0", "0.40.0"];
                        let reactEnv = Object.assign({}, process.env, {
                            REACT_DEBUGGER: "echo A debugger is not needed: ",
                            REACT_EDITOR: failedRNVersions.indexOf(version) < 0 ? "code" : this.openFileAtLocationCommand(),
                        });
                        log_1.Log.logMessage("Starting Packager");
                        // The packager will continue running while we debug the application, so we can"t
                        // wait for this command to finish
                        let spawnOptions = { env: reactEnv };
                        const packagerSpawnResult = new commandExecutor_1.CommandExecutor(this.projectPath).spawnReactPackager(args, spawnOptions);
                        this.packagerProcess = packagerSpawnResult.spawnedProcess;
                        packagerSpawnResult.outcome.done(() => { }, () => { }); /* Q prints a warning if we don't call .done().
                                                                                We ignore all outcome errors */
                        return packagerSpawnResult.startup;
                    });
                });
            }
        })
            .then(() => this.awaitStart())
            .then(() => {
            if (executedStartPackagerCmd) {
                log_1.Log.logMessage("Packager started.");
                this.packagerRunningAs = runAs;
            }
            else {
                log_1.Log.logMessage("Packager is already running.");
                if (!this.packagerProcess) {
                    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getWarning("React Native Packager running outside of VS Code. If you want to debug please use the 'Attach to packager' option"));
                }
            }
        });
    }
    awaitStart(retryCount = 30, delay = 2000) {
        let pu = new promise_1.PromiseUtil();
        return pu.retryAsync(() => this.isRunning(), (running) => running, retryCount, delay, "Could not start the packager.");
    }
    findOpnPackage() {
        try {
            let flatDependencyPackagePath = path.resolve(this.projectPath, Packager.NODE_MODULES_FODLER_NAME, Packager.OPN_PACKAGE_NAME, Packager.OPN_PACKAGE_MAIN_FILENAME);
            let nestedDependencyPackagePath = path.resolve(this.projectPath, Packager.NODE_MODULES_FODLER_NAME, Packager.REACT_NATIVE_PACKAGE_NAME, Packager.NODE_MODULES_FODLER_NAME, Packager.OPN_PACKAGE_NAME, Packager.OPN_PACKAGE_MAIN_FILENAME);
            let fsHelper = new node_1.Node.FileSystem();
            // Attempt to find the 'opn' package directly under the project's node_modules folder (node4 +)
            // Else, attempt to find the package within the dependent node_modules of react-native package
            let possiblePaths = [flatDependencyPackagePath, nestedDependencyPackagePath];
            return Q.any(possiblePaths.map(path => fsHelper.exists(path).then(exists => exists
                ? Q.resolve(path)
                : Q.reject("opn package location not found"))));
        }
        catch (err) {
            console.error("The package \'opn\' was not found." + err);
        }
    }
    monkeyPatchOpnForRNPackager() {
        let opnPackage;
        let destnFilePath;
        // Finds the 'opn' package
        return this.findOpnPackage()
            .then((opnIndexFilePath) => {
            destnFilePath = opnIndexFilePath;
            // Read the package's "package.json"
            opnPackage = new package_1.Package(path.resolve(path.dirname(destnFilePath)));
            return opnPackage.parsePackageInformation();
        }).then((packageJson) => {
            if (packageJson.main !== Packager.JS_INJECTOR_FILENAME) {
                // Copy over the patched 'opn' main file
                return new node_1.Node.FileSystem().copyFile(Packager.JS_INJECTOR_FILEPATH, path.resolve(path.dirname(destnFilePath), Packager.JS_INJECTOR_FILENAME))
                    .then(() => {
                    // Write/over-write the "main" attribute with the new file
                    return opnPackage.setMainFile(Packager.JS_INJECTOR_FILENAME);
                });
            }
        });
    }
    killPackagerProcess() {
        log_1.Log.logMessage("Stopping Packager");
        return new commandExecutor_1.CommandExecutor(this.projectPath).killReactPackager(this.packagerProcess).then(() => {
            this.packagerProcess = null;
            this.port = null;
            if (this.packagerRunningAs === PackagerRunAs.EXPONENT) {
                log_1.Log.logMessage("Stopping Exponent");
                return XDL.stopAll(this.projectPath)
                    .then(() => log_1.Log.logMessage("Exponent Stopped"));
            }
            return Q.resolve(void 0);
        });
    }
    openFileAtLocationCommand() {
        let atomScript = "node " + path.join(__dirname, "..", "..", "scripts", "atom");
        //  shell-quote package incorrectly parses windows paths
        //  https://github.com/facebook/react-native/blob/master/local-cli/server/util/launchEditor.js#L83
        if (process.platform === "win32") {
            return atomScript.replace(/\\/g, "/");
        }
        return atomScript;
    }
}
Packager.DEFAULT_PORT = 8081;
Packager.JS_INJECTOR_FILENAME = "opn-main.js";
Packager.JS_INJECTOR_FILEPATH = path.resolve(path.dirname(path.dirname(__dirname)), "js-patched", Packager.JS_INJECTOR_FILENAME);
Packager.NODE_MODULES_FODLER_NAME = "node_modules";
Packager.OPN_PACKAGE_NAME = "opn";
Packager.REACT_NATIVE_PACKAGE_NAME = "react-native";
Packager.OPN_PACKAGE_MAIN_FILENAME = "index.js";
exports.Packager = Packager;

//# sourceMappingURL=packager.js.map
