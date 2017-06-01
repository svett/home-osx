// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iOSPlatform_1 = require("./ios/iOSPlatform");
const androidPlatform_1 = require("../common/android/androidPlatform");
const generalMobilePlatform_1 = require("../common/generalMobilePlatform");
const exponentPlatform_1 = require("../common/exponent/exponentPlatform");
class PlatformResolver {
    /**
     * Resolves the mobile application target platform.
     */
    resolveMobilePlatform(mobilePlatformString, runOptions) {
        switch (mobilePlatformString) {
            // We lazyly load the strategies, because some components might be
            // missing on some platforms (like XCode in Windows)
            case "ios":
                return new iOSPlatform_1.IOSPlatform(runOptions);
            case "android":
                return new androidPlatform_1.AndroidPlatform(runOptions);
            case "exponent":
                return new exponentPlatform_1.ExponentPlatform(runOptions);
            default:
                return new generalMobilePlatform_1.GeneralMobilePlatform(runOptions);
        }
    }
}
exports.PlatformResolver = PlatformResolver;

//# sourceMappingURL=platformResolver.js.map
