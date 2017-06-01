// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const path = require("path");
const child_process = require("child_process");
const scriptImporter_1 = require("./scriptImporter");
const log_1 = require("../common/log/log");
const logHelper_1 = require("../common/log/logHelper");
const errorHelper_1 = require("../common/error/errorHelper");
function printDebuggingError(message, reason) {
    log_1.Log.logWarning(errorHelper_1.ErrorHelper.getNestedWarning(reason, `${message}. Debugging won't work: Try reloading the JS from inside the app, or Reconnect the VS Code debugger`));
}
/** This class will run the RN App logic inside a forked Node process. The framework to run the logic is provided by the file
 * debuggerWorker.js (designed to run on a WebWorker). We add a couple of tweaks (mostly to polyfill WebWorker API) to that
 * file and load it inside of a process.
 * On this side we listen to IPC messages and either respond to them or redirect them to packager via MultipleLifetimeAppWorker's
 * instance. We also intercept packager's signal to load the bundle's code and mutate the message with path to file we've downloaded
 * to let importScripts function take this file.
 */
class ForkedAppWorker {
    constructor(packagerPort, sourcesStoragePath, postReplyToApp) {
        this.packagerPort = packagerPort;
        this.sourcesStoragePath = sourcesStoragePath;
        this.postReplyToApp = postReplyToApp;
        this.debuggeeProcess = null;
        /** A deferred that we use to make sure that worker has been loaded completely defore start sending IPC messages */
        this.workerLoaded = Q.defer();
        this.scriptImporter = new scriptImporter_1.ScriptImporter(packagerPort, sourcesStoragePath);
    }
    stop() {
        if (this.debuggeeProcess) {
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, `About to kill debuggee with pid ${this.debuggeeProcess.pid}`);
            this.debuggeeProcess.kill();
            this.debuggeeProcess = null;
        }
    }
    start() {
        let scriptToRunPath = path.resolve(this.sourcesStoragePath, scriptImporter_1.ScriptImporter.DEBUGGER_WORKER_FILENAME);
        const port = Math.round(Math.random() * 40000 + 3000);
        // Note that we set --debug-brk flag to pause the process on the first line - this is
        // required for debug adapter to set the breakpoints BEFORE the debuggee has started.
        // The adapter will continue execution once it's done with breakpoints.
        const nodeArgs = [`--inspect=${port}`, "--debug-brk", scriptToRunPath];
        // Start child Node process in debugging mode
        this.debuggeeProcess = child_process.spawn("node", nodeArgs, {
            stdio: ["pipe", "pipe", "pipe", "ipc"],
        })
            .on("message", (message) => {
            // 'workerLoaded' is a special message that indicates that worker is done with loading.
            // We need to wait for it before doing any IPC because process.send doesn't seems to care
            // about whether the messahe has been received or not and the first messages are often get
            // discarded by spawned process
            if (message && message.workerLoaded) {
                this.workerLoaded.resolve(void 0);
                return;
            }
            this.postReplyToApp(message);
        })
            .on("error", (error) => {
            log_1.Log.logWarning(error);
        });
        // Resolve with port debugger server is listening on
        // This will be sent to subscribers of MLAppWorker in "connected" event
        log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, `Spawned debuggee process with pid ${this.debuggeeProcess.pid} listening to ${port}`);
        return Q.resolve(port);
    }
    postMessage(rnMessage) {
        // Before sending messages, make sure that the worker is loaded
        this.workerLoaded.promise
            .then(() => {
            if (rnMessage.method !== "executeApplicationScript")
                return Q.resolve(rnMessage);
            // When packager asks worker to load bundle we download that bundle and
            // then set url field to point to that downloaded bundle, so the worker
            // will take our modified bundle
            log_1.Log.logInternalMessage(logHelper_1.LogLevel.Info, "Packager requested runtime to load script from " + rnMessage.url);
            return this.scriptImporter.downloadAppScript(rnMessage.url)
                .then(downloadedScript => {
                return Object.assign({}, rnMessage, { url: downloadedScript.filepath });
            });
        })
            .done((message) => this.debuggeeProcess.send({ data: message }), reason => printDebuggingError(`Couldn't import script at <${rnMessage.url}>`, reason));
    }
}
exports.ForkedAppWorker = ForkedAppWorker;

//# sourceMappingURL=forkedAppWorker.js.map
