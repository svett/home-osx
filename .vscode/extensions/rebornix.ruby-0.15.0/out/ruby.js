"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
const Locate = require("./locate/locate");
const cp = require("child_process");
const lintCollection_1 = require("./lint/lintCollection");
const rubyFormat_1 = require("./format/rubyFormat");
const utils = require("./utils");
const rake_1 = require("./task/rake");
function activate(context) {
    const subs = context.subscriptions;
    // register language config
    vscode.languages.setLanguageConfiguration('ruby', {
        indentationRules: {
            increaseIndentPattern: /^\s*((begin|class|def|else|elsif|ensure|for|if|module|rescue|unless|until|when|while)|(.*\sdo\b))\b[^\{;]*$/,
            decreaseIndentPattern: /^\s*([}\]]([,)]?\s*(#|$)|\.[a-zA-Z_]\w*\b)|(end|rescue|ensure|else|elsif|when)\b)/
        },
        wordPattern: /(-?\d+(?:\.\d+))|(:?[A-Za-z][^-`~@#%^&()=+[{}|;:'",<>/.*\]\s\\!?]*[!?]?)/
    });
    registerHighlightProvider(context);
    registerLinters(context);
    registerCompletionProvider(context);
    registerFormatter(context);
    registerIntellisenseProvider(context);
    rake_1.registerTaskProvider(context);
    utils.loadEnv();
}
exports.activate = activate;
function getGlobalConfig() {
    let globalConfig = {};
    let rubyInterpreterPath = vscode.workspace.getConfiguration("ruby.interpreter").commandPath;
    if (rubyInterpreterPath) {
        globalConfig["rubyInterpreterPath"] = rubyInterpreterPath;
    }
    return globalConfig;
}
function registerHighlightProvider(ctx) {
    // highlight provider
    let pairedEnds = [];
    const getEnd = function (line) {
        //end must be on a line by itself, or followed directly by a dot
        let match = line.text.match(/^(\s*)end\b[\.\s#]?\s*$/);
        if (match) {
            return new vscode.Range(line.lineNumber, match[1].length, line.lineNumber, match[1].length + 3);
        }
    };
    const getEntry = function (line) {
        //only lines that start with the entry
        let match = line.text.match(/^(\s*)(begin|class|def|for|if|module|unless|until|case|while)\b[^\{;]*$/);
        if (match) {
            return new vscode.Range(line.lineNumber, match[1].length, line.lineNumber, match[1].length + match[2].length);
        }
        else {
            //check for do
            match = line.text.match(/\b(do)\b\s*(\|.*\|[^;]*)?$/);
            if (match) {
                return new vscode.Range(line.lineNumber, match.index, line.lineNumber, match.index + 2);
            }
        }
    };
    const balancePairs = function (doc) {
        pairedEnds = [];
        if (doc.languageId !== 'ruby')
            return;
        let waitingEntries = [];
        let entry, end;
        for (let i = 0; i < doc.lineCount; i++) {
            if ((entry = getEntry(doc.lineAt(i)))) {
                waitingEntries.push(entry);
            }
            else if (waitingEntries.length && (end = getEnd(doc.lineAt(i)))) {
                pairedEnds.push({
                    entry: waitingEntries.pop(),
                    end: end
                });
            }
        }
    };
    const balanceEvent = function (event) {
        if (event && event.document)
            balancePairs(event.document);
    };
    ctx.subscriptions.push(vscode.languages.registerDocumentHighlightProvider('ruby', {
        provideDocumentHighlights: (doc, pos) => {
            let result = pairedEnds.find(pair => (pair.entry.start.line === pos.line ||
                pair.end.start.line === pos.line));
            if (result) {
                return [new vscode.DocumentHighlight(result.entry, 2), new vscode.DocumentHighlight(result.end, 2)];
            }
        }
    }));
    ctx.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(balanceEvent));
    ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument(balanceEvent));
    ctx.subscriptions.push(vscode.workspace.onDidOpenTextDocument(balancePairs));
    if (vscode.window && vscode.window.activeTextEditor) {
        balancePairs(vscode.window.activeTextEditor.document);
    }
}
function registerLinters(ctx) {
    const globalConfig = getGlobalConfig();
    const linters = new lintCollection_1.LintCollection(globalConfig, vscode.workspace.getConfiguration("ruby").lint, vscode.workspace.rootPath);
    ctx.subscriptions.push(linters);
    function executeLinting(e) {
        if (!e)
            return;
        linters.run(e.document);
    }
    ctx.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(executeLinting));
    ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument(executeLinting));
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        const docs = vscode.window.visibleTextEditors.map(editor => editor.document);
        console.log("Config changed. Should lint:", docs.length);
        const globalConfig = getGlobalConfig();
        linters.cfg(vscode.workspace.getConfiguration("ruby").lint, globalConfig);
        docs.forEach(doc => linters.run(doc));
    }));
    // run against all of the current open files
    vscode.window.visibleTextEditors.forEach(executeLinting);
}
function registerCompletionProvider(ctx) {
    const completeCommand = function (args) {
        let rctCompletePath = vscode.workspace.getConfiguration('ruby.rctComplete').get('commandPath', 'rct-complete');
        args.push('--interpreter');
        args.push(vscode.workspace.getConfiguration('ruby.interpreter').get('commandPath', 'ruby'));
        if (process.platform === 'win32')
            return cp.spawn('cmd', ['/c', rctCompletePath].concat(args));
        return cp.spawn(rctCompletePath, args);
    };
    const completeTest = completeCommand(['--help']);
    completeTest.on('exit', () => {
        ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(
        /** selector */ 'ruby', 
        /** provider */ {
            provideCompletionItems: function completionProvider(document, position, token) {
                return new Promise((resolve, reject) => {
                    const line = position.line + 1;
                    const column = position.character;
                    let child = completeCommand([
                        '--completion-class-info',
                        '--dev',
                        '--fork',
                        '--line=' + line,
                        '--column=' + column
                    ]);
                    let outbuf = [], errbuf = [];
                    child.stderr.on('data', (data) => errbuf.push(data));
                    child.stdout.on('data', (data) => outbuf.push(data));
                    child.stdout.on('end', () => {
                        if (errbuf.length > 0)
                            return reject(Buffer.concat(errbuf).toString());
                        let completionItems = [];
                        Buffer.concat(outbuf).toString().split('\n').forEach(function (elem) {
                            let items = elem.split('\t');
                            if (/^[^\w]/.test(items[0]))
                                return;
                            if (items[0].trim().length === 0)
                                return;
                            let completionItem = new vscode.CompletionItem(items[0]);
                            completionItem.detail = items[1];
                            completionItem.documentation = items[1];
                            completionItem.filterText = items[0];
                            completionItem.insertText = items[0];
                            completionItem.label = items[0];
                            completionItem.kind = vscode.CompletionItemKind.Method;
                            completionItems.push(completionItem);
                        }, this);
                        if (completionItems.length === 0)
                            return reject([]);
                        return resolve(completionItems);
                    });
                    child.stdin.end(document.getText());
                });
            }
        }, 
        /** triggerCharacters */ ...['.']));
    });
    completeTest.on('error', () => 0);
}
function registerFormatter(ctx) {
    new rubyFormat_1.RubyDocumentFormattingEditProvider().register(ctx);
}
function registerIntellisenseProvider(ctx) {
    // for locate: if it's a project, use the root, othewise, don't bother
    if (vscode.workspace.rootPath) {
        const refreshLocate = () => {
            let progressOptions = { location: vscode.ProgressLocation.Window, title: 'Indexing Ruby source files' };
            vscode.window.withProgress(progressOptions, () => locate.walk());
        };
        const settings = vscode.workspace.getConfiguration("ruby.locate") || {};
        let locate = new Locate(vscode.workspace.rootPath, settings);
        refreshLocate();
        ctx.subscriptions.push(vscode.commands.registerCommand('ruby.reloadProject', refreshLocate));
        const watch = vscode.workspace.createFileSystemWatcher(settings.include);
        watch.onDidChange(uri => locate.parse(uri.fsPath));
        watch.onDidCreate(uri => locate.parse(uri.fsPath));
        watch.onDidDelete(uri => locate.rm(uri.fsPath));
        const locationConverter = match => new vscode.Location(vscode.Uri.file(match.file), new vscode.Position(match.line, match.char));
        const defProvider = {
            provideDefinition: (doc, pos) => {
                const txt = doc.getText(doc.getWordRangeAtPosition(pos));
                return locate.find(txt).then(matches => matches.map(locationConverter));
            }
        };
        ctx.subscriptions.push(vscode.languages.registerDefinitionProvider(['ruby', 'erb'], defProvider));
        const symbolKindTable = {
            class: () => vscode_1.SymbolKind.Class,
            module: () => vscode_1.SymbolKind.Module,
            method: symbolInfo => symbolInfo.name === 'initialize' ? vscode_1.SymbolKind.Constructor : vscode_1.SymbolKind.Method,
            classMethod: () => vscode_1.SymbolKind.Method,
        };
        const defaultSymbolKind = symbolInfo => {
            console.warn(`Unknown symbol type: ${symbolInfo.type}`);
            return vscode_1.SymbolKind.Variable;
        };
        // NOTE: Workaround for high CPU usage on IPC (channel.onread) when too many symbols returned.
        // For channel.onread see issue like this: https://github.com/Microsoft/vscode/issues/6026
        const numOfSymbolLimit = 3000;
        const symbolsConverter = matches => matches.slice(0, numOfSymbolLimit).map(match => {
            const symbolKind = (symbolKindTable[match.type] || defaultSymbolKind)(match);
            return new vscode_1.SymbolInformation(match.name, symbolKind, match.containerName, locationConverter(match));
        });
        const docSymbolProvider = {
            provideDocumentSymbols: (document, token) => {
                return locate.listInFile(document.fileName).then(symbolsConverter);
            }
        };
        ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(['ruby', 'erb'], docSymbolProvider));
        const workspaceSymbolProvider = {
            provideWorkspaceSymbols: (query, token) => {
                return locate.query(query).then(symbolsConverter);
            }
        };
        ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider));
    }
}
//# sourceMappingURL=ruby.js.map