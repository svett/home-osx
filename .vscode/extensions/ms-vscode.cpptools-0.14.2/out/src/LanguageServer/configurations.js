'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
const util = require("../common");
const configVersion = 3;
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
            },
            "macFrameworkPath": [
                "/System/Library/Frameworks",
                "/Library/Frameworks"
            ]
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
class CppProperties {
    constructor(rootPath) {
        this.propertiesFile = null;
        this.configurationJson = null;
        this.currentConfigurationIndex = -1;
        this.configFileWatcher = null;
        this.configFileWatcherFallbackTime = new Date();
        this.compileCommandFileWatchers = [];
        this.defaultIncludes = null;
        this.defaultFrameworks = null;
        this.configurationGlobPattern = "**/c_cpp_properties.json";
        this.disposables = [];
        this.configurationsChanged = new vscode.EventEmitter();
        this.selectionChanged = new vscode.EventEmitter();
        this.compileCommandsChanged = new vscode.EventEmitter();
        this.configurationIncomplete = true;
        console.assert(rootPath !== undefined);
        this.configFolder = path.join(rootPath, ".vscode");
        this.resetToDefaultSettings();
        let configFilePath = path.join(this.configFolder, "c_cpp_properties.json");
        if (fs.existsSync(configFilePath)) {
            this.propertiesFile = vscode.Uri.file(configFilePath);
        }
        this.configFileWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.configFolder, this.configurationGlobPattern));
        this.disposables.push(this.configFileWatcher);
        this.configFileWatcher.onDidCreate((uri) => {
            this.propertiesFile = uri;
            this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidDelete(() => {
            this.propertiesFile = null;
            this.resetToDefaultSettings();
            this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidChange(() => {
            this.handleConfigurationChange();
        });
        this.disposables.push(vscode.Disposable.from(this.configurationsChanged, this.selectionChanged, this.compileCommandsChanged));
    }
    get ConfigurationsChanged() { return this.configurationsChanged.event; }
    get SelectionChanged() { return this.selectionChanged.event; }
    get CompileCommandsChanged() { return this.compileCommandsChanged.event; }
    get Configurations() { return this.configurationJson.configurations; }
    get CurrentConfiguration() { return this.currentConfigurationIndex; }
    get ConfigurationNames() {
        let result = [];
        this.configurationJson.configurations.forEach((config) => result.push(config.name));
        return result;
    }
    set DefaultPaths(paths) {
        this.defaultIncludes = paths.includes;
        this.defaultFrameworks = paths.frameworks;
        this.handleConfigurationChange();
    }
    onConfigurationsChanged() {
        this.configurationsChanged.fire(this.Configurations);
    }
    onSelectionChanged() {
        this.selectionChanged.fire(this.CurrentConfiguration);
    }
    onCompileCommandsChanged(path) {
        this.compileCommandsChanged.fire(path);
    }
    resetToDefaultSettings() {
        this.configurationJson = JSON.parse(defaultSettings);
        this.currentConfigurationIndex = this.getConfigIndexForPlatform(this.configurationJson);
        this.configurationIncomplete = true;
    }
    applyDefaultIncludePathsAndFrameworks() {
        if (this.configurationIncomplete && this.defaultIncludes !== undefined && this.defaultFrameworks !== undefined) {
            this.configurationJson.configurations[this.currentConfigurationIndex].includePath = this.defaultIncludes;
            this.configurationJson.configurations[this.currentConfigurationIndex].browse.path = this.defaultIncludes;
            if (process.platform == 'darwin') {
                this.configurationJson.configurations[this.currentConfigurationIndex].macFrameworkPath = this.defaultFrameworks;
            }
            this.configurationIncomplete = false;
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
    addToIncludePathCommand(path) {
        this.handleConfigurationEditCommand((document) => {
            let config = this.configurationJson.configurations[this.currentConfigurationIndex];
            config.includePath.splice(config.includePath.length, 0, path);
            fs.writeFileSync(this.propertiesFile.fsPath, JSON.stringify(this.configurationJson, null, 4));
            this.updateServerOnFolderSettingsChange();
        });
    }
    select(index) {
        if (index == this.configurationJson.configurations.length) {
            this.handleConfigurationEditCommand(vscode.window.showTextDocument);
            return;
        }
        this.currentConfigurationIndex = index;
        this.onSelectionChanged();
    }
    updateServerOnFolderSettingsChange() {
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            if (this.configurationJson.configurations[i].includePath !== undefined) {
                for (let j = 0; j < this.configurationJson.configurations[i].includePath.length; j++) {
                    this.configurationJson.configurations[i].includePath[j] = util.resolveVariables(this.configurationJson.configurations[i].includePath[j]);
                }
            }
            if (this.configurationJson.configurations[i].browse !== undefined && this.configurationJson.configurations[i].browse.path !== undefined) {
                for (let j = 0; j < this.configurationJson.configurations[i].browse.path.length; j++) {
                    this.configurationJson.configurations[i].browse.path[j] = util.resolveVariables(this.configurationJson.configurations[i].browse.path[j]);
                }
            }
            if (this.configurationJson.configurations[i].macFrameworkPath !== undefined) {
                for (let j = 0; j < this.configurationJson.configurations[i].macFrameworkPath.length; j++) {
                    this.configurationJson.configurations[i].macFrameworkPath[j] = util.resolveVariables(this.configurationJson.configurations[i].macFrameworkPath[j]);
                }
            }
            if (this.configurationJson.configurations[i].compileCommands !== undefined) {
                this.configurationJson.configurations[i].compileCommands = util.resolveVariables(this.configurationJson.configurations[i].compileCommands);
            }
        }
        this.updateCompileCommandsFileWatchers();
        if (!this.configurationIncomplete) {
            this.onConfigurationsChanged();
        }
    }
    updateCompileCommandsFileWatchers() {
        this.compileCommandFileWatchers.forEach((watcher) => watcher.close());
        this.compileCommandFileWatchers = [];
        var filePaths = new Set();
        this.configurationJson.configurations.forEach(c => {
            if (c.compileCommands !== undefined && fs.existsSync(c.compileCommands)) {
                filePaths.add(c.compileCommands);
            }
        });
        filePaths.forEach((path) => {
            this.compileCommandFileWatchers.push(fs.watch(path, (event, filename) => {
                if (event != "rename") {
                    this.onCompileCommandsChanged(path);
                }
            }));
        });
    }
    handleConfigurationEditCommand(onSuccess) {
        if (this.propertiesFile && fs.existsSync(this.propertiesFile.fsPath)) {
            vscode.workspace.openTextDocument(this.propertiesFile).then((document) => {
                onSuccess(document);
            });
        }
        else {
            fs.mkdir(this.configFolder, (e) => {
                if (!e || e.code === 'EEXIST') {
                    let dirPathEscaped = this.configFolder.replace("#", "%23");
                    let fullPathToFile = path.join(dirPathEscaped, "c_cpp_properties.json");
                    let filePath = vscode.Uri.parse("untitled:" + fullPathToFile);
                    vscode.workspace.openTextDocument(filePath).then((document) => {
                        let edit = new vscode.WorkspaceEdit;
                        if (this.configurationJson === undefined) {
                            this.resetToDefaultSettings();
                        }
                        this.applyDefaultIncludePathsAndFrameworks();
                        edit.insert(document.uri, new vscode.Position(0, 0), JSON.stringify(this.configurationJson, null, 4));
                        vscode.workspace.applyEdit(edit).then((status) => {
                            document.save().then(() => {
                                this.propertiesFile = vscode.Uri.file(path.join(this.configFolder, "c_cpp_properties.json"));
                                vscode.workspace.openTextDocument(this.propertiesFile).then((document) => {
                                    onSuccess(document);
                                });
                            });
                        });
                    });
                }
            });
        }
    }
    handleConfigurationChange() {
        this.configFileWatcherFallbackTime = new Date();
        if (this.propertiesFile) {
            this.parsePropertiesFile();
            if (this.configurationJson !== undefined) {
                if (this.currentConfigurationIndex < this.configurationJson.configurations.length ||
                    this.configurationJson.configurations.length <= this.currentConfigurationIndex) {
                    this.currentConfigurationIndex = this.getConfigIndexForPlatform(this.configurationJson);
                }
            }
        }
        if (this.configurationJson === undefined) {
            this.resetToDefaultSettings();
        }
        this.applyDefaultIncludePathsAndFrameworks();
        this.updateServerOnFolderSettingsChange();
    }
    parsePropertiesFile() {
        try {
            let readResults = fs.readFileSync(this.propertiesFile.fsPath, 'utf8');
            if (readResults == "")
                return;
            this.configurationJson = JSON.parse(readResults);
            this.configurationIncomplete = false;
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
                if (this.configurationJson.version === undefined)
                    this.updateToVersion2();
                if (this.configurationJson.version === 2) {
                    this.updateToVersion3();
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
    updateToVersion2() {
        this.configurationJson.version = 2;
        if (!this.includePathConverted()) {
            for (let i = 0; i < this.configurationJson.configurations.length; i++) {
                let config = this.configurationJson.configurations[i];
                if (config.browse === undefined)
                    config.browse = {};
                if (config.browse.path === undefined && (this.defaultIncludes !== undefined || config.includePath !== undefined)) {
                    config.browse.path = (config.includePath === undefined) ? this.defaultIncludes.slice(0) : config.includePath.slice(0);
                }
            }
        }
    }
    updateToVersion3() {
        this.configurationJson.version = 3;
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            let config = this.configurationJson.configurations[i];
            if (config.name === "Mac" || (process.platform === "darwin" && config.name !== "Win32" && config.name !== "Linux")) {
                if (config.macFrameworkPath === undefined) {
                    config.macFrameworkPath = [
                        "/System/Library/Frameworks",
                        "/Library/Frameworks"
                    ];
                }
            }
        }
    }
    checkCppProperties() {
        let propertiesFile = path.join(this.configFolder, "c_cpp_properties.json");
        fs.stat(propertiesFile, (err, stats) => {
            if (err) {
                if (this.propertiesFile != null) {
                    this.propertiesFile = null;
                    this.resetToDefaultSettings();
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
    dispose() {
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
        this.compileCommandFileWatchers.forEach((watcher) => watcher.close());
        this.compileCommandFileWatchers = [];
    }
}
exports.CppProperties = CppProperties;
//# sourceMappingURL=configurations.js.map