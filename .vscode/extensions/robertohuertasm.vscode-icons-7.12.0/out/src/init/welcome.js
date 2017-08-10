"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const open = require("open");
const i18n_1 = require("../i18n");
const vscode_extensions_1 = require("../utils/vscode-extensions");
const models_1 = require("../models");
const constants_1 = require("../constants");
const commands_1 = require("../commands");
const i18nManager = new i18n_1.LanguageResourceManager(vscode.env.language);
function manageWelcomeMessage(settingsManager) {
    if (!settingsManager.getState().welcomeShown) {
        showWelcomeMessage();
        return;
    }
    if (settingsManager.isNewVersion() && !vscode_extensions_1.getConfig().vsicons.dontShowNewVersionMessage) {
        showNewVersionMessage(settingsManager);
    }
}
exports.manageWelcomeMessage = manageWelcomeMessage;
function showWelcomeMessage() {
    const displayMessage = () => {
        vscode.window.showInformationMessage(i18nManager.getMessage(models_1.LangResourceKeys.welcome), { title: i18nManager.getMessage(models_1.LangResourceKeys.activate) }, { title: i18nManager.getMessage(models_1.LangResourceKeys.aboutOfficialApi) }, { title: i18nManager.getMessage(models_1.LangResourceKeys.seeReadme) })
            .then(btn => {
            if (!btn) {
                return;
            }
            if (btn.title === i18nManager.getMessage(models_1.LangResourceKeys.activate)) {
                commands_1.activationCommand();
                return;
            }
            if (btn.title === i18nManager.getMessage(models_1.LangResourceKeys.aboutOfficialApi)) {
                open(constants_1.constants.urlOfficialApi);
                // Display the message again so the user can choose to activate or not
                displayMessage();
                return;
            }
            if (btn.title === i18nManager.getMessage(models_1.LangResourceKeys.seeReadme)) {
                open(constants_1.constants.urlReadme);
                // Display the message again so the user can choose to activate or not
                displayMessage();
                return;
            }
        }, reason => {
            // tslint:disable-next-line:no-console
            console.info('Rejected because: ', reason);
            return;
        });
    };
    displayMessage();
}
function showNewVersionMessage(settingsManager) {
    const settings = settingsManager.getSettings().extensionSettings;
    vscode.window.showInformationMessage(`${i18nManager.getMessage(models_1.LangResourceKeys.newVersion)} v${settings.version}`, { title: i18nManager.getMessage(models_1.LangResourceKeys.seeReleaseNotes) }, { title: i18nManager.getMessage(models_1.LangResourceKeys.dontShowThis) })
        .then(btn => {
        if (!btn) {
            return;
        }
        if (btn.title === i18nManager.getMessage(models_1.LangResourceKeys.seeReleaseNotes)) {
            open(constants_1.constants.urlReleaseNote);
        }
        else if (btn.title === i18nManager.getMessage(models_1.LangResourceKeys.dontShowThis)) {
            vscode_extensions_1.getConfig().update('vsicons.dontShowNewVersionMessage', true, true);
        }
    }, reason => {
        // tslint:disable-next-line:no-console
        console.info('Rejected because: ', reason);
        return;
    });
}
//# sourceMappingURL=welcome.js.map