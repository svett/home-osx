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
const path = require("path");
const fs = require("fs");
const config_utils_1 = require("./config-utils");
const telemetry_1 = require("../telemetry/telemetry");
function genDockerFile(serviceName, platform, port, { cmd, author, version }) {
    switch (platform.toLowerCase()) {
        case 'node.js':
            return `FROM node:6-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY ["package.json", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE ${port}
CMD ${cmd}`;
        case 'go':
            return `
# golang:onbuild automatically copies the package source, 
# fetches the application dependencies, builds the program, 
# and configures it to run on startup 
FROM golang:onbuild
LABEL Name=${serviceName} Version=${version} 
EXPOSE ${port}

# For more control, you can copy and build manually
# FROM golang:latest 
# LABEL Name=${serviceName} Version=${version} 
# RUN mkdir /app 
# ADD . /app/ 
# WORKDIR /app 
# RUN go build -o main .
# EXPOSE ${port} 
# CMD ["/app/main"]
`;
        case '.net core':
            return `
FROM microsoft/aspnetcore:1
LABEL Name=${serviceName} Version=${version} 
ARG source=.
WORKDIR /app
EXPOSE ${port}
COPY $source .
ENTRYPOINT dotnet ${serviceName}.dll
`;
        default:
            return `
FROM docker/whalesay:latest
LABEL Name=${serviceName} Version=${version} 
RUN apt-get -y update && apt-get install -y fortunes
CMD /usr/games/fortune -a | cowsay
`;
    }
}
function genDockerCompose(serviceName, platform, port) {
    switch (platform.toLowerCase()) {
        case 'node.js':
            return `version: '2.1'

services:
  ${serviceName}:
    image: ${serviceName}
    build: .
    environment:
      NODE_ENV: production
    ports:
      - ${port}:${port}`;
        case 'go':
            return `version: '2.1'

services:
  ${serviceName}:
    image: ${serviceName}
    build: .
    ports:
      - ${port}:${port}`;
        case '.net core':
            return `version: '2.1'

services:
  ${serviceName}:
    image: ${serviceName}
    build: .
    ports:
      - ${port}:${port}`;
        default:
            return `version: '2.1'

services:
  ${serviceName}:
    image: ${serviceName}
    build: .
    ports:
      - ${port}:${port}`;
    }
}
function genDockerComposeDebug(serviceName, platform, port, { fullCommand: cmd }) {
    switch (platform.toLowerCase()) {
        case 'node.js':
            const cmdArray = cmd.split(' ');
            if (cmdArray[0].toLowerCase() === 'node') {
                cmdArray.splice(1, 0, '--inspect=0.0.0.0:9229');
                cmd = `command: ${cmdArray.join(' ')}`;
            }
            else {
                cmd = '## set your startup file here\n    command: node --inspect app.js';
            }
            return `version: '2.1'

services:
  ${serviceName}:
    image: ${serviceName}
    build: .
    environment:
      NODE_ENV: development
    ports:
      - ${port}:${port}
      - 9229:9229
    ${cmd}`;
        case 'go':
            return `version: '2.1'

services:
  ${serviceName}:
    image: ${serviceName}
    build:
      context: .
      dockerfile: Dockerfile
    ports:
        - ${port}:${port}
`;
        case '.net core':
            return `version: '2.1'

services:
  ${serviceName}:
    build:
      args:
        source: obj/Docker/empty/
    labels:
      - "com.microsoft.visualstudio.targetoperatingsystem=linux"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - DOTNET_USE_POLLING_FILE_WATCHER=1
    volumes:
      - .:/app
      - ~/.nuget/packages:/root/.nuget/packages:ro
      - ~/clrdbg:/clrdbg:ro
    entrypoint: tail -f /dev/null
`;
        default:
            return `version: '2.1'

services:
  ${serviceName}:
    image: ${serviceName}
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - ${port}:${port}
`;
    }
}
function genDockerIgnoreFile(service, platformType, port) {
    // TODO: Add support for other platform types
    return `node_modules
npm-debug.log
Dockerfile*
docker-compose*
.dockerignore
.git
.gitignore
README.md
LICENSE
.vscode`;
}
function getPackageJson(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        return vscode.workspace.findFiles(new vscode.RelativePattern(folder, 'package.json'), null, 1, null);
    });
}
function readPackageJson(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        // open package.json and look for main, scripts start
        const uris = yield getPackageJson(folder);
        var pkg = {
            npmStart: true,
            fullCommand: 'npm start',
            cmd: 'npm start',
            author: 'author',
            version: '0.0.1'
        }; //default
        if (uris && uris.length > 0) {
            const json = JSON.parse(fs.readFileSync(uris[0].fsPath, 'utf8'));
            if (json.scripts && json.scripts.start) {
                pkg.npmStart = true;
                pkg.fullCommand = json.scripts.start;
                pkg.cmd = 'npm start';
            }
            else if (json.main) {
                pkg.npmStart = false;
                pkg.fullCommand = 'node' + ' ' + json.main;
                pkg.cmd = pkg.fullCommand;
            }
            else {
                pkg.fullCommand = '';
            }
            if (json.author) {
                pkg.author = json.author;
            }
            if (json.version) {
                pkg.version = json.version;
            }
        }
        return pkg;
    });
}
const DOCKER_FILE_TYPES = {
    'docker-compose.yml': genDockerCompose,
    'docker-compose.debug.yml': genDockerComposeDebug,
    'Dockerfile': genDockerFile,
    '.dockerignore': genDockerIgnoreFile
};
const YES_OR_NO_PROMPT = [
    {
        "title": 'Yes',
        "isCloseAffordance": false
    },
    {
        "title": 'No',
        "isCloseAffordance": true
    }
];
function configure() {
    return __awaiter(this, void 0, void 0, function* () {
        let folder;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
            folder = vscode.workspace.workspaceFolders[0];
        }
        else {
            folder = yield vscode.window.showWorkspaceFolderPick();
        }
        if (!folder) {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage('Docker files can only be generated if VS Code is opened on a folder.');
            }
            else {
                vscode.window.showErrorMessage('Docker files can only be generated if a workspace folder is picked in VS Code.');
            }
            return;
        }
        const platformType = yield config_utils_1.quickPickPlatform();
        if (!platformType)
            return;
        const port = yield config_utils_1.promptForPort();
        if (!port)
            return;
        const serviceName = path.basename(folder.uri.fsPath).toLowerCase();
        const pkg = yield readPackageJson(folder);
        yield Promise.all(Object.keys(DOCKER_FILE_TYPES).map((fileName) => {
            return createWorkspaceFileIfNotExists(fileName, DOCKER_FILE_TYPES[fileName]);
        }));
        telemetry_1.reporter && telemetry_1.reporter.sendTelemetryEvent('command', {
            command: 'vscode-docker.configure',
            platformType
        });
        function createWorkspaceFileIfNotExists(fileName, writerFunction) {
            return __awaiter(this, void 0, void 0, function* () {
                const workspacePath = path.join(folder.uri.fsPath, fileName);
                if (fs.existsSync(workspacePath)) {
                    const item = yield vscode.window.showErrorMessage(`A ${fileName} already exists. Would you like to override it?`, ...YES_OR_NO_PROMPT);
                    if (item.title.toLowerCase() === 'yes') {
                        fs.writeFileSync(workspacePath, writerFunction(serviceName, platformType, port, pkg), { encoding: 'utf8' });
                    }
                }
                else {
                    fs.writeFileSync(workspacePath, writerFunction(serviceName, platformType, port, pkg), { encoding: 'utf8' });
                }
            });
        }
    });
}
exports.configure = configure;
//# sourceMappingURL=configure.js.map