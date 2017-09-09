'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
const util_2 = require("./util");
const goPath_1 = require("./goPath");
class GoImplementationProvider {
    provideImplementation(document, position, token) {
        return new Promise((resolve, reject) => {
            if (token.isCancellationRequested) {
                return resolve(null);
            }
            let env = util_2.getToolsEnvVars();
            let listProcess = cp.execFile(goPath_1.getGoRuntimePath(), ['list', '-e', '-json'], { cwd: vscode.workspace.rootPath, env }, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                let listOutput = JSON.parse(stdout.toString());
                let scope = listOutput.ImportPath;
                let filename = util_1.canonicalizeGOPATHPrefix(document.fileName);
                let cwd = path.dirname(filename);
                let offset = util_1.byteOffsetAt(document, position);
                let goGuru = util_1.getBinPath('guru');
                let buildTags = '"' + vscode.workspace.getConfiguration('go')['buildTags'] + '"';
                let args = ['-scope', `${scope}/...`, '-json', '-tags', buildTags, 'implements', `${filename}:#${offset.toString()}`];
                let guruProcess = cp.execFile(goGuru, args, { env }, (err, stdout, stderr) => {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('guru');
                        return resolve(null);
                    }
                    if (err) {
                        return reject(err);
                    }
                    let guruOutput = JSON.parse(stdout.toString());
                    let results = [];
                    let addResults = list => {
                        list.forEach(ref => {
                            let match = /^(.*):(\d+):(\d+)/.exec(ref.pos);
                            if (!match)
                                return;
                            let [_, file, lineStartStr, colStartStr] = match;
                            let referenceResource = vscode.Uri.file(path.resolve(cwd, file));
                            let range = new vscode.Range(+lineStartStr - 1, +colStartStr - 1, +lineStartStr - 1, +colStartStr);
                            results.push(new vscode.Location(referenceResource, range));
                        });
                    };
                    // If we looked for implementation of method go to method implementations only
                    if (guruOutput.to_method) {
                        addResults(guruOutput.to_method);
                    }
                    else if (guruOutput.to) {
                        addResults(guruOutput.to);
                    }
                    return resolve(results);
                });
                token.onCancellationRequested(() => guruProcess.kill());
            });
            token.onCancellationRequested(() => listProcess.kill());
        });
    }
}
exports.GoImplementationProvider = GoImplementationProvider;
//# sourceMappingURL=goImplementations.js.map