// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var http = require("http");
var Q = require("q");
var Request = (function () {
    function Request() {
    }
    Request.prototype.request = function (url, expectStatusOK) {
        if (expectStatusOK === void 0) { expectStatusOK = false; }
        var deferred = Q.defer();
        var req = http.get(url, function (res) {
            var responseString = "";
            res.on("data", function (data) {
                responseString += data.toString();
            });
            res.on("end", function () {
                if (expectStatusOK && res.statusCode !== 200) {
                    deferred.reject(new Error(responseString));
                }
                else {
                    deferred.resolve(responseString);
                }
            });
        });
        req.on("error", function (err) {
            deferred.reject(err);
        });
        return deferred.promise;
    };
    return Request;
}());
exports.Request = Request;

//# sourceMappingURL=request.js.map
