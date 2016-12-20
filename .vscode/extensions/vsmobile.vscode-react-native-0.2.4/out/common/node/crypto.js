// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var crypto = require("crypto");
var Crypto = (function () {
    function Crypto() {
    }
    Crypto.prototype.hash = function (data) {
        var hasher = crypto.createHash("sha256");
        hasher.update(data);
        return hasher.digest("hex");
    };
    return Crypto;
}());
exports.Crypto = Crypto;

//# sourceMappingURL=crypto.js.map
