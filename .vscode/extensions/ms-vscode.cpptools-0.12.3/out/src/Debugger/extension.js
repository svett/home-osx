Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const attachToProcess_1 = require("./attachToProcess");
const nativeAttach_1 = require("./nativeAttach");
const configurationProvider_1 = require("./configurationProvider");
const configurations_1 = require("./configurations");
const util = require("../common");
function activate() {
    let attachItemsProvider = nativeAttach_1.NativeAttachItemsProviderFactory.Get();
    let attacher = new attachToProcess_1.AttachPicker(attachItemsProvider);
    let disposable = vscode.commands.registerCommand('extension.pickNativeProcess', () => attacher.ShowAttachEntries());
    util.extensionContext.subscriptions.push(disposable);
    let remoteAttacher = new attachToProcess_1.RemoteAttachPicker();
    let disposable2 = vscode.commands.registerCommand('extension.pickRemoteNativeProcess', (any) => remoteAttacher.ShowAttachEntries(any));
    util.extensionContext.subscriptions.push(disposable2);
    let configurationProvider = configurationProvider_1.ConfigurationProviderFactory.getConfigurationProvider();
    util.extensionContext.subscriptions.push(vscode.commands.registerCommand('extension.provideInitialConfigurations_cppvsdbg', () => configurationProvider.getInitialConfigurations(configurations_1.DebuggerType.cppvsdbg)));
    util.extensionContext.subscriptions.push(vscode.commands.registerCommand('extension.provideInitialConfigurations_cppdbg', () => configurationProvider.getInitialConfigurations(configurations_1.DebuggerType.cppdbg)));
    configurationProvider.getConfigurationSnippets();
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map