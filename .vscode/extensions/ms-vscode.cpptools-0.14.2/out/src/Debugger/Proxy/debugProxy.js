Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const util = require("./debugProxyUtils");
const debugProtocol_1 = require("./debugProtocol");
function proxy() {
    util.checkLockFile().
        then(function (fileExists) {
        var payload = "";
        if (fileExists) {
            payload = debugProtocol_1.serializeProtocolEvent(new debugProtocol_1.InitializationErrorResponse("Internal package.json error encountered. Please reinstall the C/C++ extension for Visual Studio Code."));
        }
        else {
            payload = debugProtocol_1.serializeProtocolEvent(new debugProtocol_1.InitializationErrorResponse("Unable to start debugging.  Please wait for the C++ Debugger to finish installation and then reload."));
        }
        process.stdout.write(payload);
        util.logToFile(payload);
    })
        .catch(function (reason) {
        util.logToFile(`Promise failed: ${reason}`);
    });
}
function startDebugChildProcess(targetProcess, args, workingFolder) {
    var promise = new Promise(function (resolve, reject) {
        const child = child_process.spawn(targetProcess, args, { cwd: workingFolder });
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(code.toString()));
            }
            else {
                resolve();
            }
        });
        start(process.stdin, process.stdout, child);
    });
    return promise;
}
function start(inStream, outStream, child) {
    inStream.setEncoding('utf8');
    child.on('error', (data) => {
        util.logToFile(`Child error: ${data}`);
    });
    process.on('SIGTERM', () => {
        child.kill();
        process.exit(0);
    });
    process.on('SIGHUP', () => {
        child.kill();
        process.exit(0);
    });
    inStream.on('error', (error) => {
        util.logToFile(`Instream error: ${error}`);
    });
    outStream.on('error', (error) => {
        util.logToFile(`Outstream error: ${error}`);
    });
    child.stdout.on('data', (data) => {
        outStream.write(data);
    });
    inStream.on('data', (data) => {
        child.stdin.write(data);
    });
    inStream.resume();
}
proxy();
//# sourceMappingURL=debugProxy.js.map