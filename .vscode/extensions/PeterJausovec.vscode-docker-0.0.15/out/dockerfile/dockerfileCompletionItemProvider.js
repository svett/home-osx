/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const helper = require("../helpers/suggestSupportHelper");
const dockerExtension_1 = require("../dockerExtension");
// IntelliSense
class DockerfileCompletionItemProvider {
    constructor() {
        this.triggerCharacters = [];
        this.excludeTokens = [];
    }
    provideCompletionItems(document, position, token) {
        var dockerSuggestSupport = new helper.SuggestSupportHelper();
        var textLine = document.lineAt(position.line);
        var fromTextDocker = textLine.text.match(dockerExtension_1.FROM_DIRECTIVE_PATTERN);
        if (fromTextDocker) {
            return dockerSuggestSupport.suggestImages(fromTextDocker[1]);
        }
        return Promise.resolve([]);
    }
}
exports.DockerfileCompletionItemProvider = DockerfileCompletionItemProvider;
//# sourceMappingURL=dockerfileCompletionItemProvider.js.map