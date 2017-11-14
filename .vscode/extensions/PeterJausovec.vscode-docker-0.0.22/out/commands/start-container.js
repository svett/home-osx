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
const vscode = require("vscode");
const quick_pick_image_1 = require("./utils/quick-pick-image");
const docker_endpoint_1 = require("./utils/docker-endpoint");
const cp = require("child_process");
const os = require("os");
const telemetry_1 = require("../telemetry/telemetry");
const teleCmdId = 'vscode-docker.container.start';
function startContainer(context, interactive) {
    return __awaiter(this, void 0, void 0, function* () {
        let imageName;
        let imageToStart;
        if (context && context.imageDesc) {
            imageToStart = context.imageDesc;
            imageName = context.label;
        }
        else {
            const selectedItem = yield quick_pick_image_1.quickPickImage(false);
            if (selectedItem) {
                imageToStart = selectedItem.imageDesc;
                imageName = selectedItem.label;
            }
        }
        if (imageToStart) {
            docker_endpoint_1.docker.getExposedPorts(imageToStart.Id).then((ports) => {
                let options = `--rm ${interactive ? '-it' : '-d'}`;
                if (ports.length) {
                    const portMappings = ports.map((port) => `-p ${port}:${port}`);
                    options += ` ${portMappings.join(' ')}`;
                }
                const terminal = vscode.window.createTerminal(imageName);
                terminal.sendText(`docker run ${options} ${imageName}`);
                terminal.show();
                if (telemetry_1.reporter) {
                    telemetry_1.reporter.sendTelemetryEvent('command', {
                        command: interactive ? teleCmdId + '.interactive' : teleCmdId
                    });
                }
            });
        }
    });
}
exports.startContainer = startContainer;
function startContainerInteractive(context) {
    return __awaiter(this, void 0, void 0, function* () {
        yield startContainer(context, true);
    });
}
exports.startContainerInteractive = startContainerInteractive;
function startAzureCLI() {
    return __awaiter(this, void 0, void 0, function* () {
        // block of we are running windows containers... 
        const engineType = yield docker_endpoint_1.docker.getEngineType();
        if (engineType === docker_endpoint_1.DockerEngineType.Windows) {
            const selected = yield vscode.window.showErrorMessage('Currently, you can only run the Azure CLI when running Linux based containers.', {
                title: 'More Information',
            }, {
                title: 'Close',
                isCloseAffordance: true
            });
            if (!selected || selected.isCloseAffordance) {
                return;
            }
            return cp.exec('start https://docs.docker.com/docker-for-windows/#/switch-between-windows-and-linux-containers');
        }
        else {
            const option = process.platform === 'linux' ? '--net=host' : '';
            // volume map .azure folder so don't have to log in every time
            const homeDir = process.platform === 'win32' ? os.homedir().replace(/\\/g, '/') : os.homedir();
            const vol = `-v ${homeDir}/.azure:/root/.azure -v ${homeDir}/.ssh:/root/.ssh -v ${homeDir}/.kube:/root/.kube`;
            const cmd = `docker run ${option} ${vol} -it --rm azuresdk/azure-cli-python:latest`;
            const terminal = vscode.window.createTerminal('Azure CLI');
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