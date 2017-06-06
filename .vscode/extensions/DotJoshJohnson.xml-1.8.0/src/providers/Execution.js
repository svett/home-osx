'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vsc = require('vscode');
const ChildProcess_1 = require('../services/ChildProcess');
const CFG_SECTION = 'xmlTools';
const CFG_XQEXEC = 'xqueryExecutionEngine';
const CFG_XQARGS = 'xqueryExecutionArguments';
class XQueryExecutionProvider {
    static executeXQueryAsync(editor) {
        return __awaiter(this, void 0, Promise, function* () {
            let disposable;
            if (editor.document.languageId !== 'xquery') {
                vsc.window.showErrorMessage('This action can only be performed on an XQuery file.');
                return;
            }
            let executable = vsc.workspace.getConfiguration(CFG_SECTION).get(CFG_XQEXEC, null);
            let args = vsc.workspace.getConfiguration(CFG_SECTION).get(CFG_XQARGS, []);
            if (!executable || executable == '') {
                let action = yield vsc.window.showWarningMessage('An XQuery execution engine has not been defined.', 'Define Now');
                if (action == 'Define Now') {
                    vsc.commands.executeCommand('workbench.action.openGlobalSettings');
                }
                return;
            }
            let inputFile;
            disposable = vsc.window.setStatusBarMessage('Searching for XML files in folder...');
            let files = yield vsc.workspace.findFiles('**/*.xml', '', 100);
            disposable.dispose();
            if (typeof files === 'undefined') {
                vsc.window.showErrorMessage('You must have a folder opened in VS Code to use this feature.');
                return;
            }
            if (files.length > 1) {
                let qpItems = new Array();
                files.forEach((file) => {
                    let filename = file.fsPath.replace('\\', '/');
                    qpItems.push({
                        label: filename.substring(filename.lastIndexOf('/') + 1),
                        description: file.fsPath,
                        file: file
                    });
                });
                let selection = yield vsc.window.showQuickPick(qpItems, { placeHolder: 'Please select an input file.' });
                if (!selection) {
                    return;
                }
                inputFile = selection.file;
            }
            else {
                inputFile = files[0];
            }
            let outputPath = null;
            let outputPathPos = -1;
            for (let i = 0; i < args.length; i++) {
                if (i > 0) {
                    if (args[i - 1].search(/out|result/)) {
                        outputPath = args[i];
                        outputPathPos = i;
                    }
                }
            }
            if (outputPath) {
                outputPath = yield vsc.window.showInputBox({
                    placeHolder: 'ex. C:\\TEMP\XQueryOutput\\MyOutputFile.xml',
                    prompt: 'Please specify the output file path. Existing file behavior is determined by the execution engine you have specified.',
                    value: outputPath
                });
                args[outputPathPos] = outputPath;
            }
            disposable = vsc.window.setStatusBarMessage('Executing XQuery Script...');
            args = args.map((value) => {
                return value
                    .replace('$(script)', editor.document.uri.fsPath)
                    .replace('$(input)', inputFile.fsPath)
                    .replace('$(project)', vsc.workspace.rootPath);
            });
            try {
                yield ChildProcess_1.ChildProcess.spawnAsync(executable, args);
            }
            catch (error) {
                if (error.message.search(/[Ll]ine:?\s*\d+/gm) > -1) {
                    let match = /[Ll]ine:?\s*\d+/gm.exec(error.message);
                    let line = (Number.parseInt(match[0].replace(/([Ll]ine:?\s*)|\s/, '')) - 1);
                    let selection = yield vsc.window.showErrorMessage(error.message, `Go to Line ${line}`);
                    if (selection == `Go to Line ${line}`) {
                        editor.revealRange(new vsc.Range(line, 0, line, 0));
                    }
                }
                else {
                    vsc.window.showErrorMessage(error.message);
                }
            }
            finally {
                disposable.dispose();
            }
        });
    }
}
exports.XQueryExecutionProvider = XQueryExecutionProvider;
