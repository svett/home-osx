"use strict";
var vscode = require('vscode');
var attachToProcess_1 = require('./attachToProcess');
var nativeAttach_1 = require('./nativeAttach');
function activate(context) {
    var attachItemsProvider = nativeAttach_1.NativeAttachItemsProviderFactory.Get();
    var attacher = new attachToProcess_1.AttachPicker(attachItemsProvider);
    var disposable = vscode.commands.registerCommand('extension.pickNativeProcess', function () { return attacher.ShowAttachEntries(); });
    context.subscriptions.push(disposable);
    var remoteAttacher = new attachToProcess_1.RemoteAttachPicker();
    var disposable2 = vscode.commands.registerCommand('extension.pickRemoteNativeProcess', function (any) { return remoteAttacher.ShowAttachEntries(any); });
    context.subscriptions.push(disposable2);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map