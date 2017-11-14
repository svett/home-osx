'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
const util = require("../common");
const telemetry = require("../telemetry");
const ui_1 = require("./ui");
const clientCollection_1 = require("./clientCollection");
const settings_1 = require("./settings");
let prevCrashFile;
let clients;
let activeDocument;
let ui;
let disposables = [];
let intervalTimer;
const multilineCommentRules = {
    onEnterRules: [
        {
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            afterText: /^\s*\*\/$/,
            action: { indentAction: vscode.IndentAction.IndentOutdent, appendText: ' * ' }
        }, {
            beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
            action: { indentAction: vscode.IndentAction.None, appendText: ' * ' }
        }, {
            beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
            action: { indentAction: vscode.IndentAction.None, appendText: '* ' }
        }, {
            beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
            action: { indentAction: vscode.IndentAction.None, removeText: 1 }
        },
        {
            beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
            action: { indentAction: vscode.IndentAction.None, removeText: 1 }
        }
    ]
};
function activate() {
    console.log("activating extension");
    clients = new clientCollection_1.ClientCollection();
    ui = ui_1.getUI();
    if (vscode.workspace.textDocuments !== undefined && vscode.workspace.textDocuments.length > 0) {
        onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    }
    disposables.push(vscode.workspace.onDidChangeConfiguration(onDidChangeSettings));
    disposables.push(vscode.workspace.onDidSaveTextDocument(onDidSaveTextDocument));
    disposables.push(vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor));
    disposables.push(vscode.window.onDidChangeTextEditorSelection(onDidChangeTextEditorSelection));
    disposables.push(vscode.languages.setLanguageConfiguration('c', multilineCommentRules));
    disposables.push(vscode.languages.setLanguageConfiguration('cpp', multilineCommentRules));
    reportMacCrashes();
    registerCommands();
    intervalTimer = setInterval(onInterval, 2500);
}
exports.activate = activate;
function onDidChangeSettings() {
    clients.forEach(client => client.onDidChangeSettings());
}
let saveMessageShown = false;
function onDidSaveTextDocument(doc) {
    if (!vscode.window.activeTextEditor || doc !== vscode.window.activeTextEditor.document || (doc.languageId !== "cpp" && doc.languageId !== "c"))
        return;
    if (!saveMessageShown && new settings_1.CppSettings(doc.uri).clangFormatOnSave) {
        saveMessageShown = true;
        vscode.window.showInformationMessage("\"C_Cpp.clang_format_formatOnSave\" has been removed. Please use \"editor.formatOnSave\" instead.");
    }
}
function onDidChangeActiveTextEditor(editor) {
    console.assert(clients !== undefined, "client should be available before active editor is changed");
    if (clients === undefined)
        return;
    let activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || (activeEditor.document.languageId != "cpp" && activeEditor.document.languageId != "c")) {
        activeDocument = "";
        if (util.getShowLaunchJsonReloadPrompt() && activeEditor && activeEditor.document.languageId == "json" && activeEditor.document.fileName.endsWith("launch.json")) {
            util.setShowLaunchJsonReloadPrompt(false);
            let reload = "Reload";
            vscode.window.showInformationMessage("Please reload for debugger configuration snippets to be available.", reload).then(value => {
                if (value === reload)
                    vscode.commands.executeCommand("workbench.action.reloadWindow");
            });
        }
    }
    else {
        activeDocument = editor.document.uri.toString();
        clients.activeDocumentChanged(editor.document);
        clients.ActiveClient.selectionChanged(editor.selection.start);
    }
    ui.activeDocumentChanged();
}
function onDidChangeTextEditorSelection(event) {
    if (!event.textEditor || event.textEditor.document.uri !== vscode.window.activeTextEditor.document.uri ||
        (event.textEditor.document.languageId !== "cpp" && event.textEditor.document.languageId !== "c"))
        return;
    if (activeDocument != event.textEditor.document.uri.toString()) {
        activeDocument = event.textEditor.document.uri.toString();
        clients.activeDocumentChanged(event.textEditor.document);
        ui.activeDocumentChanged();
    }
    clients.ActiveClient.selectionChanged(event.selections[0].start);
}
function onInterval() {
    clients.ActiveClient.onInterval();
}
function registerCommands() {
    disposables.push(vscode.commands.registerCommand('C_Cpp.Navigate', onNavigate));
    disposables.push(vscode.commands.registerCommand('C_Cpp.GoToDeclaration', onGoToDeclaration));
    disposables.push(vscode.commands.registerCommand('C_Cpp.PeekDeclaration', onPeekDeclaration));
    disposables.push(vscode.commands.registerCommand('C_Cpp.SwitchHeaderSource', onSwitchHeaderSource));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ResetDatabase', onResetDatabase));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ConfigurationSelect', onSelectConfiguration));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ConfigurationEdit', onEditConfiguration));
    disposables.push(vscode.commands.registerCommand('C_Cpp.AddToIncludePath', onAddToIncludePath));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ToggleErrorSquiggles', onToggleSquiggles));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ToggleIncludeFallback', onToggleIncludeFallback));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ShowReleaseNotes', util.showReleaseNotes));
    disposables.push(vscode.commands.registerCommand('C_Cpp.PauseParsing', onPauseParsing));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ResumeParsing', onResumeParsing));
    disposables.push(vscode.commands.registerCommand('C_Cpp.ShowParsingCommands', onShowParsingCommands));
}
function onNavigate() {
    let activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor)
        return;
    clients.ActiveClient.requestNavigationList(activeEditor.document).then((navigationList) => {
        ui.showNavigationOptions(navigationList);
    });
}
function onGoToDeclaration() {
    clients.ActiveClient.requestGoToDeclaration().then(() => vscode.commands.executeCommand("editor.action.goToDeclaration"));
}
function onPeekDeclaration() {
    clients.ActiveClient.requestGoToDeclaration().then(() => vscode.commands.executeCommand("editor.action.previewDeclaration"));
}
function onSwitchHeaderSource() {
    let activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || !activeEditor.document) {
        return;
    }
    if (activeEditor.document.languageId != "cpp" && activeEditor.document.languageId != "c") {
        return;
    }
    let rootPath = clients.ActiveClient.RootPath;
    let fileName = activeEditor.document.fileName;
    if (!rootPath)
        rootPath = path.dirname(fileName);
    clients.ActiveClient.requestSwitchHeaderSource(rootPath, fileName).then((targetFileName) => {
        vscode.workspace.openTextDocument(targetFileName).then((document) => {
            let foundEditor = false;
            vscode.window.visibleTextEditors.forEach((editor, index, array) => {
                if (editor.document === document && !foundEditor) {
                    foundEditor = true;
                    vscode.window.showTextDocument(document, editor.viewColumn);
                }
            });
            if (!foundEditor) {
                if (vscode.window.activeTextEditor !== undefined) {
                    vscode.window.showTextDocument(document, vscode.window.activeTextEditor.viewColumn);
                }
                else {
                    vscode.window.showTextDocument(document);
                }
            }
        });
    });
}
function selectClient() {
    if (clients.Count === 1) {
        return Promise.resolve(clients.ActiveClient);
    }
    else {
        return ui.showWorkspaces(clients.Names).then(key => {
            if (key !== "") {
                let client = clients.get(key);
                if (client) {
                    return client;
                }
                else {
                    console.assert("client not found");
                }
            }
            return Promise.reject("client not found");
        });
    }
}
function onResetDatabase() {
    selectClient().then(client => client.resetDatabase(), rejected => { });
}
function onPauseParsing() {
    selectClient().then(client => client.pauseParsing(), rejected => { });
}
function onResumeParsing() {
    selectClient().then(client => client.resumeParsing(), rejected => { });
}
function onShowParsingCommands() {
    selectClient().then(client => client.handleShowParsingCommands(), rejected => { });
}
function onSelectConfiguration() {
    if (!isFolderOpen()) {
        vscode.window.showInformationMessage('Open a folder first to select a configuration');
    }
    else {
        clients.ActiveClient.handleConfigurationSelectCommand();
    }
}
function onEditConfiguration() {
    if (!isFolderOpen()) {
        vscode.window.showInformationMessage('Open a folder first to edit configurations');
    }
    else {
        selectClient().then(client => client.handleConfigurationEditCommand(), rejected => { });
    }
}
function onAddToIncludePath(path) {
    if (!isFolderOpen()) {
        vscode.window.showInformationMessage('Open a folder first to add to includePath');
    }
    else {
        clients.ActiveClient.handleAddToIncludePathCommand(path);
    }
}
function onToggleSquiggles() {
    let settings = new settings_1.CppSettings(clients.ActiveClient.RootUri);
    settings.toggleSetting("errorSquiggles", "Enabled", "Disabled");
}
function onToggleIncludeFallback() {
    let settings = new settings_1.CppSettings(clients.ActiveClient.RootUri);
    settings.toggleSetting("intelliSenseEngineFallback", "Enabled", "Disabled");
}
function reportMacCrashes() {
    if (process.platform == "darwin") {
        prevCrashFile = "";
        let crashFolder = path.resolve(process.env.HOME, "Library/Logs/DiagnosticReports");
        fs.stat(crashFolder, (err, stats) => {
            let crashObject = {};
            if (err) {
                crashObject["fs.stat: err.code"] = err.code;
                telemetry.logLanguageServerEvent("MacCrash", crashObject, null);
                return;
            }
            fs.watch(crashFolder, (event, filename) => {
                if (event !== "rename")
                    return;
                if (filename === prevCrashFile)
                    return;
                prevCrashFile = filename;
                if (!filename.startsWith("Microsoft.VSCode.CPP."))
                    return;
                setTimeout(() => {
                    fs.readFile(path.resolve(crashFolder, filename), 'utf8', (err, data) => {
                        if (err) {
                            fs.readFile(path.resolve(crashFolder, filename), 'utf8', handleCrashFileRead);
                            return;
                        }
                        handleCrashFileRead(err, data);
                    });
                }, 5000);
            });
        });
    }
}
function handleCrashFileRead(err, data) {
    let crashObject = {};
    if (err) {
        crashObject["readFile: err.code"] = err.code;
        telemetry.logLanguageServerEvent("MacCrash", crashObject, null);
        return;
    }
    let startCrash = data.indexOf(" Crashed:");
    if (startCrash < 0)
        startCrash = 0;
    let endCrash = data.indexOf("Thread ", startCrash);
    if (endCrash < startCrash)
        endCrash = data.length - 1;
    data = data.substr(startCrash, endCrash - startCrash);
    if (data.length > 16384)
        data = data.substr(0, 16384) + "...";
    crashObject["CrashingThreadCallStack"] = data;
    telemetry.logLanguageServerEvent("MacCrash", crashObject, null);
}
function deactivate() {
    console.log("deactivating extension");
    telemetry.logLanguageServerEvent("LanguageServerShutdown");
    clearInterval(intervalTimer);
    disposables.forEach(d => d.dispose());
    ui.dispose();
    return clients.dispose();
}
exports.deactivate = deactivate;
function isFolderOpen() {
    return vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0;
}
exports.isFolderOpen = isFolderOpen;
//# sourceMappingURL=extension.js.map