/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const common_1 = require("./common");
const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
function getSystemProxyURL(requestURL) {
    if (requestURL.protocol === 'http:') {
        return process.env.HTTP_PROXY || process.env.http_proxy || null;
    }
    else if (requestURL.protocol === 'https:') {
        return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
    }
    return null;
}
function getProxyAgent(requestURL, proxy, strictSSL) {
    const proxyURL = proxy || getSystemProxyURL(requestURL);
    if (!proxyURL) {
        return null;
    }
    const proxyEndpoint = url_1.parse(proxyURL);
    if (!/^https?:$/.test(proxyEndpoint.protocol)) {
        return null;
    }
    const opts = {
        host: proxyEndpoint.hostname,
        port: Number(proxyEndpoint.port),
        auth: proxyEndpoint.auth,
        rejectUnauthorized: common_1.isBoolean(strictSSL) ? strictSSL : true
    };
    return requestURL.protocol === 'http:' ? new HttpProxyAgent(opts) : new HttpsProxyAgent(opts);
}
exports.getProxyAgent = getProxyAgent;
//# sourceMappingURL=proxy.js.map