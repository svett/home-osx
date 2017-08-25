'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
const util = require("../common");
const configVersion = 2;
let defaultSettings = `{
    "configurations": [
        {
            "name": "Mac",
            "includePath": [
                "/usr/include",
                "/usr/local/include",
                "$\{workspaceRoot\}"
            ],
            "defines": [],
            "intelliSenseMode": "clang-x64",
            "browse": {
                "path": [
                    "/usr/include",
                    "/usr/local/include",
                    "$\{workspaceRoot\}"
                ],
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        },
        {
            "name": "Linux",
            "includePath": [
                "/usr/include",
                "/usr/local/include",
                "$\{workspaceRoot\}"
            ],
            "defines": [],
            "intelliSenseMode": "clang-x64",
            "browse": {
                "path": [
                    "/usr/include",
                    "/usr/local/include",
                    "$\{workspaceRoot\}"
                ],
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        },
        {
            "name": "Win32",
            "includePath": [
                "C:/Program Files (x86)/Microsoft Visual Studio 14.0/VC/include",
                "$\{workspaceRoot\}"
            ],
            "defines": [
                "_DEBUG",
                "UNICODE"
            ],
            "intelliSenseMode": "msvc-x64",
            "browse": {
                "path": [
                    "C:/Program Files (x86)/Microsoft Visual Studio 14.0/VC/include/*",
                    "$\{workspaceRoot\}"
                ],
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        }
    ],
    "version": ${configVersion}
}
`;
const ReportStatus_type = {
    get method() { return "cpptools/reportStatus"; }
};
const QueryDefaultSdks_type = {
    get method() { return "cpptools/queryDefaultSdks"; }
};
const ChangeFolderSettings_type = {
    get method() { return "cpptools/didChangeFolderSettings"; }
};
const ChangeSelectedSetting_type = {
    get method() { return "cpptools/didChangeSelectedSetting"; }
};
const SwitchHeaderSource_type = {
    get method() { return "cpptools/didSwitchHeaderSource"; }
};
const FileCreated_type = {
    get method() { return "cpptools/fileCreated"; }
};
const FileDeleted_type = {
    get method() { return "cpptools/fileDeleted"; }
};
const IntervalTimerRequest_type = {
    get method() { return "cpptools/onIntervalTimer"; }
};
class ConfigurationProperties {
    constructor(client) {
        this.global_addWorkspaceRootToIncludePath = null;
        this.languageClient = client;
        this.registeredCommands = [];
        this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.SwitchHeaderSource', () => {
            this.handleSwitchHeaderSource();
        }));
        this.languageClient.sendRequest(QueryDefaultSdks_type, {}).then((sdks) => {
            this.defaultSdks = sdks;
            if (!this.propertiesFile) {
                this.handleConfigurationChange();
            }
        });
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
        this.configStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.configStatusBarItem.tooltip = "C/C++ Configuration";
        this.busyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.ConfigurationSelect', () => {
            this.handleConfigurationSelectCommand();
        }));
        this.registeredCommands.push(vscode.commands.registerCommand('C_Cpp.ConfigurationEdit', () => {
            this.handleConfigurationEditCommand();
        }));
        this.global_addWorkspaceRootToIncludePath = util.extensionContext.globalState.get("CPP.global_addWorkspaceRootToIncludePath", null);
        if (this.global_addWorkspaceRootToIncludePath == null) {
            let cppSettings = vscode.workspace.getConfiguration("C_Cpp");
            let inspectSettings = cppSettings.inspect("addWorkspaceRootToIncludePath");
            this.global_addWorkspaceRootToIncludePath = inspectSettings == undefined || inspectSettings.globalValue != false;
            util.extensionContext.globalState.update("CPP.global_addWorkspaceRootToIncludePath", this.global_addWorkspaceRootToIncludePath);
            if (inspectSettings.globalValue != undefined)
                cppSettings.update("addWorkspaceRootToIncludePath", undefined, true);
        }
        if (fs.existsSync(configFilePath)) {
            this.propertiesFile = vscode.Uri.file(configFilePath);
            this.parsePropertiesFile();
            this.currentConfigurationIndex = this.getConfigIndexForPlatform(this.configurationJson);
            this.UpdateStatusBar();
            this.updateServerOnFolderSettingsChange();
        }
        else {
            this.handleConfigurationChange();
        }
        this.configFileWatcher = vscode.workspace.createFileSystemWatcher(this.configurationFileName);
        this.configFileWatcherFallbackTime = new Date();
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
        this.languageClient.onNotification(ReportStatus_type, (notificationBody) => {
            let message = notificationBody.status;
            util.setProgress(util.getProgressExecutableSuccess());
            if (message.endsWith("...")) {
                this.parseStatus = "$(flame)";
            }
            else if (message.endsWith("Ready")) {
                this.parseStatus = "";
                util.setProgress(util.getProgressParseRootSuccess());
            }
            else if (message.endsWith("No Squiggles")) {
                util.setIntelliSenseProgress(util.getProgressIntelliSenseNoSquiggles());
            }
            else if (message.endsWith("IntelliSense Fallback")) {
                const showIntelliSenseFallbackMessage = "CPP.showIntelliSenseFallbackMessage";
                if (util.extensionContext.globalState.get(showIntelliSenseFallbackMessage, true)) {
                    let toggleProblemsPanel = "Toggle Problems Panel";
                    let dontShowAgainButton = "Don't Show Again";
                    vscode.window.showInformationMessage("Configure includePath for better IntelliSense results.", toggleProblemsPanel, dontShowAgainButton).then((value) => {
                        switch (value) {
                            case toggleProblemsPanel:
                                vscode.commands.executeCommand("workbench.actions.view.problems");
                                break;
                            case dontShowAgainButton:
                                util.extensionContext.globalState.update(showIntelliSenseFallbackMessage, false);
                                break;
                        }
                    });
                }
            }
            this.UpdateStatusBar();
        });
        setInterval(() => {
            this.onIntervalTimer();
        }, 2500);
    }
    UpdateStatusBar() {
        if (this.configStatusBarItem !== undefined && this.busyStatusBarItem !== undefined) {
            let activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor || (activeEditor.document.languageId != "cpp" && activeEditor.document.languageId != "c")) {
                this.configStatusBarItem.hide();
                this.busyStatusBarItem.hide();
                return;
            }
            this.configStatusBarItem.text = this.configurationJson.configurations[this.currentConfigurationIndex].name;
            this.busyStatusBarItem.text = this.parseStatus;
            if (this.parseStatus == "") {
                this.busyStatusBarItem.hide();
            }
            else {
                this.busyStatusBarItem.tooltip = "Parsing...";
                this.busyStatusBarItem.color = "Red";
                this.busyStatusBarItem.show();
            }
            this.configStatusBarItem.command = "C_Cpp.ConfigurationSelect";
            this.configStatusBarItem.show();
        }
    }
    getConfigIndexForPlatform(config) {
        if (this.configurationJson.configurations.length > 3)
            return this.configurationJson.configurations.length - 1;
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
                return i;
            }
        }
        return this.configurationJson.configurations.length - 1;
    }
    getIntelliSenseModeForPlatform(name) {
        if (name == "Linux" || name == "Mac") {
            return "clang-x64";
        }
        else if (name == "Win32") {
            return "msvc-x64";
        }
        else {
            let nodePlatform = process.platform;
            if (nodePlatform == 'linux' || nodePlatform == 'darwin') {
                return "clang-x64";
            }
        }
        return "msvc-x64";
    }
    includePathConverted() {
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            if (this.configurationJson.configurations[i].browse === undefined || this.configurationJson.configurations[i].browse.path === undefined) {
                return false;
            }
        }
        return true;
    }
    getDefaultIncludePath() {
        let result = this.defaultSdks.slice(0);
        result.splice(result.length, 0, "$\{workspaceRoot\}");
        return result;
    }
    onIntervalTimer() {
        this.languageClient.sendNotification(IntervalTimerRequest_type);
        let propertiesFile = path.join(vscode.workspace.rootPath, ".vscode", "c_cpp_properties.json");
        fs.stat(propertiesFile, (err, stats) => {
            if (err) {
                if (this.propertiesFile != null) {
                    this.propertiesFile = null;
                    this.handleConfigurationChange();
                }
            }
            else if (stats.mtime > this.configFileWatcherFallbackTime) {
                if (this.propertiesFile == null)
                    this.propertiesFile = vscode.Uri.file(propertiesFile);
                this.handleConfigurationChange();
            }
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
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            if (this.configurationJson.configurations[i].includePath !== undefined) {
                for (let j = 0; j < this.configurationJson.configurations[i].includePath.length; j++) {
                    this.configurationJson.configurations[i].includePath[j] = this.resolveVariables(this.configurationJson.configurations[i].includePath[j]);
                }
            }
            if (this.configurationJson.configurations[i].browse !== undefined && this.configurationJson.configurations[i].browse.path !== undefined) {
                for (let j = 0; j < this.configurationJson.configurations[i].browse.path.length; j++) {
                    this.configurationJson.configurations[i].browse.path[j] = this.resolveVariables(this.configurationJson.configurations[i].browse.path[j]);
                }
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
    updateToVersion2() {
        this.configurationJson.version = 2;
        let cppSettings = vscode.workspace.getConfiguration("C_Cpp");
        let inspectSettings = cppSettings.inspect("addWorkspaceRootToIncludePath");
        let addWorkspaceRoot = inspectSettings.workspaceValue == undefined ? this.global_addWorkspaceRootToIncludePath == true : inspectSettings.workspaceValue != false;
        if (!this.includePathConverted()) {
            for (let i = 0; i < this.configurationJson.configurations.length; i++) {
                let config = this.configurationJson.configurations[i];
                if (config.browse === undefined)
                    config.browse = {};
                if (config.browse.path === undefined && (this.defaultSdks !== undefined || config.includePath !== undefined)) {
                    if (addWorkspaceRoot) {
                        let workspaceRootIndex = config.includePath.indexOf("$\{workspaceRoot\}");
                        if (workspaceRootIndex == -1)
                            config.includePath.splice(config.includePath.length, 0, "$\{workspaceRoot\}");
                    }
                    config.browse.path = (config.includePath === undefined) ? this.defaultSdks.slice(0) : config.includePath.slice(0);
                }
            }
        }
        if (inspectSettings.workspaceValue != undefined)
            cppSettings.update("addWorkspaceRootToIncludePath", undefined, false);
        if (addWorkspaceRoot) {
            for (let i = 0; i < this.configurationJson.configurations.length; i++) {
                let config = this.configurationJson.configurations[i];
                if (config.browse.path != undefined) {
                    let workspaceRootIndex = config.browse.path.indexOf("$\{workspaceRoot\}");
                    if (workspaceRootIndex == -1) {
                        config.browse.path.splice(config.browse.path.length, 0, "$\{workspaceRoot\}");
                    }
                }
                else {
                    config.browse.path = ["$\{workspaceRoot\}"];
                }
            }
        }
    }
    parsePropertiesFile() {
        try {
            let readResults = fs.readFileSync(this.propertiesFile.fsPath, 'utf8');
            if (readResults == "")
                return;
            this.configurationJson = JSON.parse(readResults);
            let dirty = false;
            for (let i = 0; i < this.configurationJson.configurations.length; i++) {
                let config = this.configurationJson.configurations[i];
                if (config.intelliSenseMode === undefined) {
                    dirty = true;
                    config.intelliSenseMode = this.getIntelliSenseModeForPlatform(config.name);
                }
            }
            if (this.configurationJson.version != configVersion) {
                dirty = true;
                if (this.configurationJson.version == undefined) {
                    this.updateToVersion2();
                }
                else {
                    this.configurationJson.version = configVersion;
                    vscode.window.showErrorMessage('Unknown version number found in c_cpp_properties.json. Some features may not work as expected.');
                }
            }
            if (dirty)
                fs.writeFileSync(this.propertiesFile.fsPath, JSON.stringify(this.configurationJson, null, 4));
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to parse "' + this.propertiesFile.fsPath + '": ' + err.message);
            throw err;
        }
    }
    handleConfigurationChange() {
        this.configFileWatcherFallbackTime = new Date();
        if (this.propertiesFile) {
            this.parsePropertiesFile();
            if (this.configurationJson.configurations.length <= this.currentConfigurationIndex) {
                this.currentConfigurationIndex = 0;
            }
        }
        else {
            this.configurationJson = JSON.parse(defaultSettings);
            this.currentConfigurationIndex = this.getConfigIndexForPlatform(this.configurationJson);
            if (this.defaultSdks !== undefined) {
                this.configurationJson.configurations[this.currentConfigurationIndex].includePath = this.getDefaultIncludePath();
                this.configurationJson.configurations[this.currentConfigurationIndex].browse.path = this.getDefaultIncludePath();
            }
        }
        this.UpdateStatusBar();
        this.updateServerOnFolderSettingsChange();
    }
    handleConfigurationEditCommand() {
        if (this.propertiesFile && fs.existsSync(this.propertiesFile.fsPath)) {
            vscode.workspace.openTextDocument(this.propertiesFile).then((document) => {
                vscode.window.showTextDocument(document);
            });
        }
        else {
            let dirPath = path.join(vscode.workspace.rootPath, ".vscode");
            fs.mkdir(dirPath, (e) => {
                if (!e || e.code === 'EEXIST') {
                    let dirPathEscaped = dirPath.replace("#", "%23");
                    let fullPathToFile = path.join(dirPathEscaped, "c_cpp_properties.json");
                    let filePath = vscode.Uri.parse("untitled:" + fullPathToFile);
                    vscode.workspace.openTextDocument(filePath).then((document) => {
                        let edit = new vscode.WorkspaceEdit;
                        let settings = JSON.parse(defaultSettings);
                        let index = this.getConfigIndexForPlatform(settings);
                        if (this.defaultSdks !== undefined) {
                            settings.configurations[index].includePath = this.getDefaultIncludePath();
                            settings.configurations[index].browse.path = this.getDefaultIncludePath();
                        }
                        edit.insert(document.uri, new vscode.Position(0, 0), JSON.stringify(settings, null, 4));
                        vscode.workspace.applyEdit(edit).then((status) => {
                            document.save().then(() => {
                                filePath = vscode.Uri.file(path.join(dirPath, "c_cpp_properties.json"));
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
    handleConfigurationSelectCommand() {
        this.quickPickOptions.placeHolder = "Select a Configuration...";
        let items;
        items = [];
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            items.push({ label: this.configurationJson.configurations[i].name, description: "", index: i });
        }
        items.push({ label: "Edit Configurations...", description: "", index: this.configurationJson.configurations.length });
        let result = vscode.window.showQuickPick(items, this.quickPickOptions);
        result.then((selection) => {
            if (!selection) {
                return;
            }
            if (selection.index == this.configurationJson.configurations.length) {
                this.handleConfigurationEditCommand();
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
        this.configStatusBarItem.dispose();
        this.busyStatusBarItem.dispose();
        for (let i = 0; i < this.registeredCommands.length; i++) {
            this.registeredCommands[i].dispose();
        }
    }
}
function setupConfigurationProperties(client) {
    let ret = new ConfigurationProperties(client);
    return ret;
}
exports.setupConfigurationProperties = setupConfigurationProperties;
//# sourceMappingURL=C_Cpp_ConfigurationProperties.js.map