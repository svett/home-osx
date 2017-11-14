'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
let ui;
class UI {
    constructor() {
        this.navigationStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
        this.navigationStatusBarItem.tooltip = "C/C++ Navigation";
        this.navigationStatusBarItem.command = "C_Cpp.Navigate";
        this.ShowNavigation = true;
        this.configStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
        this.configStatusBarItem.command = "C_Cpp.ConfigurationSelect";
        this.configStatusBarItem.tooltip = "C/C++ Configuration";
        this.ShowConfiguration = true;
        this.intelliSenseStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
        this.intelliSenseStatusBarItem.text = "";
        this.intelliSenseStatusBarItem.tooltip = "Updating IntelliSense...";
        this.intelliSenseStatusBarItem.color = "Red";
        this.ShowFlameIcon = true;
        this.browseEngineStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.browseEngineStatusBarItem.text = "";
        this.browseEngineStatusBarItem.tooltip = "Discovering files...";
        this.browseEngineStatusBarItem.color = "White";
        this.browseEngineStatusBarItem.command = "C_Cpp.ShowParsingCommands";
        this.ShowDBIcon = true;
    }
    set NavigationLocation(location) {
        this.navigationStatusBarItem.text = location;
    }
    set ActiveConfig(label) {
        this.configStatusBarItem.text = label;
    }
    ;
    set TagParseStatus(label) {
        this.browseEngineStatusBarItem.tooltip = label;
    }
    get IsTagParsing() {
        return this.browseEngineStatusBarItem.text !== "";
    }
    set IsTagParsing(val) {
        this.browseEngineStatusBarItem.text = val ? "$(database)" : "";
        this.ShowDBIcon = val;
    }
    get IsUpdatingIntelliSense() {
        return this.intelliSenseStatusBarItem.text !== "";
    }
    set IsUpdatingIntelliSense(val) {
        this.intelliSenseStatusBarItem.text = val ? "$(flame)" : "";
        this.ShowFlameIcon = val;
    }
    set ShowNavigation(show) {
        if (show) {
            this.navigationStatusBarItem.show();
        }
        else {
            this.navigationStatusBarItem.hide();
        }
    }
    set ShowDBIcon(show) {
        if (show && this.IsTagParsing) {
            this.browseEngineStatusBarItem.show();
        }
        else {
            this.browseEngineStatusBarItem.hide();
        }
    }
    set ShowFlameIcon(show) {
        if (show && this.IsUpdatingIntelliSense) {
            this.intelliSenseStatusBarItem.show();
        }
        else {
            this.intelliSenseStatusBarItem.hide();
        }
    }
    set ShowConfiguration(show) {
        if (show) {
            this.configStatusBarItem.show();
        }
        else {
            this.configStatusBarItem.hide();
        }
    }
    activeDocumentChanged() {
        let activeEditor = vscode.window.activeTextEditor;
        let show = (activeEditor && (activeEditor.document.languageId === "cpp" || activeEditor.document.languageId === "c"));
        this.ShowConfiguration = show;
        this.ShowDBIcon = show;
        this.ShowFlameIcon = show;
        this.ShowNavigation = show;
    }
    bind(client) {
        client.TagParsingChanged(value => { this.IsTagParsing = value; });
        client.IntelliSenseParsingChanged(value => { this.IsUpdatingIntelliSense = value; });
        client.NavigationLocationChanged(value => { this.NavigationLocation = value; });
        client.TagParserStatusChanged(value => { this.TagParseStatus = value; });
        client.ActiveConfigChanged(value => { this.ActiveConfig = value; });
    }
    showNavigationOptions(navigationList) {
        let options = {};
        options.placeHolder = "Select where to navigate to";
        let items = [];
        let navlist = navigationList.split(";");
        for (let i = 0; i < navlist.length - 1; i += 2) {
            items.push({ label: navlist[i], description: "", index: Number(navlist[i + 1]) });
        }
        let result = vscode.window.showQuickPick(items, options)
            .then(selection => {
            if (!selection) {
                return;
            }
            vscode.window.activeTextEditor.revealRange(new vscode.Range(selection.index, 0, selection.index, 0));
            vscode.window.activeTextEditor.selection = new vscode.Selection(new vscode.Position(selection.index, 0), new vscode.Position(selection.index, 0));
        });
    }
    showConfigurations(configurationNames) {
        let options = {};
        options.placeHolder = "Select a Configuration...";
        let items = [];
        for (let i = 0; i < configurationNames.length; i++) {
            items.push({ label: configurationNames[i], description: "", index: i });
        }
        items.push({ label: "Edit Configurations...", description: "", index: configurationNames.length });
        return vscode.window.showQuickPick(items, options)
            .then(selection => {
            if (!selection) {
                return -1;
            }
            return selection.index;
        });
    }
    showWorkspaces(workspaceNames) {
        let options = {};
        options.placeHolder = "Select a Workspace...";
        let items = [];
        workspaceNames.forEach(name => items.push({ label: name.name, description: "", key: name.key }));
        return vscode.window.showQuickPick(items, options)
            .then(selection => {
            if (!selection)
                return "";
            return selection.key;
        });
    }
    showParsingCommands() {
        let options = {};
        options.placeHolder = "Select a parsing command...";
        let items;
        items = [];
        if (this.browseEngineStatusBarItem.tooltip == "Parsing paused") {
            items.push({ label: "Resume Parsing", description: "", index: 1 });
        }
        else {
            items.push({ label: "Pause Parsing", description: "", index: 0 });
        }
        return vscode.window.showQuickPick(items, options)
            .then(selection => {
            if (!selection) {
                return -1;
            }
            return selection.index;
        });
    }
    dispose() {
        this.configStatusBarItem.dispose();
        this.browseEngineStatusBarItem.dispose();
        this.intelliSenseStatusBarItem.dispose();
        this.navigationStatusBarItem.dispose();
    }
}
exports.UI = UI;
function getUI() {
    if (ui === undefined) {
        ui = new UI();
    }
    return ui;
}
exports.getUI = getUI;
//# sourceMappingURL=ui.js.map