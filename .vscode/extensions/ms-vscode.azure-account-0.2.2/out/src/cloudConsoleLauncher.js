"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise");
const WS = require("ws");
const consoleApiVersion = '2017-08-01-preview';
var Errors;
(function (Errors) {
    Errors["DeploymentOsTypeConflict"] = "DeploymentOsTypeConflict";
})(Errors = exports.Errors || (exports.Errors = {}));
function getConsoleUri(armEndpoint) {
    return `${armEndpoint}/providers/Microsoft.Portal/consoles/default?api-version=${consoleApiVersion}`;
}
function getUserSettings(accessToken, armEndpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetUri = `${armEndpoint}/providers/Microsoft.Portal/userSettings/cloudconsole?api-version=${consoleApiVersion}`;
        const response = yield request({
            uri: targetUri,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            simple: false,
            resolveWithFullResponse: true,
            json: true,
        });
        if (response.statusCode < 200 || response.statusCode > 299) {
            // if (response.body && response.body.error && response.body.error.message) {
            // 	console.log(`${response.body.error.message} (${response.statusCode})`);
            // } else {
            // 	console.log(response.statusCode, response.headers, response.body);
            // }
            return;
        }
        return response.body && response.body.properties;
    });
}
exports.getUserSettings = getUserSettings;
function provisionConsole(accessToken, armEndpoint, userSettings, osType) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = yield createTerminal(accessToken, armEndpoint, userSettings, osType, true);
        for (let i = 0; i < 10; i++, response = yield createTerminal(accessToken, armEndpoint, userSettings, osType, false)) {
            if (response.statusCode < 200 || response.statusCode > 299) {
                if (response.statusCode === 409 && response.body && response.body.error && response.body.error.code === Errors.DeploymentOsTypeConflict) {
                    throw new Error(Errors.DeploymentOsTypeConflict);
                }
                else if (response.body && response.body.error && response.body.error.message) {
                    throw new Error(`${response.body.error.message} (${response.statusCode})`);
                }
                else {
                    throw new Error(`${response.statusCode} ${response.headers} ${response.body}`);
                }
            }
            const consoleResource = response.body;
            if (consoleResource.properties.provisioningState === 'Succeeded') {
                return consoleResource.properties.uri;
            }
            else if (consoleResource.properties.provisioningState === 'Failed') {
                break;
            }
        }
        throw new Error(`Sorry, your Cloud Shell failed to provision. Please retry later. Request correlation id: ${response.headers['x-ms-routing-request-id']}`);
    });
}
exports.provisionConsole = provisionConsole;
function createTerminal(accessToken, armEndpoint, userSettings, osType, initial) {
    return __awaiter(this, void 0, void 0, function* () {
        return request({
            uri: getConsoleUri(armEndpoint),
            method: initial ? 'PUT' : 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'x-ms-console-preferred-location': userSettings.preferredLocation
            },
            simple: false,
            resolveWithFullResponse: true,
            json: true,
            body: initial ? {
                properties: {
                    osType
                }
            } : undefined
        });
    });
}
function resetConsole(accessToken, armEndpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield request({
            uri: getConsoleUri(armEndpoint),
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            simple: false,
            resolveWithFullResponse: true,
            json: true
        });
        if (response.statusCode < 200 || response.statusCode > 299) {
            if (response.body && response.body.error && response.body.error.message) {
                throw new Error(`${response.body.error.message} (${response.statusCode})`);
            }
            else {
                throw new Error(`${response.statusCode} ${response.headers} ${response.body}`);
            }
        }
    });
}
exports.resetConsole = resetConsole;
function connectTerminal(accessToken, consoleUri) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Connecting terminal...');
        for (let i = 0; i < 10; i++) {
            const response = yield initializeTerminal(accessToken, consoleUri);
            if (response.statusCode < 200 || response.statusCode > 299) {
                if (response.statusCode !== 503 && response.statusCode !== 504 && response.body && response.body.error) {
                    if (response.body && response.body.error && response.body.error.message) {
                        console.log(`${response.body.error.message} (${response.statusCode})`);
                    }
                    else {
                        console.log(response.statusCode, response.headers, response.body);
                    }
                    break;
                }
                yield delay(1000 * (i + 1));
                console.log(`\x1b[AConnecting terminal...${'.'.repeat(i + 1)}`);
                continue;
            }
            const res = response.body;
            const termId = res.id;
            // terminalIdleTimeout = res.idleTimeout || terminalIdleTimeout;
            connectSocket(res.socketUri);
            process.stdout.on('resize', () => {
                resize(accessToken, consoleUri, termId)
                    .catch(console.error);
            });
            return;
        }
        console.log('Failed to connect to the terminal.');
    });
}
function initializeTerminal(accessToken, consoleUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const initialGeometry = getWindowSize();
        return request({
            uri: consoleUri + '/terminals?cols=' + initialGeometry.cols + '&rows=' + initialGeometry.rows,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            simple: false,
            resolveWithFullResponse: true,
            json: true,
            body: {
                tokens: []
            }
        });
    });
}
function getWindowSize() {
    const stdout = process.stdout;
    const windowSize = stdout.isTTY ? stdout.getWindowSize() : [80, 30];
    return {
        cols: windowSize[0],
        rows: windowSize[1],
    };
}
let resizeToken = {};
function resize(accessToken, consoleUri, termId) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = resizeToken = {};
        yield delay(300);
        for (let i = 0; i < 10; i++) {
            if (token !== resizeToken) {
                return;
            }
            const { cols, rows } = getWindowSize();
            const response = yield request({
                uri: consoleUri + '/terminals/' + termId + '/size?cols=' + cols + '&rows=' + rows,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                simple: false,
                resolveWithFullResponse: true,
                json: true,
            });
            if (response.statusCode < 200 || response.statusCode > 299) {
                if (response.statusCode !== 503 && response.statusCode !== 504 && response.body && response.body.error) {
                    if (response.body && response.body.error && response.body.error.message) {
                        console.log(`${response.body.error.message} (${response.statusCode})`);
                    }
                    else {
                        console.log(response.statusCode, response.headers, response.body);
                    }
                    break;
                }
                yield delay(1000 * (i + 1));
                continue;
            }
            return;
        }
        console.log('Failed to resize terminal.');
    });
}
function connectSocket(url) {
    const ws = new WS(url);
    ws.on('open', function () {
        process.stdin.on('data', function (data) {
            ws.send(data);
        });
    });
    ws.on('message', function (data) {
        process.stdout.write(String(data));
    });
    let error = false;
    ws.on('error', function (event) {
        error = true;
        console.error('Socket error: ' + JSON.stringify(event));
    });
    ws.on('close', function () {
        console.log('Socket closed');
        if (!error) {
            process.exit(0);
        }
    });
}
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
function runInTerminal(accessToken, consoleUri) {
    return __awaiter(this, void 0, void 0, function* () {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        return connectTerminal(accessToken, consoleUri);
    });
}
function main() {
    const accessToken = process.env.CLOUD_CONSOLE_ACCESS_TOKEN;
    const consoleUri = process.env.CLOUD_CONSOLE_URI;
    runInTerminal(accessToken, consoleUri)
        .catch(console.error);
}
exports.main = main;
//# sourceMappingURL=cloudConsoleLauncher.js.map