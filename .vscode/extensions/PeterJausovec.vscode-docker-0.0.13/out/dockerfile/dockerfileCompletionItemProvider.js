/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const helper = require("../helpers/suggestSupportHelper");
// IntelliSense
class DockerfileCompletionItemProvider {
    constructor() {
        this.triggerCharacters = [];
        this.excludeTokens = [];
    }
    provideCompletionItems(document, position, token) {
        var dockerSuggestSupport = new helper.SuggestSupportHelper();
        var textLine = document.lineAt(position.line);
        // Matches strings like: 'FROM imagename'
        var fromTextDocker = textLine.text.match(/^\s*FROM\s*([^"]*)$/);
        if (fromTextDocker) {
            return dockerSuggestSupport.suggestImages(fromTextDocker[1]);
        }
        return Promise.resolve([]);
    }
}
exports.DockerfileCompletionItemProvider = DockerfileCompletionItemProvider;
//# sourceMappingURL=dockerfileCompletionItemProvider.js.map