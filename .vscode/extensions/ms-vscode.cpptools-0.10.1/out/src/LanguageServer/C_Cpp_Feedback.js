'use strict';
var vscode = require('vscode');
var os = require('os');
var Telemetry = require('../telemetry');
var BugUser_Type = { get method() { return 'cpp_telemetry/bug_user'; } };
var FeedbackState = (function () {
    function FeedbackState(context) {
        this.context = context;
        var dbg;
        dbg = false;
        if (dbg) {
            this.setBugUser_Aug2016(true);
            this.setBugUserCount(1);
            this.setBugUserEditCount(1);
        }
    }
    FeedbackState.prototype.getBugUserCount = function () {
        if (!this.getBugUser_July2016())
            return this.context.globalState.get("CPP.bugUser.count", 1000);
        return this.context.globalState.get("CPP.bugUser.count", 500);
    };
    FeedbackState.prototype.setBugUserCount = function (val) {
        return this.context.globalState.update("CPP.bugUser.count", val);
    };
    FeedbackState.prototype.getBugUserEditCount = function () {
        if (!this.getBugUser_July2016())
            return this.context.globalState.get("CPP.bugUser.editCount", 10000);
        return this.context.globalState.get("CPP.bugUser.editCount", 5000);
    };
    FeedbackState.prototype.setBugUserEditCount = function (val) {
        return this.context.globalState.update("CPP.bugUser.editCount", val);
    };
    FeedbackState.prototype.getBugUser_July2016 = function () {
        return this.context.globalState.get("CPP.bugUser", true);
    };
    FeedbackState.prototype.getBugUser_Aug2016 = function () {
        return this.context.globalState.get("CPP.bugUser.Aug2016", true);
    };
    FeedbackState.prototype.setBugUser_July2016 = function (val) {
        return this.context.globalState.update("CPP.bugUser", val);
    };
    FeedbackState.prototype.setBugUser_Aug2016 = function (val) {
        return this.context.globalState.update("CPP.bugUser.Aug2016", val);
    };
    FeedbackState.prototype.setUserResponded = function (val) {
        return this.context.globalState.update("CPP.bugUser.responded", val);
    };
    return FeedbackState;
}());
exports.FeedbackState = FeedbackState;
function setupFeedbackHandler(context, client) {
    var settings = new FeedbackState(context);
    if (settings.getBugUser_Aug2016()) {
        client.onNotification(BugUser_Type, function (c) {
            settings.setBugUser_Aug2016(false);
            Telemetry.logLanguageServerEvent("bugUserForFeedback");
            var message;
            var yesButton;
            var dontAskButton;
            var url;
            var number = Math.random();
            if (!settings.getBugUser_July2016()) {
                message = "Thank you! We've improved a little based on your feedback. Would you like to provide additional feedback for the CPP extension?";
            }
            else {
                message = "Would you like to help us improve the CPP extension?";
            }
            url = "https://aka.ms/egv4z1";
            yesButton = "Yes";
            dontAskButton = "Don't Show Again";
            vscode.window.showInformationMessage(message, dontAskButton, yesButton).then(function (value) {
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
                    case dontAskButton:
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