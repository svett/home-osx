'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
class GoDebugConfigurationProvider {
    provideDebugConfigurations(folder, token) {
        return [
            {
                'name': 'Launch',
                'type': 'go',
                'request': 'launch',
                'mode': 'debug',
                'remotePath': '',
                'port': 2345,
                'host': '127.0.0.1',
                'program': '${fileDirname}',
                'env': {},
                'args': [],
                'showLog': true
            }
        ];
    }
    resolveDebugConfiguration(folder, debugConfiguration, token) {
        const gopath = util_1.getCurrentGoPath(folder ? folder.uri : null);
        if (!debugConfiguration || !debugConfiguration.request) {
            let activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor || activeEditor.document.languageId !== 'go') {
                return;
            }
            return {
                'name': 'Launch',
                'type': 'go',
                'request': 'launch',
                'mode': 'debug',
                'program': activeEditor.document.fileName,
                'env': {
                    'GOPATH': gopath
                }
            };
        }
        if (!debugConfiguration['env']) {
            debugConfiguration['env'] = { 'GOPATH': gopath };
        }
        else if (!debugConfiguration['env']['GOPATH']) {
            debugConfiguration['env']['GOPATH'] = gopath;
        }
        return debugConfiguration;
    }
}
exports.GoDebugConfigurationProvider = GoDebugConfigurationProvider;
//# sourceMappingURL=goDebugConfiguration.js.map