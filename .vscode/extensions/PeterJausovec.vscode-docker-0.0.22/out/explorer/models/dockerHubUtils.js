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
const opn = require("opn");
const request = require("request-promise");
let _token;
;
;
;
function dockerHubLogout() {
    const keytar = require(`${vscode.env.appRoot}/node_modules/keytar`);
    if (keytar) {
        keytar.deletePassword('vscode-docker', 'dockerhub.token');
        keytar.deletePassword('vscode-docker', 'dockerhub.password');
        keytar.deletePassword('vscode-docker', 'dockerhub.username');
    }
    _token = null;
}
exports.dockerHubLogout = dockerHubLogout;
function dockerHubLogin() {
    return __awaiter(this, void 0, void 0, function* () {
        const username = yield vscode.window.showInputBox({ ignoreFocusOut: true, prompt: 'Username' });
        if (username) {
            const password = yield vscode.window.showInputBox({ ignoreFocusOut: true, prompt: 'Password', password: true });
            if (password) {
                _token = yield login(username, password);
                if (_token) {
                    return { username: username, password: password, token: _token.token };
                }
            }
        }
        return;
    });
}
exports.dockerHubLogin = dockerHubLogin;
function setDockerHubToken(token) {
    _token = { token: token };
}
exports.setDockerHubToken = setDockerHubToken;
function login(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let t;
        let options = {
            method: 'POST',
            uri: 'https://hub.docker.com/v2/users/login',
            body: {
                username: username,
                password: password
            },
            json: true
        };
        try {
            t = yield request(options);
        }
        catch (error) {
            console.log(error);
            vscode.window.showErrorMessage(error.error.detail);
        }
        return t;
    });
}
function getUser() {
    return __awaiter(this, void 0, void 0, function* () {
        let u;
        let options = {
            method: 'GET',
            uri: 'https://hub.docker.com/v2/user/',
            headers: {
                Authorization: 'JWT ' + _token.token
            },
            json: true
        };
        try {
            u = yield request(options);
        }
        catch (error) {
            console.log(error);
            vscode.window.showErrorMessage('Docker: Unable to retrieve User information');
        }
        return u;
    });
}
exports.getUser = getUser;
function getRepositories(username) {
    return __awaiter(this, void 0, void 0, function* () {
        let repos;
        let options = {
            method: 'GET',
            uri: `https://hub.docker.com/v2/users/${username}/repositories/`,
            headers: {
                Authorization: 'JWT ' + _token.token
            },
            json: true
        };
        try {
            repos = yield request(options);
        }
        catch (error) {
            console.log(error);
            vscode.window.showErrorMessage('Docker: Unable to retrieve Repositories');
        }
        return repos;
    });
}
exports.getRepositories = getRepositories;
function getRepositoryInfo(repository) {
    return __awaiter(this, void 0, void 0, function* () {
        let res;
        let options = {
            method: 'GET',
            uri: `https://hub.docker.com/v2/repositories/${repository.namespace}/${repository.name}/`,
            headers: {
                Authorization: 'JWT ' + _token.token
            },
            json: true
        };
        try {
            res = yield request(options);
        }
        catch (error) {
            console.log(error);
            vscode.window.showErrorMessage('Docker: Unable to get Repository Details');
        }
        return res;
    });
}
exports.getRepositoryInfo = getRepositoryInfo;
function getRepositoryTags(repository) {
    return __awaiter(this, void 0, void 0, function* () {
        let tagsPage;
        let options = {
            method: 'GET',
            uri: `https://hub.docker.com/v2/repositories/${repository.namespace}/${repository.name}/tags?page_size=100&page=1`,
            headers: {
                Authorization: 'JWT ' + _token.token
            },
            json: true
        };
        try {
            tagsPage = yield request(options);
        }
        catch (error) {
            console.log(error);
            vscode.window.showErrorMessage('Docker: Unable to retrieve Repository Tags');
        }
        return tagsPage.results;
    });
}
exports.getRepositoryTags = getRepositoryTags;
function browseDockerHub(context) {
    if (context) {
        let url = 'https://hub.docker.com/';
        const repo = context.repository;
        switch (context.contextValue) {
            case 'dockerHubNamespace':
                url = `${url}u/${context.userName}`;
                break;
            case 'dockerHubRepository':
                url = `${url}r/${context.repository.namespace}/${context.repository.name}`;
                break;
            case 'dockerHubImageTag':
                url = `${url}r/${context.repository.namespace}/${context.repository.name}/tags`;
                break;
        }
        opn(url);
    }
}
exports.browseDockerHub = browseDockerHub;
//# sourceMappingURL=dockerHubUtils.js.map