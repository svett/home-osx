// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const generalMobilePlatform_1 = require("../generalMobilePlatform");
const packager_1 = require("../../common/packager");
const log_1 = require("../../common/log/log");
const adb_1 = require("../../common/android/adb");
const package_1 = require("../../common/node/package");
const promise_1 = require("../../common/node/promise");
const packageNameResolver_1 = require("../../common/android/packageNameResolver");
const outputVerifier_1 = require("../../common/outputVerifier");
const fileSystem_1 = require("../../common/node/fileSystem");
const reactNative_1 = require("../../common/reactNative");
const telemetryHelper_1 = require("../../common/telemetryHelper");
/**
 * Android specific platform implementation for debugging RN applications.
 */
class AndroidPlatform extends generalMobilePlatform_1.GeneralMobilePlatform {
    // We set remoteExtension = null so that if there is an instance of androidPlatform that wants to have it's custom remoteExtension it can. This is specifically useful for tests.
    constructor(runOptions, { remoteExtension = null, adb = new adb_1.Adb(), reactNative = new reactNative_1.ReactNative(), fileSystem = new fileSystem_1.FileSystem(), } = {}) {
        super(runOptions, { remoteExtension: remoteExtension });
        this.needsToLaunchApps = false;
        this.adb = adb;
        this.reactNative = reactNative;
        this.fileSystem = fileSystem;
    }
    runApp(shouldLaunchInAllDevices = false) {
        return telemetryHelper_1.TelemetryHelper.generate("AndroidPlatform.runApp", () => {
            const runAndroidSpawn = this.reactNative.runAndroid(this.runOptions.projectRoot, this.runOptions.variant);
            const output = new outputVerifier_1.OutputVerifier(() => Q(AndroidPlatform.RUN_ANDROID_SUCCESS_PATTERNS), () => Q(AndroidPlatform.RUN_ANDROID_FAILURE_PATTERNS)).process(runAndroidSpawn);
            return output
                .finally(() => {
                return this.initializeTargetDevicesAndPackageName();
            }).then(() => [this.debugTarget], reason => {
                if (reason.message === AndroidPlatform.MULTIPLE_DEVICES_ERROR && this.devices.length > 1 && this.debugTarget) {
                    /* If it failed due to multiple devices, we'll apply this workaround to make it work anyways */
                    this.needsToLaunchApps = true;
                    return shouldLaunchInAllDevices
                        ? this.adb.getOnlineDevices()
                        : Q([this.debugTarget]);
                }
                else {
                    return Q.reject(reason);
                }
            }).then(devices => {
                return new promise_1.PromiseUtil().forEach(devices, device => {
                    return this.launchAppWithADBReverseAndLogCat(device);
                });
            });
        });
    }
    enableJSDebuggingMode() {
        return this.adb.reloadAppInDebugMode(this.runOptions.projectRoot, this.packageName, this.debugTarget.id);
    }
    prewarmBundleCache() {
        return this.remoteExtension.prewarmBundleCache(this.platformName);
    }
    initializeTargetDevicesAndPackageName() {
        return this.adb.getConnectedDevices().then(devices => {
            this.devices = devices;
            this.debugTarget = this.getTargetEmulator(devices);
            return this.getPackageName().then(packageName => {
                this.packageName = packageName;
            });
        });
    }
    launchAppWithADBReverseAndLogCat(device) {
        return Q({})
            .then(() => {
            return this.configureADBReverseWhenApplicable(device);
        }).then(() => {
            return this.needsToLaunchApps
                ? this.adb.launchApp(this.runOptions.projectRoot, this.packageName, device.id)
                : Q(void 0);
        }).then(() => {
            return this.startMonitoringLogCat(device, this.runOptions.logCatArguments).catch(error => log_1.Log.logWarning("Couldn't start LogCat monitor", error));
        });
    }
    configureADBReverseWhenApplicable(device) {
        if (device.type !== adb_1.DeviceType.AndroidSdkEmulator) {
            return Q({}) // For other emulators and devices we try to enable adb reverse
                .then(() => this.adb.apiVersion(device.id))
                .then(apiVersion => {
                if (apiVersion >= adb_1.AndroidAPILevel.LOLLIPOP) {
                    return this.adb.reverseAdd(device.id, packager_1.Packager.DEFAULT_PORT.toString(), this.runOptions.packagerPort);
                }
                else {
                    log_1.Log.logWarning(`Device ${device.id} supports only API Level ${apiVersion}. `
                        + `Level ${adb_1.AndroidAPILevel.LOLLIPOP} is needed to support port forwarding via adb reverse. `
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
    }
    getPackageName() {
        return new package_1.Package(this.runOptions.projectRoot, { fileSystem: this.fileSystem }).name().then(appName => new packageNameResolver_1.PackageNameResolver(appName).resolvePackageName(this.runOptions.projectRoot));
    }
    /**
     * Returns the target emulator, using the following logic:
     * *  If an emulator is specified and it is connected, use that one.
     * *  Otherwise, use the first one in the list.
     */
    getTargetEmulator(devices) {
        let activeFilterFunction = (device) => {
            return device.isOnline;
        };
        let targetFilterFunction = (device) => {
            return device.id === this.runOptions.target && activeFilterFunction(device);
        };
        if (this.runOptions && this.runOptions.target && devices) {
            /* check if the specified target is active */
            const targetDevice = devices.find(targetFilterFunction);
            if (targetDevice) {
                return targetDevice;
            }
        }
        /* return the first active device in the list */
        let activeDevices = devices && devices.filter(activeFilterFunction);
        return activeDevices && activeDevices[0];
    }
    startMonitoringLogCat(device, logCatArguments) {
        return this.remoteExtension.startMonitoringLogcat(device.id, logCatArguments);
    }
}
AndroidPlatform.MULTIPLE_DEVICES_ERROR = "error: more than one device/emulator";
// We should add the common Android build/run erros we find to this list
AndroidPlatform.RUN_ANDROID_FAILURE_PATTERNS = [{
        pattern: "Failed to install on any devices",
        message: "Could not install the app on any available device. Make sure you have a correctly"
            + " configured device or emulator running. See https://facebook.github.io/react-native/docs/android-setup.html",
    }, {
        pattern: "com.android.ddmlib.ShellCommandUnresponsiveException",
        message: "An Android shell command timed-out. Please retry the operation.",
    }, {
        pattern: "Android project not found",
        message: "Android project not found.",
    }, {
        pattern: "error: more than one device/emulator",
        message: AndroidPlatform.MULTIPLE_DEVICES_ERROR,
    }, {
        pattern: /^Error: Activity class \{.*\} does not exist\.$/m,
        message: "Failed to launch the specified activity. Try running application manually and "
            + "start debugging using 'Attach to packager' launch configuration.",
    }];
AndroidPlatform.RUN_ANDROID_SUCCESS_PATTERNS = ["BUILD SUCCESSFUL", "Starting the app", "Starting: Intent"];
exports.AndroidPlatform = AndroidPlatform;

//# sourceMappingURL=androidPlatform.js.map
