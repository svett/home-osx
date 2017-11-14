"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Docker = require("dockerode");
var DockerEngineType;
(function (DockerEngineType) {
    DockerEngineType[DockerEngineType["Linux"] = 0] = "Linux";
    DockerEngineType[DockerEngineType["Windows"] = 1] = "Windows";
})(DockerEngineType = exports.DockerEngineType || (exports.DockerEngineType = {}));
class DockerClient {
    constructor() {
        // Pass no options so that the defaultOpts of docker-modem will be used
        this.endPoint = new Docker();
    }
    getContainerDescriptors(opts) {
        return new Promise((resolve, reject) => {
            if (!opts) {
                let opts = {};
            }
            this.endPoint.listContainers(opts, (err, containers) => {
                if (err) {
                    return reject(err);
                }
                return resolve(containers);
            });
        });
    }
    ;
    getImageDescriptors(opts) {
        return new Promise((resolve, reject) => {
            if (!opts) {
                let opts = {};
            }
            this.endPoint.listImages(opts, (err, images) => {
                if (err) {
                    return reject(err);
                }
                return resolve(images);
            });
        });
    }
    ;
    getContainer(id) {
        return this.endPoint.getContainer(id);
    }
    getEngineType() {
        if (process.platform === 'win32') {
            return new Promise((resolve, reject) => {
                this.endPoint.info((error, info) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(info.OSType === "windows" ? DockerEngineType.Windows : DockerEngineType.Linux);
                });
            });
        }
        ;
        // On Linux or macOS, this can only ever be linux,
        // so short-circuit the Docker call entirely.
        return Promise.resolve(DockerEngineType.Linux);
    }
    getEngineInfo() {
        return new Promise((resolve, reject) => {
            this.endPoint.info((error, info) => {
                if (error) {
                    return reject(error);
                }
                return resolve(info);
            });
        });
    }
    getExposedPorts(imageId) {
        return new Promise((resolve, reject) => {
            this.getImage(imageId).inspect((error, { Config: { ExposedPorts = {} } }) => {
                const ports = Object.keys(ExposedPorts).map((port) => port.split("/")[0]);
                resolve(ports);
            });
        });
    }
    getImage(id) {
        return this.endPoint.getImage(id);
    }
}
exports.docker = new DockerClient();
//# sourceMappingURL=docker-endpoint.js.map