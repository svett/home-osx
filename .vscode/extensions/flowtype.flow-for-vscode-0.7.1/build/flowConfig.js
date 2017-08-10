'use strict';

var _vscode = require('vscode');

var vscode = _interopRequireWildcard(_vscode);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function configure() {
	vscode.languages.setLanguageConfiguration('flow', {
		indentationRules: {
			decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
			increaseIndentPattern: /^.*\{[^}"']*$/
		},
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
		comments: {
			lineComment: '//',
			blockComment: ['/*', '*/']
		},
		brackets: [['{', '}'], ['[', ']'], ['(', ')']],
		__electricCharacterSupport: {
			brackets: [{ tokenType: 'delimiter.curly.ts', open: '{', close: '}', isElectric: true }, { tokenType: 'delimiter.square.ts', open: '[', close: ']', isElectric: true }, { tokenType: 'delimiter.paren.ts', open: '(', close: ')', isElectric: true }]
		},
		__characterPairSupport: {
			autoClosingPairs: [{ open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' }, { open: '"', close: '"', notIn: ['string'] }, { open: '\'', close: '\'', notIn: ['string', 'comment'] }]
		}
	});
}

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

exports.configure = configure;
//# sourceMappingURL=flowConfig.js.map