"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const quick_pick_image_1 = require("./utils/quick-pick-image");
const docker_endpoint_1 = require("./utils/docker-endpoint");
const cp = require("child_process");
const os = require("os");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.container.start';
function doStartContainer(interactive) {
    quick_pick_image_1.quickPickImage(false).then(function (selectedItem) {
        if (selectedItem) {
            let option = interactive ? '-it' : '';
            let terminal = vscode.window.createTerminal(selectedItem.label);
            terminal.sendText(`docker run ${option} --rm ${selectedItem.label}`);
            terminal.show();
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('command', {
                    command: interactive ? teleCmdId + '.interactive' : teleCmdId
                });
            }
        }
    });
}
function startContainer() {
    doStartContainer(false);
}
exports.startContainer = startContainer;
function startContainerInteractive() {
    doStartContainer(true);
}
exports.startContainerInteractive = startContainerInteractive;
function startAzureCLI() {
    // block of we are running windows containers... 
    docker_endpoint_1.docker.getEngineType().then((engineType) => {
        if (engineType === docker_endpoint_1.DockerEngineType.Windows) {
            vscode.window.showErrorMessage('Currently, you can only run the Azure CLI when running Linux based containers.', {
                title: 'More Information',
            }, {
                title: 'Close',
                isCloseAffordance: true
            }).then((selected) => {
                if (!selected || selected.isCloseAffordance) {
                    return;
                }
                return cp.exec('start https://docs.docker.com/docker-for-windows/#/switch-between-windows-and-linux-containers');
            });
        }
        else {
            let option = process.platform === 'linux' ? '--net=host' : '';
            // volume map .azure folder so don't have to log in every time
            let homeDir = process.platform === 'win32' ? os.homedir().replace(/\\/g, '/') : os.homedir();
            let vol = '-v ' + homeDir + '/.azure:/root/.azure';
            let cmd = `docker run ${option} ${vol} -it --rm azuresdk/azure-cli-python:latest`;
            let terminal = vscode.window.createTerminal('Azure CLI');
            terminal.sendText(cmd);
            terminal.show();
            if (telemetry_1.reporter) {
                telemetry_1.reporter.sendTelemetryEvent('command', {
                    command: teleCmdId + '.azurecli'
                });
            }
        }
    });
}
exports.startAzureCLI = startAzureCLI;
//# sourceMappingURL=start-container.js.map