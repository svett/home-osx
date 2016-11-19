'use strict';
const vscode = require('vscode');
const settings = require('../common/configSettings');
const constants_1 = require('../common/constants');
let path = require('path');
let terminal;
const utils_1 = require('../common/utils');
function activateExecInTerminalProvider() {
    const disposables = [];
    disposables.push(vscode.commands.registerCommand(constants_1.Commands.Exec_In_Terminal, execInTerminal));
    disposables.push(vscode.commands.registerCommand(constants_1.Commands.Exec_Selection_In_Terminal, execSelectionInTerminal));
    disposables.push(vscode.window.onDidCloseTerminal((closedTermina) => {
        if (terminal === closedTermina) {
            terminal = null;
        }
    }));
    return disposables;
}
exports.activateExecInTerminalProvider = activateExecInTerminalProvider;
function execInTerminal(fileUri) {
    let pythonSettings = settings.PythonSettings.getInstance();
    const currentPythonPath = pythonSettings.pythonPath;
    let filePath;
    if (fileUri === undefined || typeof fileUri.fsPath !== 'string') {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor !== undefined) {
            if (!activeEditor.document.isUntitled) {
                if (activeEditor.document.languageId === constants_1.PythonLanguage.language) {
                    filePath = activeEditor.document.fileName;
                }
                else {
                    vscode.window.showErrorMessage('The active file is not a Python source file');
                    return;
                }
            }
            else {
                vscode.window.showErrorMessage('The active file needs to be saved before it can be run');
                return;
            }
        }
        else {
            vscode.window.showErrorMessage('No open file to run in terminal');
            return;
        }
    }
    else {
        filePath = fileUri.fsPath;
    }
    if (filePath.indexOf(' ') > 0) {
        filePath = `"${filePath}"`;
    }
    terminal = terminal ? terminal : vscode.window.createTerminal(`Python`);
    if (pythonSettings.terminal && pythonSettings.terminal.executeInFileDir) {
        const fileDirPath = path.dirname(filePath).substring(1);
        if (fileDirPath !== vscode.workspace.rootPath) {
            terminal.sendText(`cd "${fileDirPath}"`);
        }
    }
    const launchArgs = settings.PythonSettings.getInstance().terminal.launchArgs;
    const launchArgsString = launchArgs.length > 0 ? " ".concat(launchArgs.join(" ")) : "";
    if (utils_1.IS_WINDOWS) {
        const cmd = `"${currentPythonPath}"${launchArgsString} ${filePath}`;
        terminal.sendText(cmd.replace(/\\/g, "/"));
    }
    else {
        terminal.sendText(`${currentPythonPath}${launchArgsString} ${filePath}`);
    }
    terminal.show();
}
function execSelectionInTerminal() {
    const currentPythonPath = settings.PythonSettings.getInstance().pythonPath;
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    const selection = vscode.window.activeTextEditor.selection;
    if (selection.isEmpty) {
        return;
    }
    const code = vscode.window.activeTextEditor.document.getText(new vscode.Range(selection.start, selection.end));
    terminal = terminal ? terminal : vscode.window.createTerminal(`Python`);
    const launchArgs = settings.PythonSettings.getInstance().terminal.launchArgs;
    const launchArgsString = launchArgs.length > 0 ? " ".concat(launchArgs.join(" ")) : "";
    if (utils_1.IS_WINDOWS) {
        // Multi line commands don't work the same way on windows terminals as it does on other OS
        // So just start the Python REPL, then send the commands
        terminal.sendText(`"${currentPythonPath}"${launchArgsString}`);
        terminal.sendText(code);
    }
    else {
        terminal.sendText(`${currentPythonPath}${launchArgsString} -c "${code}"`);
    }
    terminal.show();
}
//# sourceMappingURL=execInTerminalProvider.js.map