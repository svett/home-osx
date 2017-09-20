'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const os = require("os");
const Telemetry = require("../telemetry");
const util = require("../common");
const BugUser_Type = {
    get method() { return "cpptools/requestFeedback"; }
};
class FeedbackState {
    constructor() {
        var dbg;
        dbg = false;
        if (dbg) {
            this.setBugUser_Aug2016(true);
            this.setBugUserCount(1);
            this.setBugUserEditCount(1);
        }
    }
    getBugUserCount() {
        if (!this.getBugUser_July2016())
            return util.extensionContext.globalState.get("CPP.bugUser.count", 1000);
        return util.extensionContext.globalState.get("CPP.bugUser.count", 500);
    }
    setBugUserCount(val) {
        return util.extensionContext.globalState.update("CPP.bugUser.count", val);
    }
    getBugUserEditCount() {
        if (!this.getBugUser_July2016())
            return util.extensionContext.globalState.get("CPP.bugUser.editCount", 10000);
        return util.extensionContext.globalState.get("CPP.bugUser.editCount", 5000);
    }
    setBugUserEditCount(val) {
        return util.extensionContext.globalState.update("CPP.bugUser.editCount", val);
    }
    getBugUser_July2016() {
        return util.extensionContext.globalState.get("CPP.bugUser", true);
    }
    getBugUser_Aug2016() {
        return util.extensionContext.globalState.get("CPP.bugUser.Aug2016", true);
    }
    setBugUser_July2016(val) {
        return util.extensionContext.globalState.update("CPP.bugUser", val);
    }
    setBugUser_Aug2016(val) {
        return util.extensionContext.globalState.update("CPP.bugUser.Aug2016", val);
    }
    setUserResponded(val) {
        return util.extensionContext.globalState.update("CPP.bugUser.responded", val);
    }
}
exports.FeedbackState = FeedbackState;
function setupFeedbackHandler(client) {
    var settings = new FeedbackState();
    if (settings.getBugUser_Aug2016()) {
        client.onNotification(BugUser_Type, (c) => {
            settings.setBugUser_Aug2016(false);
            Telemetry.logLanguageServerEvent("bugUserForFeedback");
            var message;
            var yesButton;
            var dontShowAgainButton;
            var url;
            var number = Math.random();
            message = "Would you tell us how likely you are to recommend the Microsoft C/C++ extension for VS Code to a friend or colleague?";
            url = "https://aka.ms/egv4z1";
            yesButton = "Yes";
            dontShowAgainButton = "Don't Show Again";
            vscode.window.showInformationMessage(message, yesButton, dontShowAgainButton).then((value) => {
                switch (value) {
                    case yesButton:
                        settings.setUserResponded(true);
                        Telemetry.logLanguageServerEvent("bugUserForFeedbackSuccess");
                        var spawn = require('child_process').spawn;
                        var open_command;
                        if (os.platform() == 'win32') {
                            open_command = 'explorer';
                        }
                        else if (os.platform() == 'darwin') {
                            open_command = '/usr/bin/open';
                        }
                        else {
                            open_command = '/usr/bin/xdg-open';
                        }
                        spawn(open_command, [url]);
                        break;
                    case dontShowAgainButton:
                        settings.setUserResponded(false);
                        settings.setBugUser_Aug2016(false);
                        break;
                }
            });
        });
    }
}
exports.setupFeedbackHandler = setupFeedbackHandler;
//# sourceMappingURL=C_Cpp_Feedback.js.map