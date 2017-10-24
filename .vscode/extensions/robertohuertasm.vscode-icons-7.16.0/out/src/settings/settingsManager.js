"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const utils_1 = require("../utils");
const models_1 = require("../models");
const extensionSettings_1 = require("./extensionSettings");
class SettingsManager {
    constructor(vscode) {
        this.vscode = vscode;
        this.getSettings();
    }
    getSettings() {
        if (this.settings) {
            return this.settings;
        }
        const isDev = /dev/i.test(this.vscode.env.appName);
        const isOSS = !isDev && /oss/i.test(this.vscode.env.appName);
        const isInsiders = /insiders/i.test(this.vscode.env.appName);
        const vscodeVersion = new semver.SemVer(this.vscode.version).version;
        const isWin = /^win/.test(process.platform);
        const homeDir = isWin ? 'USERPROFILE' : 'HOME';
        const extensionFolder = path.join(homeDir, isInsiders
            ? '.vscode-insiders'
            : '.vscode', 'extensions');
        const vscodeAppName = isInsiders ? 'Code - Insiders' : isOSS ? 'Code - OSS' : isDev ? 'code-oss-dev' : 'Code';
        const appPath = utils_1.vscodePath();
        const vscodeAppData = path.join(appPath, vscodeAppName, 'User');
        this.settings = {
            vscodeAppData,
            isWin,
            isInsiders,
            isOSS,
            isDev,
            extensionFolder,
            settingsPath: path.join(vscodeAppData, 'vsicons.settings.json'),
            vscodeVersion,
            extensionSettings: extensionSettings_1.extensionSettings,
        };
        return this.settings;
    }
    getState() {
        const defaultState = {
            version: '0.0.0',
            status: models_1.ExtensionStatus.notActivated,
            welcomeShown: false,
        };
        if (!fs.existsSync(this.settings.settingsPath)) {
            return defaultState;
        }
        try {
            const state = fs.readFileSync(this.settings.settingsPath, 'utf8');
            return utils_1.parseJSON(state) || defaultState;
        }
        catch (error) {
            console.error(error);
            return defaultState;
        }
    }
    setState(state) {
        fs.writeFileSync(this.settings.settingsPath, JSON.stringify(state));
    }
    updateStatus(sts) {
        const state = this.getState();
        state.version = extensionSettings_1.extensionSettings.version;
        state.status = sts == null ? state.status : sts;
        state.welcomeShown = true;
        this.setState(state);
        return state;
    }
    deleteState() {
        fs.unlinkSync(this.settings.settingsPath);
    }
    isNewVersion() {
        return semver.lt(this.getState().version, this.settings.extensionSettings.version);
    }
}
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=settingsManager.js.map