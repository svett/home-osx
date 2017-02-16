"use strict";
var fs = require('fs');
var vscode = require('vscode');
var util = require("./common");
var outputChannel;
function getOutputChannel() {
    if (outputChannel == undefined)
        outputChannel = vscode.window.createOutputChannel("C/C++");
    return outputChannel;
}
exports.getOutputChannel = getOutputChannel;
function allowExecution(file) {
    return new Promise(function (resolve, reject) {
        if (process.platform != 'win32') {
            util.checkFileExists(file).then(function (exists) {
                if (exists) {
                    fs.chmod(file, '755', function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                }
                else {
                    getOutputChannel().appendLine("");
                    getOutputChannel().appendLine("Warning: Expected file " + file + " is missing.");
                    resolve();
                }
            });
        }
        else {
            resolve();
        }
    });
}
exports.allowExecution = allowExecution;
//# sourceMappingURL=common_vscode.js.map