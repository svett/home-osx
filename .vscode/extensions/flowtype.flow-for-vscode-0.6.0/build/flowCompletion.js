'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.CompletionSupport = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

var _vscode = require('vscode');

var vscode = _interopRequireWildcard(_vscode);

var _FlowService = require('./pkg/flow-base/lib/FlowService');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CompletionSupport = exports.CompletionSupport = function () {
	function CompletionSupport() {
		_classCallCheck(this, CompletionSupport);
	}

	_createClass(CompletionSupport, [{
		key: 'provideCompletionItems',
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(document, position, token) {
				var _this = this;

				var fileName, currentContents, line, col, prefix, completions;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								fileName = document.uri.fsPath;
								currentContents = document.getText();
								line = position.line;
								col = position.character;
								prefix = '.'; // TODO do better.

								_context.next = 7;
								return (0, _FlowService.flowGetAutocompleteSuggestions)(fileName, currentContents, line, col, prefix, true);

							case 7:
								completions = _context.sent;

								if (!completions) {
									_context.next = 10;
									break;
								}

								return _context.abrupt('return', completions.map(function (atomCompletion) {
									var completion = new vscode.CompletionItem(atomCompletion.displayText);
									if (atomCompletion.description) {
										completion.detail = atomCompletion.description;
									}
									completion.kind = _this.typeToKind(atomCompletion.type, atomCompletion.description);

									if (completion.kind === vscode.CompletionItemKind.Function) {
										completion.insertText = new vscode.SnippetString(atomCompletion.snippet);
									}

									return completion;
								}));

							case 10:
								return _context.abrupt('return', []);

							case 11:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function provideCompletionItems(_x, _x2, _x3) {
				return _ref.apply(this, arguments);
			}

			return provideCompletionItems;
		}()
	}, {
		key: 'typeToKind',
		value: function typeToKind(type, description) {
			// Possible Kinds in VS Code:
			// Method,
			// Function,
			// Constructor,
			// Field,
			// Variable,
			// Class,
			// Interface,
			// Module,
			// Property
			if (type === 'function') {
				return vscode.CompletionItemKind.Function;
			}

			if (description && description.indexOf('[class: ') >= 0) {
				return vscode.CompletionItemKind.Class;
			}

			return vscode.CompletionItemKind.Variable;
		}
	}]);

	return CompletionSupport;
}();
//# sourceMappingURL=flowCompletion.js.map