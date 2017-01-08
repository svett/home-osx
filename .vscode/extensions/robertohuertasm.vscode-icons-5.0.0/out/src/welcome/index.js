"use strict";
const vscode = require("vscode");
const open = require("open");
const messages_1 = require("../messages");
const vscode_extensions_1 = require("../utils/vscode-extensions");
const models_1 = require("../models");
function manageWelcomeMessage(settingsManager) {
    const state = settingsManager.getState();
    const vars = settingsManager.getSettings();
    const isNewVersion = state.version !== vars.extensionSettings.version;
    if (!state.welcomeShown) {
        // show welcome message
        showWelcomeMessage(settingsManager);
        return;
    }
    if (isNewVersion) {
        settingsManager.setStatus(state.status);
        if (!vscode_extensions_1.getConfig().vsicons.dontShowNewVersionMessage) {
            showNewVersionMessage(settingsManager);
        }
    }
}
exports.manageWelcomeMessage = manageWelcomeMessage;
function showWelcomeMessage(settingsManager) {
    settingsManager.setStatus(models_1.ExtensionStatus.notInstalled);
    vscode.window.showInformationMessage(messages_1.messages.welcomeMessage, { title: messages_1.messages.aboutOfficialApi }, { title: messages_1.messages.seeReadme })
        .then(btn => {
        if (!btn) {
            return;
        }
        if (btn.title === messages_1.messages.aboutOfficialApi) {
            open(messages_1.messages.urlOfficialApi);
        }
        else if (btn.title === messages_1.messages.seeReadme) {
            open(messages_1.messages.urlReadme);
        }
    });
}
function showNewVersionMessage(settingsManager) {
    const vars = settingsManager.getSettings();
    vscode.window.showInformationMessage(messages_1.messages.newVersionMessage + ' v.' + vars.extensionSettings.version, { title: messages_1.messages.seeReleaseNotes }, { title: messages_1.messages.dontshowthis })
        .then(btn => {
        settingsManager.setStatus(models_1.ExtensionStatus.disabled);
        if (!btn) {
            return;
        }
        if (btn.title === messages_1.messages.seeReleaseNotes) {
            open(messages_1.messages.urlReleaseNote);
        }
        else if (btn.title === messages_1.messages.dontshowthis) {
            vscode_extensions_1.getConfig()
                .update('vsicons.dontShowNewVersionMessage', true, true);
        }
    });
}
//# sourceMappingURL=index.js.map