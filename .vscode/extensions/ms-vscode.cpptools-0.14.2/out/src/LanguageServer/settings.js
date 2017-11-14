'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
let settings = undefined;
function getTarget() {
    return (vscode.workspace.workspaceFolders) ? vscode.ConfigurationTarget.WorkspaceFolder : vscode.ConfigurationTarget.Global;
}
class Settings {
    constructor(section, resource) {
        this.settings = vscode.workspace.getConfiguration(section, resource ? resource : null);
    }
    get Section() { return this.settings; }
}
class CppSettings extends Settings {
    constructor(resource) {
        super("C_Cpp", resource);
    }
    get clangFormatPath() { return super.Section.get("clang_format_path"); }
    get clangFormatStyle() { return super.Section.get("clang_format_style"); }
    get clangFormatFallbackStyle() { return super.Section.get("clang_format_fallbackStyle"); }
    get clangFormatSortIncludes() { return super.Section.get("clang_format_sortIncludes"); }
    get clangFormatOnSave() { return super.Section.get("clang_format_formatOnSave"); }
    get formatting() { return super.Section.get("formatting"); }
    get intelliSenseEngine() { return super.Section.get("intelliSenseEngine"); }
    get intelliSenseEngineFallback() { return super.Section.get("intelliSenseEngineFallback"); }
    get errorSquiggles() { return super.Section.get("errorSquiggles"); }
    get autoComplete() { return super.Section.get("autocomplete"); }
    get loggingLevel() { return super.Section.get("loggingLevel"); }
    get navigationLength() { return super.Section.get("navigation.length", 60); }
    toggleSetting(name, value1, value2) {
        let value = super.Section.get(name);
        super.Section.update(name, value === value1 ? value2 : value1, getTarget());
    }
}
exports.CppSettings = CppSettings;
class OtherSettings {
    constructor(resource) {
        if (!resource)
            resource = null;
        this.resource = resource;
    }
    get editorTabSize() { return vscode.workspace.getConfiguration("editor", this.resource).get("tabSize"); }
    get filesAssociations() { return vscode.workspace.getConfiguration("files", null).get("associations"); }
    get filesExclude() { return vscode.workspace.getConfiguration("files", this.resource).get("exclude"); }
    get searchExclude() { return vscode.workspace.getConfiguration("search", this.resource).get("exclude"); }
    set filesAssociations(value) {
        vscode.workspace.getConfiguration("files", null).update("associations", value, vscode.ConfigurationTarget.Workspace);
    }
}
exports.OtherSettings = OtherSettings;
//# sourceMappingURL=settings.js.map