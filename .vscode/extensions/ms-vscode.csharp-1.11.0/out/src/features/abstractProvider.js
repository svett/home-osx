/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractProvider {
    constructor(server) {
        this._server = server;
        this._disposables = [];
    }
    dispose() {
        while (this._disposables.length) {
            this._disposables.pop().dispose();
        }
    }
}
exports.default = AbstractProvider;
//# sourceMappingURL=abstractProvider.js.map