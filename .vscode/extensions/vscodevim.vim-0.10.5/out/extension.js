"use strict";
/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const _ = require("lodash");
const main_1 = require("./src/cmd_line/main");
const editorIdentity_1 = require("./src/editorIdentity");
const modeHandler_1 = require("./src/mode/modeHandler");
const taskQueue_1 = require("./src/taskQueue");
const position_1 = require("./src/common/motion/position");
const globals_1 = require("./src/globals");
const notation_1 = require("./src/notation");
const mode_1 = require("./src/mode/mode");
const configuration_1 = require("./src/configuration/configuration");
const main_2 = require("./src/cmd_line/main");
require("./src/actions/vim.all");
const nvimUtil_1 = require("./src/neovim/nvimUtil");
const packagejson = require('../package.json'); // out/../package.json
let extensionContext;
/**
 * Note: We can't initialize modeHandler here, or even inside activate(), because some people
 * see a bug where VSC hasn't fully initialized yet, which pretty much breaks VSCodeVim entirely.
 */
let modeHandlerToEditorIdentity = {};
let previousActiveEditorId = new editorIdentity_1.EditorIdentity();
function getAndUpdateModeHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        const prevHandler = modeHandlerToEditorIdentity[previousActiveEditorId.toString()];
        const activeEditorId = new editorIdentity_1.EditorIdentity(vscode.window.activeTextEditor);
        let curHandler = modeHandlerToEditorIdentity[activeEditorId.toString()];
        if (!curHandler) {
            const newModeHandler = yield new modeHandler_1.ModeHandler();
            if (configuration_1.Configuration.enableNeovim) {
                yield nvimUtil_1.Neovim.initNvim(newModeHandler.vimState);
            }
            modeHandlerToEditorIdentity[activeEditorId.toString()] = newModeHandler;
            extensionContext.subscriptions.push(newModeHandler);
            curHandler = newModeHandler;
        }
        curHandler.vimState.editor = vscode.window.activeTextEditor;
        if (!prevHandler || curHandler.identity !== prevHandler.identity) {
            setTimeout(() => {
                curHandler.syncCursors();
            }, 0);
        }
        if (previousActiveEditorId.hasSameBuffer(activeEditorId)) {
            if (!previousActiveEditorId.isEqual(activeEditorId)) {
                // We have opened two editors, working on the same file.
                previousActiveEditorId = activeEditorId;
            }
        }
        else {
            previousActiveEditorId = activeEditorId;
            yield curHandler.updateView(curHandler.vimState, { drawSelection: false, revealRange: false });
        }
        if (prevHandler && curHandler.vimState.focusChanged) {
            curHandler.vimState.focusChanged = false;
            prevHandler.vimState.focusChanged = true;
        }
        vscode.commands.executeCommand('setContext', 'vim.mode', curHandler.vimState.currentModeName());
        // Temporary workaround for vscode bug not changing cursor style properly
        // https://github.com/Microsoft/vscode/issues/17472
        // https://github.com/Microsoft/vscode/issues/17513
        const options = curHandler.vimState.editor.options;
        const desiredStyle = options.cursorStyle;
        // Temporarily change to any other cursor style besides the desired type, then change back
        if (desiredStyle === vscode.TextEditorCursorStyle.Block) {
            curHandler.vimState.editor.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
            curHandler.vimState.editor.options.cursorStyle = desiredStyle;
        }
        else {
            curHandler.vimState.editor.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
            curHandler.vimState.editor.options.cursorStyle = desiredStyle;
        }
        return curHandler;
    });
}
exports.getAndUpdateModeHandler = getAndUpdateModeHandler;
class CompositionState {
    constructor() {
        this.isInComposition = false;
        this.composingText = '';
    }
}
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        extensionContext = context;
        let compositionState = new CompositionState();
        // Event to update active configuration items when changed without restarting vscode
        vscode.workspace.onDidChangeConfiguration((e) => {
            configuration_1.Configuration.updateConfiguration();
            /* tslint:disable:forin */
            // Update the remappers foreach modehandler
            for (let mh in modeHandlerToEditorIdentity) {
                modeHandlerToEditorIdentity[mh].createRemappers();
            }
        });
        vscode.window.onDidChangeActiveTextEditor(handleActiveEditorChange, this);
        vscode.workspace.onDidChangeTextDocument(event => {
            if (configuration_1.Configuration.disableExt) {
                return;
            }
            /**
             * Change from vscode editor should set document.isDirty to true but they initially don't!
             * There is a timing issue in vscode codebase between when the isDirty flag is set and
             * when registered callbacks are fired. https://github.com/Microsoft/vscode/issues/11339
             */
            let contentChangeHandler = (modeHandler) => {
                if (modeHandler.vimState.currentMode === mode_1.ModeName.Insert) {
                    if (modeHandler.vimState.historyTracker.currentContentChanges === undefined) {
                        modeHandler.vimState.historyTracker.currentContentChanges = [];
                    }
                    modeHandler.vimState.historyTracker.currentContentChanges = modeHandler.vimState.historyTracker.currentContentChanges.concat(event.contentChanges);
                }
            };
            if (globals_1.Globals.isTesting) {
                contentChangeHandler(globals_1.Globals.modeHandlerForTesting);
            }
            else {
                _.filter(modeHandlerToEditorIdentity, modeHandler => modeHandler.identity.fileName === event.document.fileName).forEach(modeHandler => {
                    contentChangeHandler(modeHandler);
                });
            }
            setTimeout(() => {
                if (!event.document.isDirty && !event.document.isUntitled && event.contentChanges.length) {
                    handleContentChangedFromDisk(event.document);
                }
            }, 0);
        });
        overrideCommand(context, 'type', (args) => __awaiter(this, void 0, void 0, function* () {
            taskQueue_1.taskQueue.enqueueTask(() => __awaiter(this, void 0, void 0, function* () {
                const mh = yield getAndUpdateModeHandler();
                if (compositionState.isInComposition) {
                    compositionState.composingText += args.text;
                }
                else {
                    yield mh.handleKeyEvent(args.text);
                }
            }));
        }));
        overrideCommand(context, 'replacePreviousChar', (args) => __awaiter(this, void 0, void 0, function* () {
            taskQueue_1.taskQueue.enqueueTask(() => __awaiter(this, void 0, void 0, function* () {
                const mh = yield getAndUpdateModeHandler();
                if (compositionState.isInComposition) {
                    compositionState.composingText =
                        compositionState.composingText.substr(0, compositionState.composingText.length - args.replaceCharCnt) + args.text;
                }
                else {
                    yield vscode.commands.executeCommand('default:replacePreviousChar', {
                        text: args.text,
                        replaceCharCnt: args.replaceCharCnt,
                    });
                    mh.vimState.cursorPosition = position_1.Position.FromVSCodePosition(mh.vimState.editor.selection.start);
                    mh.vimState.cursorStartPosition = position_1.Position.FromVSCodePosition(mh.vimState.editor.selection.start);
                }
            }));
        }));
        overrideCommand(context, 'compositionStart', (args) => __awaiter(this, void 0, void 0, function* () {
            taskQueue_1.taskQueue.enqueueTask(() => __awaiter(this, void 0, void 0, function* () {
                compositionState.isInComposition = true;
            }));
        }));
        overrideCommand(context, 'compositionEnd', (args) => __awaiter(this, void 0, void 0, function* () {
            taskQueue_1.taskQueue.enqueueTask(() => __awaiter(this, void 0, void 0, function* () {
                const mh = yield getAndUpdateModeHandler();
                let text = compositionState.composingText;
                compositionState = new CompositionState();
                yield mh.handleMultipleKeyEvents(text.split(''));
            }));
        }));
        registerCommand(context, 'extension.showCmdLine', () => {
            main_1.showCmdLine('', modeHandlerToEditorIdentity[new editorIdentity_1.EditorIdentity(vscode.window.activeTextEditor).toString()]);
        });
        registerCommand(context, 'vim.remap', (args) => __awaiter(this, void 0, void 0, function* () {
            taskQueue_1.taskQueue.enqueueTask(() => __awaiter(this, void 0, void 0, function* () {
                const mh = yield getAndUpdateModeHandler();
                if (args.after) {
                    for (const key of args.after) {
                        yield mh.handleKeyEvent(notation_1.AngleBracketNotation.Normalize(key));
                    }
                    return;
                }
                if (args.commands) {
                    for (const command of args.commands) {
                        // Check if this is a vim command by looking for :
                        if (command.command.slice(0, 1) === ':') {
                            yield main_2.runCmdLine(command.command.slice(1, command.command.length), mh);
                            yield mh.updateView(mh.vimState);
                        }
                        else {
                            yield vscode.commands.executeCommand(command.command, command.args);
                        }
                    }
                }
            }));
        }));
        vscode.workspace.onDidCloseTextDocument(event => {
            const documents = vscode.workspace.textDocuments;
            // Delete modehandler if vscode knows NOTHING about this document. This does
            // not handle the case of the same file open twice. This only handles the
            // case of deleting a modehandler once all tabs of this document have been
            // closed
            for (let mh in modeHandlerToEditorIdentity) {
                const editor = modeHandlerToEditorIdentity[mh].vimState.editor.document;
                if (documents.indexOf(editor) === -1) {
                    delete modeHandlerToEditorIdentity[mh];
                }
            }
        });
        /**
         * Toggles the VSCodeVim extension between Enabled mode and Disabled mode. This
         * function is activated by calling the 'toggleVim' command from the Command Palette.
         *
         * @param isDisabled if true, sets VSCodeVim to Disabled mode; else sets to enabled mode
         */
        function toggleExtension(isDisabled) {
            return __awaiter(this, void 0, void 0, function* () {
                yield vscode.commands.executeCommand('setContext', 'vim.active', !isDisabled);
                if (isDisabled) {
                    vscode.window.visibleTextEditors.forEach(editor => {
                        let options = editor.options;
                        switch (configuration_1.Configuration.userCursorString) {
                            case 'line':
                                options.cursorStyle = vscode.TextEditorCursorStyle.Line;
                                break;
                            case 'block':
                                options.cursorStyle = vscode.TextEditorCursorStyle.Block;
                                break;
                            case 'underline':
                                options.cursorStyle = vscode.TextEditorCursorStyle.Underline;
                                break;
                            default:
                                break;
                        }
                        editor.options = options;
                    });
                    let mh = yield getAndUpdateModeHandler();
                    mh.setStatusBarText('-- VIM: DISABLED --');
                }
                else {
                    compositionState = new CompositionState();
                    modeHandlerToEditorIdentity = {};
                    let mh = yield getAndUpdateModeHandler();
                    mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
                }
            });
        }
        registerCommand(context, 'toggleVim', () => __awaiter(this, void 0, void 0, function* () {
            configuration_1.Configuration.disableExt = !configuration_1.Configuration.disableExt;
            toggleExtension(configuration_1.Configuration.disableExt);
        }));
        // Clear boundKeyCombinations array incase there are any entries in it so
        // that we have a clean list of keys with no duplicates
        configuration_1.Configuration.boundKeyCombinations = [];
        for (let keybinding of packagejson.contributes.keybindings) {
            if (keybinding.when.indexOf('listFocus') !== -1) {
                continue;
            }
            let keyToBeBound = '';
            /**
             * On OSX, handle mac keybindings if we specified one.
             */
            if (process.platform === 'darwin') {
                keyToBeBound = keybinding.mac || keybinding.key;
            }
            else if (process.platform === 'linux') {
                keyToBeBound = keybinding.linux || keybinding.key;
            }
            else {
                keyToBeBound = keybinding.key;
            }
            const bracketedKey = notation_1.AngleBracketNotation.Normalize(keyToBeBound);
            // Store registered key bindings in bracket notation form
            configuration_1.Configuration.boundKeyCombinations.push(bracketedKey);
            registerCommand(context, keybinding.command, () => handleKeyEvent(`${bracketedKey}`));
        }
        // Update configuration now that bound keys array is populated
        configuration_1.Configuration.updateConfiguration();
        // Initialize mode handler for current active Text Editor at startup.
        if (vscode.window.activeTextEditor) {
            let mh = yield getAndUpdateModeHandler();
            mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
        }
        // This is called last because getAndUpdateModeHandler() will change cursor
        toggleExtension(configuration_1.Configuration.disableExt);
    });
}
exports.activate = activate;
function overrideCommand(context, command, callback) {
    let disposable = vscode.commands.registerCommand(command, (args) => __awaiter(this, void 0, void 0, function* () {
        if (configuration_1.Configuration.disableExt) {
            yield vscode.commands.executeCommand('default:' + command, args);
            return;
        }
        if (!vscode.window.activeTextEditor) {
            return;
        }
        if (vscode.window.activeTextEditor.document &&
            vscode.window.activeTextEditor.document.uri.toString() === 'debug:input') {
            yield vscode.commands.executeCommand('default:' + command, args);
            return;
        }
        callback(args);
    }));
    context.subscriptions.push(disposable);
}
function registerCommand(context, command, callback) {
    let disposable = vscode.commands.registerCommand(command, (args) => __awaiter(this, void 0, void 0, function* () {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        callback(args);
    }));
    context.subscriptions.push(disposable);
}
function handleKeyEvent(key) {
    return __awaiter(this, void 0, void 0, function* () {
        const mh = yield getAndUpdateModeHandler();
        taskQueue_1.taskQueue.enqueueTask(() => __awaiter(this, void 0, void 0, function* () {
            yield mh.handleKeyEvent(key);
        }));
    });
}
function handleContentChangedFromDisk(document) {
    _.filter(modeHandlerToEditorIdentity, modeHandler => modeHandler.identity.fileName === document.fileName).forEach(modeHandler => {
        modeHandler.vimState.historyTracker.clear();
    });
}
function handleActiveEditorChange() {
    return __awaiter(this, void 0, void 0, function* () {
        if (configuration_1.Configuration.disableExt) {
            return;
        }
        // Don't run this event handler during testing
        if (globals_1.Globals.isTesting) {
            return;
        }
        taskQueue_1.taskQueue.enqueueTask(() => __awaiter(this, void 0, void 0, function* () {
            if (vscode.window.activeTextEditor !== undefined) {
                const mh = yield getAndUpdateModeHandler();
                mh.updateView(mh.vimState, { drawSelection: false, revealRange: false });
            }
        }));
    });
}
process.on('unhandledRejection', function (reason, p) {
    console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});
//# sourceMappingURL=extension.js.map