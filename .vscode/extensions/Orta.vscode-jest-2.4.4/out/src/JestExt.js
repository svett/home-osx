"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const jest_editor_support_1 = require("jest-editor-support");
const jest_test_typescript_parser_1 = require("jest-test-typescript-parser");
const micromatch_1 = require("micromatch");
const decorations = require("./decorations");
const status = require("./statusBar");
const TestReconciliationState_1 = require("./TestReconciliationState");
const helpers_1 = require("./helpers");
const fs_1 = require("fs");
const Coverage_1 = require("./Coverage");
const diagnostics_1 = require("./diagnostics");
class JestExt {
    constructor(workspace, outputChannel, pluginSettings) {
        this.parsingTestFile = false;
        this.forcedClose = false;
        this.workspace = workspace;
        this.channel = outputChannel;
        this.failingAssertionDecorators = [];
        this.failDiagnostics = vscode.languages.createDiagnosticCollection('Jest');
        this.clearOnNextInput = true;
        this.reconciler = new jest_editor_support_1.TestReconciler();
        this.jestSettings = new jest_editor_support_1.Settings(workspace);
        this.pluginSettings = pluginSettings;
        this.coverage = new Coverage_1.Coverage(this.workspace.rootPath);
        this.getSettings();
    }
    startProcess() {
        // The Runner is an event emitter that handles taking the Jest
        // output and converting it into different types of data that
        // we can handle here differently.
        if (this.jestProcess) {
            this.jestProcess.closeProcess();
            delete this.jestProcess;
        }
        let maxRestart = 4;
        this.jestProcess = new jest_editor_support_1.Runner(this.workspace);
        this.jestProcess
            .on('debuggerProcessExit', () => {
            this.channel.appendLine('Closed Jest');
            if (this.forcedClose) {
                this.forcedClose = false;
                return;
            }
            if (maxRestart-- <= 0) {
                console.warn('jest has been restarted too many times, please check your system');
                status.stopped('(too many restarts)');
                return;
            }
            const msg = this.jestProcess.watchMode
                ? 'jest exited unexpectedly, restarting watch mode'
                : 'starting watch mode';
            this.channel.appendLine(msg);
            this.closeJest();
            this.jestProcess.start(true);
            status.running(msg);
        })
            .on('executableJSON', (data) => {
            this.updateWithData(data);
        })
            .on('executableOutput', (output) => {
            if (!this.shouldIgnoreOutput(output)) {
                this.channel.appendLine(output);
            }
        })
            .on('executableStdErr', (error) => {
            const message = error.toString();
            if (this.shouldIgnoreOutput(message)) {
                return;
            }
            // The "tests are done" message comes through stdErr
            // We want to use this as a marker that the console should
            // be cleared, as the next input will be from a new test run.
            if (this.clearOnNextInput) {
                this.clearOnNextInput = false;
                this.parsingTestFile = false;
                this.testsHaveStartedRunning();
            }
            // thanks Qix, http://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings
            const noANSI = message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
            if (noANSI.includes('snapshot test failed')) {
                this.detectedSnapshotErrors();
            }
            this.channel.appendLine(noANSI);
        })
            .on('nonTerminalError', (error) => {
            this.channel.appendLine(`Received an error from Jest Runner: ${error.toString()}`);
        })
            .on('exception', result => {
            this.channel.appendLine(`\nException raised: [${result.type}]: ${result.message}\n`);
        })
            .on('terminalError', (error) => {
            this.channel.appendLine('\nException raised: ' + error);
        });
        // The theme stuff
        this.setupDecorators();
        // The bottom bar thing
        this.setupStatusBar();
        //reset the jest diagnostics
        diagnostics_1.resetDiagnostics(this.failDiagnostics);
        this.forcedClose = false;
        // Go!
        this.jestProcess.start(false);
    }
    stopProcess() {
        this.channel.appendLine('Closing Jest jest_runner.');
        this.closeJest();
        delete this.jestProcess;
        status.stopped();
    }
    closeJest() {
        if (!this.jestProcess) {
            return;
        }
        this.forcedClose = true;
        this.jestProcess.closeProcess();
    }
    getSettings() {
        this.getJestVersion(jestVersionMajor => {
            if (jestVersionMajor < 20) {
                vscode.window.showErrorMessage('This extension relies on Jest 20+ features, it will continue to work, but some features may not work correctly.');
            }
            this.workspace.localJestMajorVersion = jestVersionMajor;
            // If we should start the process by default, do so
            if (this.pluginSettings.autoEnable) {
                this.startProcess();
            }
            else {
                this.channel.appendLine('Skipping initial Jest runner process start.');
            }
        });
        // Do nothing for the minute, the above ^ can come back once
        // https://github.com/facebook/jest/pull/3592 is deployed
        try {
            this.jestSettings.getConfig(() => { });
        }
        catch (error) {
            console.log('[vscode-jest] Getting Jest config crashed, likely due to Jest version being below version 20.');
        }
    }
    detectedSnapshotErrors() {
        if (!this.pluginSettings.enableSnapshotUpdateMessages) {
            return;
        }
        vscode.window
            .showInformationMessage('Would you like to update your Snapshots?', { title: 'Replace them' })
            .then(response => {
            // No response == cancel
            if (response) {
                this.jestProcess.runJestWithUpdateForSnapshots(() => {
                    vscode.window.showInformationMessage('Updated Snapshots. It will show in your next test run.');
                });
            }
        });
    }
    triggerUpdateDecorations(editor) {
        Coverage_1.showCoverageOverlay(editor, this.coverage);
        if (!this.canUpdateDecorators(editor)) {
            return;
        }
        // OK - lets go
        this.parsingTestFile = true;
        this.updateDotDecorators(editor);
        this.parsingTestFile = false;
    }
    parseTestFile(path) {
        const isTypeScript = path.match(/.(ts|tsx)$/);
        const parser = isTypeScript ? jest_test_typescript_parser_1.parse : jest_editor_support_1.parse;
        return parser(path);
    }
    sortDecorationBlocks(itBlocks, assertions, enableInlineErrorMessages) {
        // This makes it cheaper later down the line
        const successes = [];
        const fails = [];
        const skips = [];
        const unknowns = [];
        const inlineErrors = [];
        const assertionMap = {};
        assertions.forEach(a => (assertionMap[a.title] = a));
        // Use the parsers it blocks for references
        itBlocks.forEach(it => {
            const state = assertionMap[it.name];
            if (state) {
                switch (state.status) {
                    case TestReconciliationState_1.TestReconciliationState.KnownSuccess:
                        successes.push(it);
                        break;
                    case TestReconciliationState_1.TestReconciliationState.KnownFail:
                        fails.push(it);
                        if (enableInlineErrorMessages) {
                            inlineErrors.push(state);
                        }
                        break;
                    case TestReconciliationState_1.TestReconciliationState.KnownSkip:
                        skips.push(it);
                        break;
                    case TestReconciliationState_1.TestReconciliationState.Unknown:
                        unknowns.push(it);
                        break;
                }
            }
            else {
                unknowns.push(it);
            }
        });
        return { successes, fails, skips, unknowns, inlineErrors };
    }
    updateDotDecorators(editor) {
        const filePath = editor.document.uri.fsPath;
        const { itBlocks } = this.parseTestFile(filePath);
        const assertions = this.reconciler.assertionsForTestFile(filePath);
        const { successes, fails, skips, unknowns, inlineErrors } = this.sortDecorationBlocks(itBlocks, assertions, this.pluginSettings.enableInlineErrorMessages);
        const styleMap = [
            { data: successes, decorationType: this.passingItStyle, state: TestReconciliationState_1.TestReconciliationState.KnownSuccess },
            { data: fails, decorationType: this.failingItStyle, state: TestReconciliationState_1.TestReconciliationState.KnownFail },
            { data: skips, decorationType: this.skipItStyle, state: TestReconciliationState_1.TestReconciliationState.KnownSkip },
            { data: unknowns, decorationType: this.unknownItStyle, state: TestReconciliationState_1.TestReconciliationState.Unknown },
        ];
        styleMap.forEach(style => {
            const decorators = this.generateDotsForItBlocks(style.data, style.state);
            editor.setDecorations(style.decorationType, decorators);
        });
        this.resetInlineErrorDecorators(editor);
        inlineErrors.forEach(a => {
            const { style, decorator } = this.generateInlineErrorDecorator(a);
            editor.setDecorations(style, [decorator]);
        });
    }
    resetInlineErrorDecorators(_) {
        this.failingAssertionDecorators.forEach(element => {
            element.dispose();
        });
        this.failingAssertionDecorators = [];
    }
    generateInlineErrorDecorator(assertion) {
        const errorMessage = assertion.terseMessage || assertion.shortMessage;
        const decorator = {
            range: new vscode.Range(assertion.line - 1, 0, assertion.line - 1, 0),
            hoverMessage: errorMessage,
        };
        // We have to make a new style for each unique message, this is
        // why we have to remove off of them beforehand
        const style = decorations.failingAssertionStyle(errorMessage);
        this.failingAssertionDecorators.push(style);
        return { style, decorator };
    }
    canUpdateDecorators(editor) {
        const atEmptyScreen = !editor;
        if (atEmptyScreen) {
            return false;
        }
        const inSettings = !editor.document;
        if (inSettings) {
            return false;
        }
        if (this.parsingTestFile) {
            return false;
        }
        const isATestFile = this.wouldJestRunURI(editor.document.uri);
        return isATestFile;
    }
    wouldJestRunURI(uri) {
        const filePath = uri.fsPath;
        const globs = this.jestSettings.settings.testMatch;
        if (globs && globs.length) {
            const matchers = globs.map(each => micromatch_1.matcher(each, { dot: true }));
            const matched = matchers.some(isMatch => isMatch(filePath));
            return matched;
        }
        const root = this.pluginSettings.rootPath;
        let relative = path.normalize(path.relative(root, filePath));
        // replace windows path separator with normal slash
        if (path.sep === '\\') {
            relative = relative.replace(/\\/g, '/');
        }
        const testRegex = new RegExp(this.jestSettings.settings.testRegex);
        const matches = relative.match(testRegex);
        return matches && matches.length > 0;
    }
    setupStatusBar() {
        if (this.pluginSettings.autoEnable) {
            this.testsHaveStartedRunning();
        }
        else {
            status.initial();
        }
    }
    setupDecorators() {
        this.passingItStyle = decorations.passingItName();
        this.failingItStyle = decorations.failingItName();
        this.skipItStyle = decorations.skipItName();
        this.unknownItStyle = decorations.notRanItName();
    }
    shouldIgnoreOutput(text) {
        return text.includes('Watch Usage');
    }
    testsHaveStartedRunning() {
        this.channel.clear();
        const details = this.jestProcess && this.jestProcess.watchMode ? 'testing changes' : 'initial full test run';
        status.running(details);
    }
    updateWithData(data) {
        this.coverage.mapCoverage(data.coverageMap);
        const results = this.reconciler.updateFileWithJestStatus(data);
        diagnostics_1.updateDiagnostics(results, this.failDiagnostics);
        const failedFileCount = diagnostics_1.failedSuiteCount(this.failDiagnostics);
        if (failedFileCount <= 0 && data.success) {
            status.success();
        }
        else {
            status.failed(` (${failedFileCount} test suite${failedFileCount > 1 ? 's' : ''} failed)`);
        }
        this.triggerUpdateDecorations(vscode.window.activeTextEditor);
        this.clearOnNextInput = true;
    }
    generateDotsForItBlocks(blocks, state) {
        const nameForState = (_name, state) => {
            switch (state) {
                case TestReconciliationState_1.TestReconciliationState.KnownSuccess:
                    return 'Passed';
                case TestReconciliationState_1.TestReconciliationState.KnownFail:
                    return 'Failed';
                case TestReconciliationState_1.TestReconciliationState.KnownSkip:
                    return 'Skipped';
                case TestReconciliationState_1.TestReconciliationState.Unknown:
                    return 'Test has not run yet, due to Jest only running tests related to changes.';
            }
        };
        return blocks.map(it => {
            return {
                // VS Code is indexed starting at 0
                // jest-editor-support is indexed starting at 1
                range: new vscode.Range(it.start.line - 1, it.start.column - 1, it.start.line - 1, it.start.column + 1),
                hoverMessage: nameForState(it.name, state),
            };
        });
    }
    deactivate() {
        this.jestProcess.closeProcess();
    }
    getJestVersion(version) {
        const packageJSON = helpers_1.pathToJestPackageJSON(this.pluginSettings);
        if (packageJSON) {
            const contents = fs_1.readFileSync(packageJSON, 'utf8');
            const packageMetadata = JSON.parse(contents);
            if (packageMetadata['version']) {
                version(parseInt(packageMetadata['version']));
                return;
            }
        }
        // Fallback to last pre-20 release
        version(18);
    }
}
exports.JestExt = JestExt;
//# sourceMappingURL=JestExt.js.map