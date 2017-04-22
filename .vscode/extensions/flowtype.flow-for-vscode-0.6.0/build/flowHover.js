'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.HoverSupport = undefined;

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

var _jsBeautify = require('js-beautify');

var _FlowService = require('./pkg/flow-base/lib/FlowService');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HoverSupport = exports.HoverSupport = function () {
	function HoverSupport() {
		_classCallCheck(this, HoverSupport);
	}

	_createClass(HoverSupport, [{
		key: 'provideHover',
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(document, position) {
				var fileName, wordPosition, word, currentContents, line, col, completions, beautifiedData;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								fileName = document.uri.fsPath;
								wordPosition = document.getWordRangeAtPosition(position);

								if (wordPosition) {
									_context.next = 4;
									break;
								}

								return _context.abrupt('return');

							case 4:
								word = document.getText(wordPosition);
								currentContents = document.getText();
								line = position.line;
								col = position.character;
								_context.next = 10;
								return (0, _FlowService.flowGetType)(fileName, currentContents, line, col, false);

							case 10:
								completions = _context.sent;

								if (!completions) {
									_context.next = 14;
									break;
								}

								beautifiedData = (0, _jsBeautify.js_beautify)(completions.type, { indent_size: 4 });
								return _context.abrupt('return', new vscode.Hover(['[Flow]', { language: 'javascript', value: word + ': ' + beautifiedData }]));

							case 14:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function provideHover(_x, _x2) {
				return _ref.apply(this, arguments);
			}

			return provideHover;
		}()
	}]);

	return HoverSupport;
}();
//# sourceMappingURL=flowHover.js.map