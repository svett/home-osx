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
const dockerHubAPI = require("docker-hub-api");
function dockerHubLogin() {
    return __awaiter(this, void 0, void 0, function* () {
        const username = yield vscode.window.showInputBox({ prompt: 'Username' });
        if (username) {
            const password = yield vscode.window.showInputBox({ prompt: 'Password', password: true });
            if (password) {
                const token = yield dockerHubAPI.login(username, password);
                if (token) {
                    return Promise.resolve({ username: username, password: password, token: token.token });
                }
            }
        }
        return Promise.reject(null);
    });
}
exports.dockerHubLogin = dockerHubLogin;
function dockerHubLogout() {
    const keytar = require(`${vscode.env.appRoot}/node_modules/keytar`);
    keytar.deletePassword('vscode-docker', 'dockerhub.token');
    keytar.deletePassword('vscode-docker', 'dockerhub.password');
    keytar.deletePassword('vscode-docker', 'dockerhub.username');
    dockerHubAPI.setLoginToken('');
}
exports.dockerHubLogout = dockerHubLogout;
//# sourceMappingURL=dockerLogin.js.map