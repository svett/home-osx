"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
function execAzCLI(command) {
    return new Promise((resolve, reject) => {
        cp.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            resolve(stdout);
        });
    });
}
exports.execAzCLI = execAzCLI;
//# sourceMappingURL=runAzCLI.js.map