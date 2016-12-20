// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Q = require("q");
var generalMobilePlatform_1 = require("../generalMobilePlatform");
var packager_1 = require("../../common/packager");
var log_1 = require("../../common/log/log");
var adb_1 = require("../../common/android/adb");
var package_1 = require("../../common/node/package");
var promise_1 = require("../../common/node/promise");
var packageNameResolver_1 = require("../../common/android/packageNameResolver");
var outputVerifier_1 = require("../../common/outputVerifier");
var fileSystem_1 = require("../../common/node/fileSystem");
var reactNative_1 = require("../../common/reactNative");
var telemetryHelper_1 = require("../../common/telemetryHelper");
/**
 * Android specific platform implementation for debugging RN applications.
 */
var AndroidPlatform = (function (_super) {
    __extends(AndroidPlatform, _super);
    // We set remoteExtension = null so that if there is an instance of androidPlatform that wants to have it's custom remoteExtension it can. This is specifically useful for tests.
    function AndroidPlatform(runOptions, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.remoteExtension, remoteExtension = _c === void 0 ? null : _c, _d = _b.adb, adb = _d === void 0 ? new adb_1.Adb() : _d, _e = _b.reactNative, reactNative = _e === void 0 ? new reactNative_1.ReactNative() : _e, _f = _b.fileSystem, fileSystem = _f === void 0 ? new fileSystem_1.FileSystem() : _f;
        _super.call(this, runOptions, { remoteExtension: remoteExtension });
        this.needsToLaunchApps = false;
        this.adb = adb;
        this.reactNative = reactNative;
        this.fileSystem = fileSystem;
    }
    AndroidPlatform.prototype.runApp = function (shouldLaunchInAllDevices) {
        var _this = this;
        if (shouldLaunchInAllDevices === void 0) { shouldLaunchInAllDevices = false; }
        return telemetryHelper_1.TelemetryHelper.generate("AndroidPlatform.runApp", function () {
            var runAndroidSpawn = _this.reactNative.runAndroid(_this.runOptions.projectRoot, _this.runOptions.variant);
            var output = new outputVerifier_1.OutputVerifier(function () {
                return Q(AndroidPlatform.RUN_ANDROID_SUCCESS_PATTERNS);
            }, function () {
                return Q(AndroidPlatform.RUN_ANDROID_FAILURE_PATTERNS);
            }).process(runAndroidSpawn);
            return output
                .finally(function () {
                return _this.initializeTargetDevicesAndPackageName();
            }).then(function () { return [_this.debugTarget]; }, function (reason) {
                if (reason.message === AndroidPlatform.MULTIPLE_DEVICES_ERROR && _this.devices.length > 1 && _this.debugTarget) {
                    /* If it failed due to multiple devices, we'll apply this workaround to make it work anyways */
                    _this.needsToLaunchApps = true;
                    return shouldLaunchInAllDevices
                        ? _this.adb.getOnlineDevices()
                        : Q([_this.debugTarget]);
                }
                else {
                    return Q.reject(reason);
                }
            }).then(function (devices) {
                return new promise_1.PromiseUtil().forEach(devices, function (device) {
                    return _this.launchAppWithADBReverseAndLogCat(device);
                });
            });
        });
    };
    AndroidPlatform.prototype.enableJSDebuggingMode = function () {
        return this.adb.reloadAppInDebugMode(this.runOptions.projectRoot, this.packageName, this.debugTarget.id);
    };
    AndroidPlatform.prototype.prewarmBundleCache = function () {
        return this.remoteExtension.prewarmBundleCache(this.platformName);
    };
    AndroidPlatform.prototype.initializeTargetDevicesAndPackageName = function () {
        var _this = this;
        return this.adb.getConnectedDevices().then(function (devices) {
            _this.devices = devices;
            _this.debugTarget = _this.getTargetEmulator(devices);
            return _this.getPackageName().then(function (packageName) {
                _this.packageName = packageName;
            });
        });
    };
    AndroidPlatform.prototype.launchAppWithADBReverseAndLogCat = function (device) {
        var _this = this;
        return Q({})
            .then(function () {
            return _this.configureADBReverseWhenApplicable(device);
        }).then(function () {
            return _this.needsToLaunchApps
                ? _this.adb.launchApp(_this.runOptions.projectRoot, _this.packageName, device.id)
                : Q(void 0);
        }).then(function () {
            return _this.startMonitoringLogCat(device, _this.runOptions.logCatArguments).catch(function (error) {
                return log_1.Log.logWarning("Couldn't start LogCat monitor", error);
            });
        });
    };
    AndroidPlatform.prototype.configureADBReverseWhenApplicable = function (device) {
        var _this = this;
        if (device.type !== adb_1.DeviceType.AndroidSdkEmulator) {
            return Q({}) // For other emulators and devices we try to enable adb reverse
                .then(function () { return _this.adb.apiVersion(device.id); })
                .then(function (apiVersion) {
                if (apiVersion >= adb_1.AndroidAPILevel.LOLLIPOP) {
                    return _this.adb.reverseAdd(device.id, packager_1.Packager.DEFAULT_PORT.toString(), _this.runOptions.packagerPort);
                }
                else {
                    log_1.Log.logWarning(("Device " + device.id + " supports only API Level " + apiVersion + ". ")
                        + ("Level " + adb_1.AndroidAPILevel.LOLLIPOP + " is needed to support port forwarding via adb reverse. ")
                        + "For debugging to work you'll need <Shake or press menu button> for the dev menu, "
                        + "go into <Dev Settings> and configure <Debug Server host & port for Device> to be "
                        + "an IP address of your computer that the Device can reach. More info at: "
                        + "https://facebook.github.io/react-native/docs/debugging.html#debugging-react-native-apps");
                }
            });
        }
        else {
            return Q(void 0); // Android SDK emulators can connect directly to 10.0.0.2, so they don't need port forwarding
        }
    };
    AndroidPlatform.prototype.getPackageName = function () {
        var _this = this;
        return new package_1.Package(this.runOptions.projectRoot, { fileSystem: this.fileSystem }).name().then(function (appName) {
            return new packageNameResolver_1.PackageNameResolver(appName).resolvePackageName(_this.runOptions.projectRoot);
        });
    };
    /**
     * Returns the target emulator, using the following logic:
     * *  If an emulator is specified and it is connected, use that one.
     * *  Otherwise, use the first one in the list.
     */
    AndroidPlatform.prototype.getTargetEmulator = function (devices) {
        var _this = this;
        var activeFilterFunction = function (device) {
            return device.isOnline;
        };
        var targetFilterFunction = function (device) {
            return device.id === _this.runOptions.target && activeFilterFunction(device);
        };
        if (this.runOptions && this.runOptions.target && devices) {
            /* check if the specified target is active */
            var targetDevice = devices.find(targetFilterFunction);
            if (targetDevice) {
                return targetDevice;
            }
        }
        /* return the first active device in the list */
        var activeDevices = devices && devices.filter(activeFilterFunction);
        return activeDevices && activeDevices[0];
    };
    AndroidPlatform.prototype.startMonitoringLogCat = function (device, logCatArguments) {
        return this.remoteExtension.startMonitoringLogcat(device.id, logCatArguments);
    };
    AndroidPlatform.MULTIPLE_DEVICES_ERROR = "error: more than one device/emulator";
    // We should add the common Android build/run erros we find to this list
    AndroidPlatform.RUN_ANDROID_FAILURE_PATTERNS = {
        "Failed to install on any devices": "Could not install the app on any available device. Make sure you have a correctly"
            + " configured device or emulator running. See https://facebook.github.io/react-native/docs/android-setup.html",
        "com.android.ddmlib.ShellCommandUnresponsiveException": "An Android shell command timed-out. Please retry the operation.",
        "Android project not found": "Android project not found.",
        "error: more than one device/emulator": AndroidPlatform.MULTIPLE_DEVICES_ERROR,
    };
    AndroidPlatform.RUN_ANDROID_SUCCESS_PATTERNS = ["BUILD SUCCESSFUL", "Starting the app", "Starting: Intent"];
    return AndroidPlatform;
}(generalMobilePlatform_1.GeneralMobilePlatform));
exports.AndroidPlatform = AndroidPlatform;

//# sourceMappingURL=androidPlatform.js.map
