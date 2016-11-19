/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var path = require('path');
var child_process = require('child_process');
var util_1 = require('./util');
var common = require('./../common');
var logger_1 = require('./../logger');
var ProxyErrorResponse = (function () {
    function ProxyErrorResponse(message) {
        this.message = message;
        this.request_seq = 1;
        this.seq = 1;
        this.type = "response";
        this.success = false;
        this.command = "initialize";
    }
    return ProxyErrorResponse;
}());
function serializeProtocolEvent(message) {
    var payload = JSON.stringify(message);
    var finalPayload = "Content-Length: " + payload.length + "\r\n\r\n" + payload;
    return finalPayload;
}
function sendErrorMessage(message) {
    process.stdout.write(serializeProtocolEvent(new ProxyErrorResponse(message)));
}
function sendStillDownloadingMessage() {
    sendErrorMessage('The .NET Core Debugger is still being downloaded. See the C# Output Window for more information.');
}
function sendDownloadingNotStartedMessage() {
    sendErrorMessage('Run \'Debug: Download .NET Core Debugger\' in the Command Palette or open a .NET project directory to download the .NET Core Debugger');
}
// The default extension manifest calls this proxy as the debugger program
// When installation of the debugger components finishes, the extension manifest is rewritten so that this proxy is no longer called
// If the debugger components have not finished downloading, the proxy displays an error message to the user
// If the debugger components have finished downloading, the manifest has been rewritten but has not been reloaded. 
// This proxy will still be called and launch OpenDebugAD7 as a child process.
// During subsequent code sessions, the rewritten manifest will be loaded and this proxy will no longer be called. 
function proxy() {
    var extensionPath = path.resolve(__dirname, '../../../');
    common.setExtensionPath(extensionPath);
    var logger = new logger_1.Logger(function (text) { console.log(text); });
    var util = new util_1.CoreClrDebugUtil(extensionPath, logger);
    if (!util_1.CoreClrDebugUtil.existsSync(util.installCompleteFilePath())) {
        // our install.complete file does not exist yet, meaning we have not rewritten our manifest yet. Try to figure out what if anything the package manager is doing
        // the order in which files are dealt with is this:
        // 1. install.Begin is created
        // 2. install.Lock is created
        // 3. install.Begin is deleted
        // 4. install.complete is created
        //first check if dotnet is on the path and new enough
        util.checkDotNetCli()
            .then(function (dotnetInfo) {
            // next check if we have begun installing packages
            common.installFileExists(common.InstallFileType.Begin)
                .then(function (beginExists) {
                if (beginExists) {
                    // packages manager has begun
                    sendStillDownloadingMessage();
                }
                else {
                    // begin doesn't exist. There is a chance we finished downloading and begin had been deleted. Check if lock exists
                    common.installFileExists(common.InstallFileType.Lock)
                        .then(function (lockExists) {
                        if (lockExists) {
                            // packages have finished installing but we had not finished rewriting our manifest when F5 came in
                            sendStillDownloadingMessage();
                        }
                        else {
                            // no install files existed when we checked. we have likely not been activated
                            sendDownloadingNotStartedMessage();
                        }
                    });
                }
            });
        }, function (err) {
            // error from checkDotNetCli
            sendErrorMessage(err.ErrorMessage || util.defaultDotNetCliErrorMessage());
        });
    }
    else {
        // debugger has finished install and manifest has been rewritten, kick off our debugger process
        new Promise(function (resolve, reject) {
            var processPath = path.join(util.debugAdapterDir(), "OpenDebugAD7" + util_1.CoreClrDebugUtil.getPlatformExeExtension());
            var args = process.argv.slice(2);
            // do not explicitly set a current working dir
            // this seems to match what code does when OpenDebugAD7 is launched directly from the manifest
            var child = child_process.spawn(processPath, args);
            // If we don't exit cleanly from the child process, log the error.
            child.on('close', function (code) {
                if (code !== 0) {
                    reject(new Error(code.toString()));
                }
                else {
                    resolve();
                }
            });
            process.stdin.setEncoding('utf8');
            child.on('error', function (data) {
                logger.appendLine("Child error: " + data);
            });
            process.on('SIGTERM', function () {
                child.kill();
                process.exit(0);
            });
            process.on('SIGHUP', function () {
                child.kill();
                process.exit(0);
            });
            process.stdin.on('error', function (error) {
                logger.appendLine("process.stdin error: " + error);
            });
            process.stdout.on('error', function (error) {
                logger.appendLine("process.stdout error: " + error);
            });
            child.stdout.on('data', function (data) {
                process.stdout.write(data);
            });
            process.stdin.on('data', function (data) {
                child.stdin.write(data);
            });
            process.stdin.resume();
        }).catch(function (err) {
            logger.appendLine(err);
        });
    }
}
proxy();
//# sourceMappingURL=proxy.js.map