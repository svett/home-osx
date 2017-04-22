'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.DeclarationSupport = undefined;

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

var DeclarationSupport = exports.DeclarationSupport = function () {
	function DeclarationSupport() {
		_classCallCheck(this, DeclarationSupport);
	}

	_createClass(DeclarationSupport, [{
		key: 'provideDefinition',
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(document, position, token) {
				var fileName, currentContents, wordAtPosition, line, col, definition, range, uri;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								fileName = document.uri.fsPath;
								currentContents = document.getText();
								wordAtPosition = document.getWordRangeAtPosition(position);

								if (!wordAtPosition) {
									_context.next = 13;
									break;
								}

								line = wordAtPosition.start.line + 1; // fix offsets

								col = wordAtPosition.start.character + 1; // fix offsets

								_context.next = 8;
								return (0, _FlowService.flowFindDefinition)(fileName, currentContents, line, col);

							case 8:
								definition = _context.sent;

								if (!definition) {
									_context.next = 13;
									break;
								}

								range = new vscode.Range(definition.point.line, definition.point.column, definition.point.line, definition.point.column);
								uri = vscode.Uri.file(definition.file);
								return _context.abrupt('return', new vscode.Location(uri, range));

							case 13:
								return _context.abrupt('return', null);

							case 14:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function provideDefinition(_x, _x2, _x3) {
				return _ref.apply(this, arguments);
			}

			return provideDefinition;
		}()
	}]);

	return DeclarationSupport;
}();
//# sourceMappingURL=flowDeclaration.js.map