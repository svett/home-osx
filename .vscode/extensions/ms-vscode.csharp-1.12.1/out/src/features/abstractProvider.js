/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractProvider {
    constructor(server, reporter) {
        this._server = server;
        this._reporter = reporter;
        this._disposables = [];
    }
    addDisposables(...disposables) {
        this._disposables.push(...disposables);
    }
    dispose() {
        while (this._disposables.length) {
            this._disposables.pop().dispose();
        }
    }
}
exports.default = AbstractProvider;
//# sourceMappingURL=abstractProvider.js.map