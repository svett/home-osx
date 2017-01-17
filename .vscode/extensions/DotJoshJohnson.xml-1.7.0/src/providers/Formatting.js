'use strict';
const vsc = require('vscode');
const RangeUtil_1 = require('../utils/RangeUtil');
const XmlFormatter_1 = require('../services/XmlFormatter');
const CFG_SECTION = 'xmlTools';
const CFG_SPLIT_NAMESPACES = 'splitXmlnsOnFormat';
class XmlFormattingEditProvider {
    provideDocumentFormattingEdits(document, options) {
        let range = RangeUtil_1.RangeUtil.getRangeForDocument(document);
        return this._provideFormattingEdits(document, range, options);
    }
    provideDocumentRangeFormattingEdits(document, range, options) {
        return this._provideFormattingEdits(document, range, options);
    }
    _provideFormattingEdits(document, range, options) {
        let splitNamespaces = vsc.workspace.getConfiguration(CFG_SECTION).get(CFG_SPLIT_NAMESPACES, true);
        let formatterOptions = {
            preferSpaces: options.insertSpaces,
            tabSize: options.tabSize,
            splitNamespaces: splitNamespaces
        };
        let formatter = new XmlFormatter_1.XmlFormatter(formatterOptions);
        let xml = formatter.format(document.getText(range));
        return [vsc.TextEdit.replace(range, xml)];
    }
}
exports.XmlFormattingEditProvider = XmlFormattingEditProvider;
