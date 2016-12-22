// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var path = require("path");
var Q = require("q");
var XDL = require("./xdlInterface");
var stripJsonComments = require("strip-json-comments");
var fileSystem_1 = require("../node/fileSystem");
var package_1 = require("../node/package");
var reactNativeProjectHelper_1 = require("../reactNativeProjectHelper");
var commandExecutor_1 = require("../commandExecutor");
var hostPlatform_1 = require("../hostPlatform");
var log_1 = require("../log/log");
var VSCODE_EXPONENT_JSON = "vscodeExponent.json";
var EXPONENT_INDEX = "exponentIndex.js";
var DEFAULT_EXPONENT_INDEX = "main.js";
var DEFAULT_IOS_INDEX = "index.ios.js";
var DEFAULT_ANDROID_INDEX = "index.android.js";
var EXP_JSON = "exp.json";
var SECONDS_IN_DAY = 86400;
var ReactNativePackageStatus;
(function (ReactNativePackageStatus) {
    ReactNativePackageStatus[ReactNativePackageStatus["FACEBOOK_PACKAGE"] = 0] = "FACEBOOK_PACKAGE";
    ReactNativePackageStatus[ReactNativePackageStatus["EXPONENT_PACKAGE"] = 1] = "EXPONENT_PACKAGE";
    ReactNativePackageStatus[ReactNativePackageStatus["UNKNOWN"] = 2] = "UNKNOWN";
})(ReactNativePackageStatus || (ReactNativePackageStatus = {}));
var ExponentHelper = (function () {
    function ExponentHelper(workspaceRootPath, projectRootPath) {
        this.workspaceRootPath = workspaceRootPath;
        this.projectRootPath = projectRootPath;
        this.hasInitialized = false;
        // Constructor is slim by design. This is to add as less computation as possible
        // to the initialization of the extension. If a public method is added, make sure
        // to call this.lazilyInitialize() at the begining of the code to be sure all variables
        // are correctly initialized.
    }
    /**
     * Convert react native project to exponent.
     * This consists on three steps:
     * 1. Change the dependency from facebook's react-native to exponent's fork
     * 2. Create exp.json
     * 3. Create index and entrypoint for exponent
     */
    ExponentHelper.prototype.configureExponentEnvironment = function () {
        var _this = this;
        this.lazilyInitialize();
        log_1.Log.logMessage("Making sure your project uses the correct dependencies for exponent. This may take a while...");
        return this.changeReactNativeToExponent()
            .then(function () {
            log_1.Log.logMessage("Dependencies are correct. Making sure you have any necessary configuration file.");
            return _this.ensureExpJson();
        }).then(function () {
            log_1.Log.logMessage("Project setup is correct. Generating entrypoint code.");
            return _this.createIndex();
        });
    };
    /**
     * Change dependencies to point to original react-native repo
     */
    ExponentHelper.prototype.configureReactNativeEnvironment = function () {
        this.lazilyInitialize();
        log_1.Log.logMessage("Checking react native is correctly setup. This may take a while...");
        return this.changeExponentToReactNative();
    };
    /**
     * Returns the current user. If there is none, asks user for username and password and logins to exponent servers.
     */
    ExponentHelper.prototype.loginToExponent = function (promptForInformation, showMessage) {
        this.lazilyInitialize();
        return XDL.currentUser()
            .then(function (user) {
            if (!user) {
                var username_1 = "";
                return showMessage("You need to login to exponent. Please provide username and password to login. If you don't have an account we will create one for you.")
                    .then(function () {
                    return promptForInformation("Exponent username", false);
                }).then(function (name) {
                    username_1 = name;
                    return promptForInformation("Exponent password", true);
                })
                    .then(function (password) {
                    return XDL.login(username_1, password);
                });
            }
            return user;
        })
            .catch(function (error) {
            return Q.reject(error);
        });
    };
    /**
     * File used as an entrypoint for exponent. This file's component should be registered as "main"
     * in the AppRegistry and should only render a entrypoint component.
     */
    ExponentHelper.prototype.createIndex = function () {
        var _this = this;
        this.lazilyInitialize();
        var pkg = require("../../../package.json");
        var extensionVersionNumber = pkg.version;
        var extensionName = pkg.name;
        return Q.all([this.entrypointComponent(), this.entrypoint()])
            .spread(function (componentName, entryPointFile) {
            var fileContents = "// This file is automatically generated by " + extensionName + "@" + extensionVersionNumber + "\n// Please do not modify it manually. All changes will be lost.\nvar React = require('" + _this.projectRootPath + "/node_modules/react');\nvar {Component} = React;\n\nvar ReactNative = require('" + _this.projectRootPath + "/node_modules/react-native');\nvar {AppRegistry} = ReactNative;\n\nvar entryPoint = require('" + _this.projectRootPath + "/" + entryPointFile + "');\n\nAppRegistry.registerRunnable('main', function(appParameters) {\n    AppRegistry.runApplication('" + componentName + "', appParameters);\n});";
            return _this.fileSystem.writeFile(_this.dotvscodePath(EXPONENT_INDEX), fileContents);
        });
    };
    /**
     * Create exp.json file in the workspace root if not present
     */
    ExponentHelper.prototype.ensureExpJson = function () {
        var _this = this;
        this.lazilyInitialize();
        var defaultSettings = {
            "sdkVersion": "",
            "entryPoint": this.dotvscodePath(EXPONENT_INDEX),
            "slug": "",
            "name": "",
        };
        return this.readVscodeExponentSettingFile()
            .then(function (exponentJson) {
            var expJsonPath = _this.pathToFileInWorkspace(EXP_JSON);
            if (!_this.fileSystem.existsSync(expJsonPath) || exponentJson.overwriteExpJson) {
                return _this.getPackageName()
                    .then(function (name) {
                    // Name and slug are supposed to be the same,
                    // but slug only supports alpha numeric and -,
                    // while name should be human readable
                    defaultSettings.slug = name.replace(" ", "-");
                    defaultSettings.name = name;
                    return _this.exponentSdk();
                })
                    .then(function (exponentVersion) {
                    if (!exponentVersion) {
                        return XDL.supportedVersions()
                            .then(function (versions) {
                            return Q.reject(new Error("React Native version not supported by exponent. Major versions supported: " + versions.join(", ")));
                        });
                    }
                    defaultSettings.sdkVersion = exponentVersion;
                    return _this.fileSystem.writeFile(expJsonPath, JSON.stringify(defaultSettings, null, 4));
                });
            }
        });
    };
    /**
     * Changes npm dependency from react native to exponent's fork
     */
    ExponentHelper.prototype.changeReactNativeToExponent = function () {
        var _this = this;
        log_1.Log.logString("Checking if react native is from exponent.");
        return this.usingReactNativeExponent(true)
            .then(function (usingExponent) {
            log_1.Log.logString(".\n");
            if (usingExponent) {
                return Q.resolve(void 0);
            }
            log_1.Log.logString("Getting appropriate Exponent SDK Version to install.");
            return _this.exponentSdk(true)
                .then(function (sdkVersion) {
                log_1.Log.logString(".\n");
                if (!sdkVersion) {
                    return XDL.supportedVersions()
                        .then(function (versions) {
                        return Q.reject(new Error("React Native version not supported by exponent. Major versions supported: " + versions.join(", ")));
                    });
                }
                var exponentFork = "github:exponentjs/react-native#sdk-" + sdkVersion;
                log_1.Log.logString("Uninstalling current react native package.");
                return Q(_this.commandExecutor.spawnWithProgress(hostPlatform_1.HostPlatform.getNpmCliCommand("npm"), ["uninstall", "react-native", "--verbose"], { verbosity: commandExecutor_1.CommandVerbosity.PROGRESS }))
                    .then(function () {
                    log_1.Log.logString("Installing exponent react native package.");
                    return _this.commandExecutor.spawnWithProgress(hostPlatform_1.HostPlatform.getNpmCliCommand("npm"), ["install", exponentFork, "--cache-min", SECONDS_IN_DAY.toString(10), "--verbose"], { verbosity: commandExecutor_1.CommandVerbosity.PROGRESS });
                });
            });
        })
            .then(function () {
            _this.dependencyPackage = ReactNativePackageStatus.EXPONENT_PACKAGE;
        });
    };
    /**
     * Changes npm dependency from exponent's fork to react native
     */
    ExponentHelper.prototype.changeExponentToReactNative = function () {
        var _this = this;
        log_1.Log.logString("Checking if the correct react native is installed.");
        return this.usingReactNativeExponent()
            .then(function (usingExponent) {
            log_1.Log.logString(".\n");
            if (!usingExponent) {
                return Q.resolve(void 0);
            }
            log_1.Log.logString("Uninstalling current react native package.");
            return Q(_this.commandExecutor.spawnWithProgress(hostPlatform_1.HostPlatform.getNpmCliCommand("npm"), ["uninstall", "react-native", "--verbose"], { verbosity: commandExecutor_1.CommandVerbosity.PROGRESS }))
                .then(function () {
                log_1.Log.logString("Installing correct react native package.");
                return _this.commandExecutor.spawnWithProgress(hostPlatform_1.HostPlatform.getNpmCliCommand("npm"), ["install", "react-native", "--cache-min", SECONDS_IN_DAY.toString(10), "--verbose"], { verbosity: commandExecutor_1.CommandVerbosity.PROGRESS });
            });
        })
            .then(function () {
            _this.dependencyPackage = ReactNativePackageStatus.FACEBOOK_PACKAGE;
        });
    };
    /**
     * Reads VSCODE_EXPONENT Settings file. If it doesn't exists it creates one by
     * guessing which entrypoint and filename to use.
     */
    ExponentHelper.prototype.readVscodeExponentSettingFile = function () {
        var _this = this;
        // Only create a new one if there is not one already
        return this.fileSystem.exists(this.dotvscodePath(VSCODE_EXPONENT_JSON))
            .then(function (vscodeExponentExists) {
            if (vscodeExponentExists) {
                return _this.fileSystem.readFile(_this.dotvscodePath(VSCODE_EXPONENT_JSON), "utf-8")
                    .then(function (jsonContents) {
                    return JSON.parse(stripJsonComments(jsonContents));
                });
            }
            else {
                var defaultSettings_1 = {
                    "entryPointFilename": "",
                    "entryPointComponent": "",
                    "overwriteExpJson": false,
                };
                return _this.getPackageName()
                    .then(function (packageName) {
                    // By default react-native uses the package name for the entry component. This is our safest guess.
                    defaultSettings_1.entryPointComponent = packageName;
                    _this.entrypointComponentName = defaultSettings_1.entryPointComponent;
                    return Q.all([
                        _this.fileSystem.exists(_this.pathToFileInWorkspace(DEFAULT_IOS_INDEX)),
                        _this.fileSystem.exists(_this.pathToFileInWorkspace(DEFAULT_EXPONENT_INDEX)),
                    ]);
                })
                    .spread(function (indexIosExists, mainExists) {
                    // If there is an ios entrypoint we want to use that, if not let's go with android
                    defaultSettings_1.entryPointFilename =
                        mainExists ? DEFAULT_EXPONENT_INDEX
                            : indexIosExists ? DEFAULT_IOS_INDEX
                                : DEFAULT_ANDROID_INDEX;
                    _this.entrypointFilename = defaultSettings_1.entryPointFilename;
                    return _this.fileSystem.writeFile(_this.dotvscodePath(VSCODE_EXPONENT_JSON), JSON.stringify(defaultSettings_1, null, 4));
                })
                    .then(function () {
                    return defaultSettings_1;
                });
            }
        });
    };
    /**
     * Exponent sdk version that maps to the current react-native version
     * If react native version is not supported it returns null.
     */
    ExponentHelper.prototype.exponentSdk = function (showProgress) {
        var _this = this;
        if (showProgress === void 0) { showProgress = false; }
        if (showProgress)
            log_1.Log.logString("...");
        if (this.expSdkVersion) {
            return Q(this.expSdkVersion);
        }
        return this.readFromExpJson("sdkVersion")
            .then(function (sdkVersion) {
            if (showProgress)
                log_1.Log.logString(".");
            if (sdkVersion) {
                _this.expSdkVersion = sdkVersion;
                return _this.expSdkVersion;
            }
            var reactNativeProjectHelper = new reactNativeProjectHelper_1.ReactNativeProjectHelper(_this.projectRootPath);
            return reactNativeProjectHelper.getReactNativeVersion()
                .then(function (version) {
                if (showProgress)
                    log_1.Log.logString(".");
                return XDL.mapVersion(version)
                    .then(function (exponentVersion) {
                    _this.expSdkVersion = exponentVersion;
                    return _this.expSdkVersion;
                });
            });
        });
    };
    /**
     * Returns the specified setting from exp.json if it exists
     */
    ExponentHelper.prototype.readFromExpJson = function (setting) {
        var _this = this;
        var expJsonPath = this.pathToFileInWorkspace(EXP_JSON);
        return this.fileSystem.exists(expJsonPath)
            .then(function (exists) {
            if (!exists) {
                return null;
            }
            return _this.fileSystem.readFile(expJsonPath, "utf-8")
                .then(function (jsonContents) {
                return JSON.parse(stripJsonComments(jsonContents))[setting];
            });
        });
    };
    /**
     * Looks at the _from attribute in the package json of the react-native dependency
     * to figure out if it's using exponent.
     */
    ExponentHelper.prototype.usingReactNativeExponent = function (showProgress) {
        var _this = this;
        if (showProgress === void 0) { showProgress = false; }
        if (showProgress)
            log_1.Log.logString("...");
        if (this.dependencyPackage !== ReactNativePackageStatus.UNKNOWN) {
            return Q(this.dependencyPackage === ReactNativePackageStatus.EXPONENT_PACKAGE);
        }
        // Look for the package.json of the dependecy
        var pathToReactNativePackageJson = path.resolve(this.projectRootPath, "node_modules", "react-native", "package.json");
        return this.fileSystem.readFile(pathToReactNativePackageJson, "utf-8")
            .then(function (jsonContents) {
            var packageJson = JSON.parse(jsonContents);
            var isExp = /\bexponentjs\/react-native\b/.test(packageJson._from);
            _this.dependencyPackage = isExp ? ReactNativePackageStatus.EXPONENT_PACKAGE : ReactNativePackageStatus.FACEBOOK_PACKAGE;
            if (showProgress)
                log_1.Log.logString(".");
            return isExp;
        }).catch(function () {
            if (showProgress)
                log_1.Log.logString(".");
            // Not in a react-native project
            return false;
        });
    };
    /**
     * Name of the file (we assume it lives in the workspace root) that should be used as entrypoint.
     * e.g. index.ios.js
     */
    ExponentHelper.prototype.entrypoint = function () {
        var _this = this;
        if (this.entrypointFilename) {
            return Q(this.entrypointFilename);
        }
        return this.readVscodeExponentSettingFile()
            .then(function (settingsJson) {
            // Let's load both to memory to make sure we are not reading from memory next time we query for this.
            _this.entrypointFilename = settingsJson.entryPointFilename;
            _this.entrypointComponentName = settingsJson.entryPointComponent;
            return _this.entrypointFilename;
        });
    };
    /**
     * Name of the component used as an entrypoint for the app.
     */
    ExponentHelper.prototype.entrypointComponent = function () {
        var _this = this;
        if (this.entrypointComponentName) {
            return Q(this.entrypointComponentName);
        }
        return this.readVscodeExponentSettingFile()
            .then(function (settingsJson) {
            // Let's load both to memory to make sure we are not reading from memory next time we query for this.
            _this.entrypointComponentName = settingsJson.entryPointComponent;
            _this.entrypointFilename = settingsJson.entrypointFilename;
            return _this.entrypointComponentName;
        });
    };
    /**
     * Path to a given file inside the .vscode directory
     */
    ExponentHelper.prototype.dotvscodePath = function (filename) {
        return path.join(this.workspaceRootPath, ".vscode", filename);
    };
    /**
     * Path to a given file from the workspace root
     */
    ExponentHelper.prototype.pathToFileInWorkspace = function (filename) {
        return path.join(this.projectRootPath, filename);
    };
    /**
     * Name specified on user's package.json
     */
    ExponentHelper.prototype.getPackageName = function () {
        return new package_1.Package(this.projectRootPath, { fileSystem: this.fileSystem }).name();
    };
    /**
     * Works as a constructor but only initiliazes when it's actually needed.
     */
    ExponentHelper.prototype.lazilyInitialize = function () {
        if (!this.hasInitialized) {
            this.hasInitialized = true;
            this.fileSystem = new fileSystem_1.FileSystem();
            this.commandExecutor = new commandExecutor_1.CommandExecutor(this.projectRootPath);
            this.dependencyPackage = ReactNativePackageStatus.UNKNOWN;
            XDL.configReactNativeVersionWargnings();
            XDL.attachLoggerStream(this.projectRootPath, {
                stream: {
                    write: function (chunk) {
                        if (chunk.level <= 30) {
                            log_1.Log.logString(chunk.msg);
                        }
                        else if (chunk.level === 40) {
                            log_1.Log.logWarning(chunk.msg);
                        }
                        else {
                            log_1.Log.logError(chunk.msg);
                        }
                    },
                },
                type: "raw",
            });
        }
    };
    return ExponentHelper;
}());
exports.ExponentHelper = ExponentHelper;

//# sourceMappingURL=exponentHelper.js.map