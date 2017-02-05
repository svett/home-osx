"use strict";
const os_1 = require('os');
const vscode = require('vscode');
function extractSignatureAndDocumentation(definition, highlightCode = false) {
    // Somtimes the signature of the function, class (whatever) is broken into multiple lines
    // Here's an example
    // ```python
    // def __init__(self, group=None, target=None, name=None,
    //              args=(), kwargs=None, verbose=None):
    //     """This constructor should always be called with keyword arguments. Arguments are:
    //     *group* should be None; reserved for future extension when a ThreadGroup
    //     class is implemented.
    ///    """
    /// ```
    const txt = definition.description || definition.text;
    const rawDocString = typeof definition.raw_docstring === 'string' ? definition.raw_docstring.trim() : '';
    const firstLineOfRawDocString = rawDocString.length > 0 ? rawDocString.split(os_1.EOL)[0] : '';
    let lines = txt.split(os_1.EOL);
    const startIndexOfDocString = firstLineOfRawDocString === '' ? -1 : lines.findIndex(line => line.indexOf(firstLineOfRawDocString) === 0);
    let signatureLines = startIndexOfDocString === -1 ? [lines.shift()] : lines.splice(0, startIndexOfDocString);
    let signature = signatureLines.filter(line => line.trim().length > 0).join(os_1.EOL);
    switch (definition.type) {
        case vscode.CompletionItemKind.Constructor:
        case vscode.CompletionItemKind.Function:
        case vscode.CompletionItemKind.Method: {
            signature = 'def ' + signature;
            break;
        }
        case vscode.CompletionItemKind.Class: {
            signature = 'class ' + signature;
            break;
        }
    }
    // check if we have any sample code in the documentation
    if (highlightCode) {
        lines = lines.map(line => {
            if (line.trim().startsWith('>>> ')) {
                return '```python\n' + line.substring(4).trim() + '\n```';
            }
            return line;
        });
    }
    return [signature, lines.join(os_1.EOL).trim().replace(/^\s+|\s+$/g, '').trim()];
}
exports.extractSignatureAndDocumentation = extractSignatureAndDocumentation;
function highlightCode(documentation) {
    let lines = documentation.split(os_1.EOL);
    lines = lines.map(line => {
        if (line.trim().startsWith('>>> ')) {
            return '```python\n' + line.substring(4).trim() + '\n```';
        }
        return line;
    });
    return lines.join(os_1.EOL).trim().replace(/^\s+|\s+$/g, '').trim();
}
exports.highlightCode = highlightCode;
//# sourceMappingURL=jediHelpers.js.map