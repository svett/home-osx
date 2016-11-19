'use strict';
const vscode = require('vscode');
const completionProvider_1 = require('./providers/completionProvider');
const hoverProvider_1 = require('./providers/hoverProvider');
const definitionProvider_1 = require('./providers/definitionProvider');
const referenceProvider_1 = require('./providers/referenceProvider');
const renameProvider_1 = require('./providers/renameProvider');
const formatProvider_1 = require('./providers/formatProvider');
const sortImports = require('./sortImports');
const lintProvider_1 = require('./providers/lintProvider');
const symbolProvider_1 = require('./providers/symbolProvider');
const signatureProvider_1 = require('./providers/signatureProvider');
const settings = require('./common/configSettings');
const telemetryHelper = require('./common/telemetry');
const telemetryContracts = require('./common/telemetryContracts');
const simpleRefactorProvider_1 = require('./providers/simpleRefactorProvider');
const setInterpreterProvider_1 = require('./providers/setInterpreterProvider');
const execInTerminalProvider_1 = require('./providers/execInTerminalProvider');
const tests = require('./unittests/main');
const jup = require('./jupyter/main');
const helpProvider_1 = require('./helpProvider');
const formatOnSaveProvider_1 = require('./providers/formatOnSaveProvider');
const PYTHON = { language: 'python', scheme: 'file' };
let unitTestOutChannel;
let formatOutChannel;
let lintingOutChannel;
let jupMain;
function activate(context) {
    let pythonSettings = settings.PythonSettings.getInstance();
    telemetryHelper.sendTelemetryEvent(telemetryContracts.EVENT_LOAD, {
        CodeComplete_Has_ExtraPaths: pythonSettings.autoComplete.extraPaths.length > 0 ? 'true' : 'false',
        Format_Has_Custom_Python_Path: pythonSettings.pythonPath.length !== 'python'.length ? 'true' : 'false'
    });
    lintingOutChannel = vscode.window.createOutputChannel(pythonSettings.linting.outputWindow);
    formatOutChannel = lintingOutChannel;
    if (pythonSettings.linting.outputWindow !== pythonSettings.formatting.outputWindow) {
        formatOutChannel = vscode.window.createOutputChannel(pythonSettings.formatting.outputWindow);
        formatOutChannel.clear();
    }
    if (pythonSettings.linting.outputWindow !== pythonSettings.unitTest.outputWindow) {
        unitTestOutChannel = vscode.window.createOutputChannel(pythonSettings.unitTest.outputWindow);
        unitTestOutChannel.clear();
    }
    sortImports.activate(context, formatOutChannel);
    context.subscriptions.push(setInterpreterProvider_1.activateSetInterpreterProvider());
    context.subscriptions.push(...execInTerminalProvider_1.activateExecInTerminalProvider());
    simpleRefactorProvider_1.activateSimplePythonRefactorProvider(context, formatOutChannel);
    context.subscriptions.push(formatOnSaveProvider_1.activateFormatOnSaveProvider(PYTHON, settings.PythonSettings.getInstance(), formatOutChannel, vscode.workspace.rootPath));
    // Enable indentAction
    vscode.languages.setLanguageConfiguration(PYTHON.language, {
        onEnterRules: [
            {
                beforeText: /^\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|async).*?:\s*$/,
                action: { indentAction: vscode.IndentAction.Indent }
            }
        ]
    });
    context.subscriptions.push(vscode.languages.registerRenameProvider(PYTHON, new renameProvider_1.PythonRenameProvider(formatOutChannel)));
    context.subscriptions.push(vscode.languages.registerHoverProvider(PYTHON, new hoverProvider_1.PythonHoverProvider(context)));
    const definitionProvider = new definitionProvider_1.PythonDefinitionProvider(context);
    const jediProx = definitionProvider.JediProxy;
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(PYTHON, definitionProvider));
    context.subscriptions.push(vscode.languages.registerReferenceProvider(PYTHON, new referenceProvider_1.PythonReferenceProvider(context, jediProx)));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(PYTHON, new completionProvider_1.PythonCompletionItemProvider(context), '.'));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(PYTHON, new symbolProvider_1.PythonSymbolProvider(context, jediProx)));
    if (pythonSettings.devOptions.indexOf('DISABLE_SIGNATURE') === -1) {
        context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(PYTHON, new signatureProvider_1.PythonSignatureProvider(context, jediProx), '(', ','));
    }
    const formatProvider = new formatProvider_1.PythonFormattingEditProvider(context, formatOutChannel, pythonSettings, vscode.workspace.rootPath);
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(PYTHON, formatProvider));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(PYTHON, formatProvider));
    jupMain = new jup.Jupyter(lintingOutChannel, vscode.workspace.rootPath);
    const documentHasJupyterCodeCells = jupMain.hasCodeCells.bind(jupMain);
    jupMain.activate();
    context.subscriptions.push(jupMain);
    context.subscriptions.push(new lintProvider_1.LintProvider(context, lintingOutChannel, vscode.workspace.rootPath, documentHasJupyterCodeCells));
    tests.activate(context, unitTestOutChannel);
    // Possible this extension loads before the others, so lets wait for 5 seconds
    setTimeout(disableOtherDocumentSymbolsProvider, 5000);
    const hepProvider = new helpProvider_1.HelpProvider();
    context.subscriptions.push(hepProvider);
}
exports.activate = activate;
function disableOtherDocumentSymbolsProvider() {
    const symbolsExt = vscode.extensions.getExtension('donjayamanne.language-symbols');
    if (symbolsExt && symbolsExt.isActive) {
        symbolsExt.exports.disableDocumentSymbolProvider(PYTHON);
    }
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map