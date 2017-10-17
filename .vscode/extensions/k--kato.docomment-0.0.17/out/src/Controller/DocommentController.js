"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const Configuration_1 = require("../Entity/Config/Contributes/Configuration");
class DocommentController {
    /*-------------------------------------------------------------------------
     * Entry Constructor
     *-----------------------------------------------------------------------*/
    constructor(docommentDomain) {
        this._docommentDomain = docommentDomain;
        /* Load Configuration File (.vscode/settings.json) */
        this.loadConfig();
        const subscriptions = [];
        /* Add Text Change Event */
        vscode_1.workspace.onDidChangeTextDocument(event => {
            const activeEditor = vscode_1.window.activeTextEditor;
            if (activeEditor && event.document === activeEditor.document) {
                this._onEvent(activeEditor, event.contentChanges[0]);
            }
        }, this, subscriptions);
        /* Add Config File Change Event */
        vscode_1.workspace.onDidChangeConfiguration(() => {
            this.loadConfig();
        }, this, subscriptions);
        this._disposable = vscode_1.Disposable.from(...subscriptions);
    }
    /*-------------------------------------------------------------------------
     * Public Method
     *-----------------------------------------------------------------------*/
    /* @implements */
    dispose() {
        this._disposable.dispose();
    }
    /*-------------------------------------------------------------------------
     * Private Method
     *-----------------------------------------------------------------------*/
    loadConfig() {
        const confDocomment = vscode_1.workspace.getConfiguration(Configuration_1.Configuration.KEY_DOCOMMENT);
        const confFiles = vscode_1.workspace.getConfiguration(Configuration_1.Configuration.KEY_FILES);
        const confEditor = vscode_1.workspace.getConfiguration(Configuration_1.Configuration.KEY_EDITOR);
        this._config = new Configuration_1.Configuration();
        this._config.activateOnEnter = confDocomment.get(Configuration_1.Configuration.ACTIVATE_ON_ENTER, false);
        this._config.eol = confFiles.get(Configuration_1.Configuration.EOL, '\n');
        this._config.insertSpaces = confEditor.get(Configuration_1.Configuration.INSERT_SPACES, false);
        this._config.detectIdentation = confEditor.get(Configuration_1.Configuration.DETECT_IDENTATION, true);
    }
    /*-------------------------------------------------------------------------
     * Event
     *-----------------------------------------------------------------------*/
    _onEvent(activeEditor, event) {
        // Insert XML document comment
        this._docommentDomain.Execute(activeEditor, event, this._languageId, this._config);
    }
}
exports.DocommentController = DocommentController;
//# sourceMappingURL=DocommentController.js.map