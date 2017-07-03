'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vsc = require("vscode");
const ext = require("../Extension");
const XPathEvaluator_1 = require("../services/XPathEvaluator");
const CFG_SECTION = 'xmlTools';
const CFG_PERSIST_QUERY = 'persistXPathQuery';
const CFG_IGNORE_DEFAULT_XMLNS = 'ignoreDefaultNamespace';
const MEM_QUERY_HISTORY = 'xpathQueryHistory';
const MEM_QUERY_LAST = 'xPathQueryLast';
const OUTPUT_CHANNEL = 'XPath Results';
class XPathFeatureProvider {
    static evaluateXPathAsync(editor, edit) {
        return __awaiter(this, void 0, void 0, function* () {
            let memento = ext.WorkspaceState || ext.GlobalState;
            let persistQueries = vsc.workspace.getConfiguration(CFG_SECTION).get(CFG_PERSIST_QUERY, true);
            let history = memento.get(MEM_QUERY_HISTORY, new Array());
            let globalLastQuery = memento.get(MEM_QUERY_LAST, '');
            let lastQuery = history.find((item) => {
                if (item.uri == editor.document.uri.toString()) {
                    return true;
                }
                return false;
            });
            let query = '';
            if (persistQueries) {
                if (lastQuery) {
                    query = lastQuery.query;
                }
                else {
                    query = globalLastQuery;
                }
            }
            query = yield vsc.window.showInputBox({
                placeHolder: 'XPath Query',
                prompt: 'Please enter an XPath query to evaluate.',
                value: query
            });
            if (query) {
                let ignoreDefaultNamespace = vsc.workspace.getConfiguration(CFG_SECTION).get(CFG_IGNORE_DEFAULT_XMLNS, true);
                let xml = editor.document.getText();
                let evalResult;
                try {
                    evalResult = XPathEvaluator_1.XPathEvaluator.evaluate(query, xml, ignoreDefaultNamespace);
                }
                catch (error) {
                    console.error(error);
                    vsc.window.showErrorMessage(`Something went wrong while evaluating the XPath: ${error}`);
                    return;
                }
                let outputChannel = vsc.window.createOutputChannel(OUTPUT_CHANNEL);
                outputChannel.clear();
                outputChannel.appendLine(`XPath Query: ${query}`);
                outputChannel.append('\n');
                if (evalResult.type === XPathEvaluator_1.EvaluatorResultType.NODE_COLLECTION) {
                    evalResult.result.forEach((node) => {
                        outputChannel.appendLine(`[Line ${node.lineNumber}] ${node.localName}: ${node.textContent}`);
                    });
                }
                else {
                    outputChannel.appendLine(`[Result]: ${evalResult.result}`);
                }
                outputChannel.show(vsc.ViewColumn.Three);
                if (persistQueries) {
                    lastQuery = new HistoricQuery(editor.document.uri.toString(), query);
                    let affectedIndex = -1;
                    history = history.map((item, index) => {
                        if (item.uri == lastQuery.uri) {
                            item.query = query;
                            affectedIndex = index;
                        }
                        return item;
                    });
                    if (affectedIndex == -1) {
                        history.push(lastQuery);
                    }
                    memento.update(MEM_QUERY_HISTORY, history);
                    memento.update(MEM_QUERY_LAST, query);
                }
            }
        });
    }
}
exports.XPathFeatureProvider = XPathFeatureProvider;
class HistoricQuery {
    constructor(uri, query) {
        this.uri = uri;
        this.query = query;
    }
}
