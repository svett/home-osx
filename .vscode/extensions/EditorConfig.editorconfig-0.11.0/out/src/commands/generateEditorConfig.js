Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode_1 = require("vscode");
/**
 * Generate a .editorconfig file in the root of the workspace based on the
 * current vscode settings.
 */
function generateEditorConfig() {
    if (!vscode_1.workspace.rootPath) {
        vscode_1.window.showInformationMessage('Please open a folder before generating an .editorconfig file');
        return;
    }
    const editorConfigFile = path.join(vscode_1.workspace.rootPath, '.editorconfig');
    fs.stat(editorConfigFile, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                writeFile();
            }
            else {
                vscode_1.window.showErrorMessage(err.message);
            }
            return;
        }
        if (stats.isFile()) {
            vscode_1.window.showErrorMessage('A .editorconfig file already exists in your workspace.');
        }
    });
    function writeFile() {
        const editor = vscode_1.workspace.getConfiguration('editor');
        const files = vscode_1.workspace.getConfiguration('files');
        const settingsLines = ['root = true', '', '[*]'];
        function addSetting(key, value) {
            if (value !== undefined) {
                settingsLines.push(`${key} = ${value}`);
            }
        }
        const insertSpaces = editor.get('insertSpaces');
        addSetting('indent_style', insertSpaces ? 'space' : 'tab');
        addSetting(insertSpaces ? 'indent_size' : 'tab_size', editor.get('tabSize'));
        const eolMap = {
            '\r\n': 'crlf',
            '\n': 'lf',
        };
        addSetting('end_of_line', eolMap[files.get('eol')]);
        const encodingMap = {
            'iso88591': 'latin1',
            'utf8': 'utf-8',
            'utf8bom': 'utf-8-bom',
            'utf16be': 'utf-16-be',
            'utf16le': 'utf-16-le',
        };
        addSetting('charset', encodingMap[files.get('encoding')]);
        addSetting('trim_trailing_whitespace', files.get('trimTrailingWhitespace'));
        addSetting('insert_final_newline', files.get('insertFinalNewline'));
        fs.writeFile(editorConfigFile, settingsLines.join('\n'), err => {
            if (err) {
                vscode_1.window.showErrorMessage(err.message);
                return;
            }
        });
    }
}
exports.generateEditorConfig = generateEditorConfig;
//# sourceMappingURL=generateEditorConfig.js.map