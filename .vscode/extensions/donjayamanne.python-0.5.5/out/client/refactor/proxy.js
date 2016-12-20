'use strict';
const vscode = require('vscode');
const path = require('path');
const child_process = require('child_process');
const telemetryContracts_1 = require('../common/telemetryContracts');
const telemetry_1 = require('../common/telemetry');
const utils_1 = require('../common/utils');
class RefactorProxy extends vscode.Disposable {
    constructor(extensionDir, pythonSettings, workspaceRoot = vscode.workspace.rootPath) {
        super(() => { });
        this.pythonSettings = pythonSettings;
        this.workspaceRoot = workspaceRoot;
        this._previousOutData = '';
        this._previousStdErrData = '';
        this._startedSuccessfully = false;
        this._extensionDir = extensionDir;
    }
    dispose() {
        try {
            this._process.kill();
        }
        catch (ex) {
        }
        this._process = null;
    }
    getOffsetAt(document, position) {
        if (!utils_1.IS_WINDOWS) {
            return document.offsetAt(position);
        }
        // get line count
        // Rope always uses LF, instead of CRLF on windows, funny isn't it
        // So for each line, reduce one characer (for CR)
        const offset = document.offsetAt(position);
        return offset - position.line;
    }
    rename(document, name, filePath, range, options) {
        if (!options) {
            options = vscode.window.activeTextEditor.options;
        }
        let command = {
            "lookup": "rename",
            "file": filePath,
            "start": this.getOffsetAt(document, range.start).toString(),
            "id": "1",
            "name": name,
            "indent_size": options.tabSize
        };
        return this.sendCommand(JSON.stringify(command), telemetryContracts_1.REFACTOR.Rename);
    }
    extractVariable(document, name, filePath, range, options) {
        if (!options) {
            options = vscode.window.activeTextEditor.options;
        }
        let command = {
            "lookup": "extract_variable",
            "file": filePath,
            "start": this.getOffsetAt(document, range.start).toString(),
            "end": this.getOffsetAt(document, range.end).toString(),
            "id": "1",
            "name": name,
            "indent_size": options.tabSize
        };
        return this.sendCommand(JSON.stringify(command), telemetryContracts_1.REFACTOR.ExtractVariable);
    }
    extractMethod(document, name, filePath, range, options) {
        if (!options) {
            options = vscode.window.activeTextEditor.options;
        }
        // Ensure last line is an empty line
        if (!document.lineAt(document.lineCount - 1).isEmptyOrWhitespace && range.start.line === document.lineCount - 1) {
            return Promise.reject('Missing blank line at the end of document (PEP8).');
        }
        let command = {
            "lookup": "extract_method",
            "file": filePath,
            "start": this.getOffsetAt(document, range.start).toString(),
            "end": this.getOffsetAt(document, range.end).toString(),
            "id": "1",
            "name": name,
            "indent_size": options.tabSize
        };
        return this.sendCommand(JSON.stringify(command), telemetryContracts_1.REFACTOR.ExtractMethod);
    }
    sendCommand(command, telemetryEvent) {
        let timer = new telemetry_1.Delays();
        return this.initialize(this.pythonSettings.pythonPath).then(() => {
            return new Promise((resolve, reject) => {
                this._commandResolve = resolve;
                this._commandReject = reject;
                this._process.stdin.write(command + '\n');
            });
        }).then(value => {
            timer.stop();
            telemetry_1.sendTelemetryEvent(telemetryEvent, null, timer.toMeasures());
            return value;
        }).catch(reason => {
            timer.stop();
            telemetry_1.sendTelemetryEvent(telemetryEvent, null, timer.toMeasures());
            return Promise.reject(reason);
        });
    }
    initialize(pythonPath) {
        return new Promise((resolve, reject) => {
            this._initializeReject = reject;
            let environmentVariables = { 'PYTHONUNBUFFERED': '1' };
            for (let setting in process.env) {
                if (!environmentVariables[setting]) {
                    environmentVariables[setting] = process.env[setting];
                }
            }
            this._process = child_process.spawn(pythonPath, ['refactor.py', this.workspaceRoot], {
                cwd: path.join(this._extensionDir, 'pythonFiles'),
                env: environmentVariables
            });
            this._process.stderr.setEncoding('utf8');
            this._process.stderr.on('data', this.handleStdError.bind(this));
            this._process.on('error', this.handleError.bind(this));
            let that = this;
            this._process.stdout.setEncoding('utf8');
            this._process.stdout.on('data', (data) => {
                let dataStr = data + '';
                if (!that._startedSuccessfully && dataStr.startsWith('STARTED')) {
                    that._startedSuccessfully = true;
                    return resolve();
                }
                that.onData(data);
            });
        });
    }
    handleStdError(data) {
        // Possible there was an exception in parsing the data returned
        // So append the data then parse it
        let dataStr = this._previousStdErrData = this._previousStdErrData + data + '';
        let errorResponse;
        try {
            errorResponse = dataStr.split(/\r?\n/g).filter(line => line.length > 0).map(resp => JSON.parse(resp));
            this._previousStdErrData = '';
        }
        catch (ex) {
            console.error(ex);
            // Possible we've only received part of the data, hence don't clear previousData
            return;
        }
        if (typeof errorResponse[0].message !== 'string' || errorResponse[0].message.length === 0) {
            errorResponse[0].message = errorResponse[0].traceback.split(/\r?\n/g).pop();
        }
        let errorMessage = errorResponse[0].message + '\n' + errorResponse[0].traceback;
        if (this._startedSuccessfully) {
            this._commandReject(`Refactor failed. ${errorMessage}`);
        }
        else {
            this._initializeReject(`Refactor failed. ${errorMessage}`);
        }
    }
    handleError(error) {
        if (this._startedSuccessfully) {
            return this._commandReject(error);
        }
        this._initializeReject(error);
    }
    onData(data) {
        if (!this._commandResolve) {
            return;
        }
        // Possible there was an exception in parsing the data returned
        // So append the data then parse it
        let dataStr = this._previousOutData = this._previousOutData + data + '';
        let response;
        try {
            response = dataStr.split(/\r?\n/g).filter(line => line.length > 0).map(resp => JSON.parse(resp));
            this._previousOutData = '';
        }
        catch (ex) {
            // Possible we've only received part of the data, hence don't clear previousData
            return;
        }
        this.dispose();
        this._commandResolve(response[0]);
        this._commandResolve = null;
    }
}
exports.RefactorProxy = RefactorProxy;
//# sourceMappingURL=proxy.js.map