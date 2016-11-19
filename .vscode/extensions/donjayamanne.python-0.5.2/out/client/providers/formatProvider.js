'use strict';
const yapfFormatter_1 = require('./../formatters/yapfFormatter');
const autoPep8Formatter_1 = require('./../formatters/autoPep8Formatter');
const telemetryHelper = require('../common/telemetry');
const telemetryContracts = require('../common/telemetryContracts');
class PythonFormattingEditProvider {
    constructor(context, outputChannel, settings, workspaceRootPath) {
        this.settings = settings;
        this.formatters = new Map();
        let yapfFormatter = new yapfFormatter_1.YapfFormatter(outputChannel, settings, workspaceRootPath);
        let autoPep8 = new autoPep8Formatter_1.AutoPep8Formatter(outputChannel, settings, workspaceRootPath);
        this.formatters.set(yapfFormatter.Id, yapfFormatter);
        this.formatters.set(autoPep8.Id, autoPep8);
    }
    provideDocumentFormattingEdits(document, options, token) {
        return this.provideDocumentRangeFormattingEdits(document, null, options, token);
    }
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        let formatter = this.formatters.get(this.settings.formatting.provider);
        let delays = new telemetryHelper.Delays();
        return formatter.formatDocument(document, options, token, range).then(edits => {
            delays.stop();
            telemetryHelper.sendTelemetryEvent(telemetryContracts.IDE.Format, { Format_Provider: formatter.Id }, delays.toMeasures());
            return edits;
        });
    }
}
exports.PythonFormattingEditProvider = PythonFormattingEditProvider;
//# sourceMappingURL=formatProvider.js.map