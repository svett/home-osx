'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
let defaultSettingsJson = `// Place your settings in this file to overwrite default and user settings.
{
}`;
let defaultSettings = `{
    "configurations": [
        {
            "name": "Mac",
            "includePath": [
                "/usr/include",
                "/usr/local/include"
            ],
            "browse": {
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        },
        {
            "name": "Linux",
            "includePath": [
                "/usr/include",
                "/usr/local/include"
            ],
            "browse": {
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        },
        {
            "name": "Win32",
            "includePath": [
                "C:/Program Files (x86)/Microsoft Visual Studio 14.0/VC/include/*"
            ],
            "browse": {
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        }
    ]
}
`;
const ReportStatus_type = {
    get method() { return 'C_Cpp/ReportStatus'; }
};
const ChangeFolderSettings_type = {
    get method() { return 'C_Cpp/didChangeFolderSettings'; }
};
const ChangeSelectedSetting_type = {
    get method() { return 'C_Cpp/didChangeSelectedSetting'; }
};
const SwitchHeaderSource_type = {
    get method() { return 'C_Cpp/didSwitchHeaderSource'; }
};
const FileCreated_type = {
    get method() { return 'C_Cpp/fileCreated'; }
};
const FileDeleted_type = {
    get method() { return 'C_Cpp/fileDeleted'; }
};
class ConfigurationProperties {
    UpdateStatusBar() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || (activeEditor.document.languageId != "cpp" && activeEditor.document.languageId != "c")) {
            this.statusBarItem.hide();
            return;
        }
        this.statusBarItem.text = this.parseStatus + this.configurationJson.configurations[this.currentConfigurationIndex].name;
        if (this.parseStatus == "") {
            this.statusBarItem.color = '';
        }
        else {
            this.statusBarItem.color = 'DarkRed';
        }
        this.statusBarItem.command = "C_Cpp.ConfigurationSelect";
        this.statusBarItem.show();
    }
    getConfigIndexForPlatform(config) {
        this.currentConfigurationIndex = this.configurationJson.configurations.length - 1;
        if (this.configurationJson.configurations.length > 3)
            return;
        let nodePlatform = process.platform;
        let plat;
        if (nodePlatform == 'linux') {
            plat = "Linux";
        }
        else if (nodePlatform == 'darwin') {
            plat = "Mac";
        }
        else if (nodePlatform == 'win32') {
            plat = "Win32";
        }
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            if (config.configurations[i].name == plat) {
                this.currentConfigurationIndex = i;
                return;
            }
        }
    }
    constructor(context, client) {
        this.languageClient = client;
        this.registeredCommands = [];
        this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.SwitchHeaderSource', () => {
            this.handleSwitchHeaderSource();
        }));
        if (!vscode.workspace.rootPath) {
            this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.ConfigurationSelect', () => {
                vscode.window.showInformationMessage('Open a folder first to select a configuration');
            }));
            this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.ConfigurationEdit', () => {
                vscode.window.showInformationMessage('Open a folder first to edit configurations');
            }));
            this.languageClient.sendNotification(ChangeFolderSettings_type, {
                currentConfiguration: -1,
                configurations: []
            });
            return;
        }
        this.parseStatus = "";
        this.configurationFileName = "**/c_cpp_properties.json";
        let configFilePath = path.join(vscode.workspace.rootPath, ".vscode", "c_cpp_properties.json");
        this.quickPickOptions = {};
        this.currentConfigurationIndex = 0;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.ConfigurationSelect', () => {
            this.handleConfigurationSelect();
        }));
        this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.ConfigurationEdit', () => {
            this.handleConfigurationEdit();
        }));
        if (fs.existsSync(configFilePath)) {
            this.propertiesFile = vscode.Uri.file(configFilePath);
            this.parsePropertiesFile();
            this.getConfigIndexForPlatform(this.configurationJson);
            this.UpdateStatusBar();
            this.updateServerOnFolderSettingsChange();
        }
        else {
            this.handleConfigurationChange();
        }
        this.configFileWatcher = vscode.workspace.createFileSystemWatcher(this.configurationFileName);
        this.configFileWatcher.onDidCreate((uri) => {
            this.propertiesFile = uri;
            this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidDelete(() => {
            this.propertiesFile = null;
            this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidChange(() => {
            this.handleConfigurationChange();
        });
        this.rootPathFileWatcher = vscode.workspace.createFileSystemWatcher(path.join(vscode.workspace.rootPath, "*"), false, true, false);
        this.rootPathFileWatcher.onDidCreate((uri) => {
            this.languageClient.sendNotification(FileCreated_type, { uri: uri.toString() });
        });
        this.rootPathFileWatcher.onDidDelete((uri) => {
            this.languageClient.sendNotification(FileDeleted_type, { uri: uri.toString() });
        });
        vscode.window.onDidChangeActiveTextEditor((e) => {
            this.UpdateStatusBar();
        });
        client.onNotification(ReportStatus_type, (notificationBody) => {
            let message = notificationBody.status;
            if (message.endsWith("...")) {
                this.parseStatus = "$(flame)";
            }
            else if (message.endsWith("Ready")) {
                this.parseStatus = "";
            }
            this.UpdateStatusBar();
        });
    }
    resolveVariables(input) {
        let regexp = /\$\{(.*?)\}/g;
        let ret = input.replace(regexp, (match, name) => {
            let newValue = process.env[name];
            return (newValue != null) ? newValue : match;
        });
        regexp = /^\~/g;
        ret = ret.replace(regexp, (match, name) => {
            let newValue = process.env.HOME;
            return (newValue != null) ? newValue : match;
        });
        return ret;
    }
    updateServerOnFolderSettingsChange() {
        let cppSettings = vscode.workspace.getConfiguration("C_Cpp");
        let addWorkspaceRootToIncludePath = cppSettings.get("addWorkspaceRootToIncludePath");
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            if (typeof this.configurationJson.configurations[i].includePath != 'undefined') {
                for (let j = 0; j < this.configurationJson.configurations[i].includePath.length; j++) {
                    this.configurationJson.configurations[i].includePath[j] = this.resolveVariables(this.configurationJson.configurations[i].includePath[j]);
                }
                if (addWorkspaceRootToIncludePath)
                    this.configurationJson.configurations[i].includePath.splice(0, 0, "$\{workspaceRoot\}");
            }
            else if (addWorkspaceRootToIncludePath) {
                this.configurationJson.configurations[i].includePath = ["$\{workspaceRoot\}"];
            }
        }
        this.languageClient.sendNotification(ChangeFolderSettings_type, {
            currentConfiguration: this.currentConfigurationIndex,
            configurations: this.configurationJson.configurations
        });
    }
    updateServerOnCurrentConfigurationChange() {
        this.languageClient.sendNotification(ChangeSelectedSetting_type, {
            currentConfiguration: this.currentConfigurationIndex
        });
    }
    updateServerOnSwitchHeaderSourceChange(rootPath_, fileName_) {
        if (rootPath_ == undefined)
            rootPath_ = path.dirname(fileName_);
        this.languageClient.sendRequest(SwitchHeaderSource_type, { rootPath: rootPath_, switchHeaderSourceFileName: fileName_, }).then((targetFileName) => {
            vscode.workspace.openTextDocument(targetFileName).then((document) => {
                let foundEditor = false;
                vscode.window.visibleTextEditors.forEach((editor, index, array) => {
                    if (editor.document == document) {
                        if (!foundEditor) {
                            foundEditor = true;
                            vscode.window.showTextDocument(document, editor.viewColumn);
                        }
                    }
                });
                if (!foundEditor) {
                    if (vscode.window.activeTextEditor != undefined) {
                        vscode.window.showTextDocument(document, vscode.window.activeTextEditor.viewColumn);
                    }
                    else {
                        vscode.window.showTextDocument(document);
                    }
                }
            });
        });
    }
    parsePropertiesFile() {
        try {
            this.configurationJson = JSON.parse(fs.readFileSync(this.propertiesFile.fsPath, 'utf8'));
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to parse "' + this.propertiesFile.fsPath + '": ' + err.message);
            throw err;
        }
    }
    handleConfigurationChange() {
        if (this.propertiesFile) {
            this.parsePropertiesFile();
            if (this.configurationJson.configurations.length <= this.currentConfigurationIndex) {
                this.currentConfigurationIndex = 0;
            }
        }
        else {
            this.configurationJson = JSON.parse(defaultSettings);
            this.getConfigIndexForPlatform(this.configurationJson);
        }
        this.UpdateStatusBar();
        this.updateServerOnFolderSettingsChange();
    }
    handleConfigurationEdit() {
        if (this.propertiesFile) {
            vscode.workspace.openTextDocument(this.propertiesFile).then((document) => {
                vscode.window.showTextDocument(document);
            });
        }
        else {
            let dirPath = path.join(vscode.workspace.rootPath, ".vscode");
            fs.mkdir(dirPath, (e) => {
                if (!e || e.code === 'EEXIST') {
                    let fullPathToFile = path.join(dirPath, "c_cpp_properties.json");
                    let filePath = vscode.Uri.parse("untitled:" + fullPathToFile);
                    vscode.workspace.openTextDocument(filePath).then((document) => {
                        let edit = new vscode.WorkspaceEdit;
                        edit.insert(document.uri, new vscode.Position(0, 0), defaultSettings);
                        vscode.workspace.applyEdit(edit).then((status) => {
                            document.save().then(() => {
                                filePath = vscode.Uri.file(fullPathToFile);
                                vscode.workspace.openTextDocument(filePath).then((document) => {
                                    vscode.window.showTextDocument(document);
                                });
                            });
                        });
                    });
                }
            });
        }
    }
    handleConfigurationSelect() {
        this.quickPickOptions.placeHolder = "Select a Configuration";
        let items;
        items = [];
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            items.push({ label: this.configurationJson.configurations[i].name, description: "", index: i });
        }
        let result = vscode.window.showQuickPick(items, this.quickPickOptions);
        result.then((selection) => {
            if (!selection) {
                return;
            }
            this.currentConfigurationIndex = selection.index;
            this.UpdateStatusBar();
            this.updateServerOnCurrentConfigurationChange();
        });
    }
    handleSwitchHeaderSource() {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return;
        }
        if (activeEditor.document.languageId != "cpp" && activeEditor.document.languageId != "c") {
            return;
        }
        this.updateServerOnSwitchHeaderSourceChange(vscode.workspace.rootPath, activeEditor.document.fileName);
    }
    dispose() {
        this.configFileWatcher.dispose();
        this.rootPathFileWatcher.dispose();
        this.statusBarItem.dispose();
        for (let i = 0; i < this.registeredCommands.length; i++) {
            this.registeredCommands[i].dispose();
        }
    }
}
function setupConfigurationProperties(context, client) {
    let ret = new ConfigurationProperties(context, client);
    return ret;
}
exports.setupConfigurationProperties = setupConfigurationProperties;
//# sourceMappingURL=C_Cpp_ConfigurationProperties.js.map