'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const telemetry = require("../telemetry");
const util = require("../common");
const os = require("os");
const persistentState_1 = require("./persistentState");
class FeedbackState {
    constructor() {
        var dbg = false;
        this.bugUserJuly2016 = new persistentState_1.PersistentState("CPP.bugUser", false);
        this.bugUserAug2016 = new persistentState_1.PersistentState("CPP.bugUser.Aug2016", true);
        this.bugUserCount = new persistentState_1.PersistentState("CPP.bugUser.count", this.bugUserJuly2016.Value ? 500 : 1000);
        this.bugUserEditCount = new persistentState_1.PersistentState("CPP.bugUser.editCount", this.bugUserJuly2016.Value ? 5000 : 10000);
        if (dbg) {
            this.BugUser = true;
            this.BugUserCount = 1;
            this.BugUserEditCount = 1;
        }
    }
    get BugUserCount() { return this.bugUserCount.Value; }
    set BugUserCount(value) { this.bugUserCount.Value = value; }
    get BugUserEditCount() { return this.bugUserEditCount.Value; }
    set BugUserEditCount(value) { this.bugUserEditCount.Value = value; }
    get BugUser() { return this.bugUserAug2016.Value; }
    set BugUser(value) { this.bugUserAug2016.Value = value; }
    promptSurvey() {
        if (this.BugUser) {
            this.BugUser = false;
            telemetry.logLanguageServerEvent("bugUserForFeedback");
            var message = "Would you tell us how likely you are to recommend the Microsoft C/C++ extension for VS Code to a friend or colleague?";
            var yesButton = "Yes";
            var dontShowAgainButton = "Don't Show Again";
            var url = "https://www.research.net/r/VBVV6C6?o=" + os.platform + "&m=" + vscode.env.machineId;
            vscode.window.showInformationMessage(message, yesButton, dontShowAgainButton).then((value) => {
                switch (value) {
                    case yesButton:
                        telemetry.logLanguageServerEvent("bugUserForFeedbackSuccess");
                        cp.spawn(util.getOpenCommand(), [url]);
                        break;
                }
            });
        }
    }
}
exports.FeedbackState = FeedbackState;
//# sourceMappingURL=feedback.js.map