Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const attachToProcess_1 = require("./attachToProcess");
const nativeAttach_1 = require("./nativeAttach");
function activate(context) {
    let attachItemsProvider = nativeAttach_1.NativeAttachItemsProviderFactory.Get();
    let attacher = new attachToProcess_1.AttachPicker(attachItemsProvider);
    let disposable = vscode.commands.registerCommand('extension.pickNativeProcess', () => attacher.ShowAttachEntries());
    context.subscriptions.push(disposable);
    let remoteAttacher = new attachToProcess_1.RemoteAttachPicker();
    let disposable2 = vscode.commands.registerCommand('extension.pickRemoteNativeProcess', (any) => remoteAttacher.ShowAttachEntries(any));
    context.subscriptions.push(disposable2);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map