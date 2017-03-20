'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var getDiagnostics = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(document) {
		var diags, filePath, rawDiag;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						diags = Object.create(null);

						if (document) {
							_context.next = 3;
							break;
						}

						return _context.abrupt('return', diags);

					case 3:
						filePath = document.uri.fsPath;

						if (!(path.extname(filePath) !== '.js' && path.extname(filePath) !== '.jsx')) {
							_context.next = 6;
							break;
						}

						return _context.abrupt('return', diags);

					case 6:
						_context.next = 8;
						return (0, _FlowService.flowFindDiagnostics)(filePath);

					case 8:
						rawDiag = _context.sent;

						if (rawDiag && rawDiag.messages) {
							(function () {
								var flowRoot = rawDiag.flowRoot;


								rawDiag.messages.forEach(function (message) {
									var level = message.level,
									    messageComponents = message.messageComponents;

									if (!messageComponents.length) return;

									var _messageComponents = _toArray(messageComponents),
									    baseMessage = _messageComponents[0],
									    other = _messageComponents.slice(1),
									    range = baseMessage.range;

									if (range == null) return;

									var file = path.resolve(flowRoot, range.file);

									var diag = {
										severity: level,
										startLine: range.start.line,
										startCol: range.start.column,
										endLine: range.end.line,
										endCol: range.end.column,
										msg: ''
									};

									var details = [];
									other.forEach(function (part) {
										var partMsg = part.descr;
										if (partMsg && partMsg !== 'null' && partMsg !== 'undefined') {
											details.push(partMsg);
										}
									});

									var msg = baseMessage.descr;
									if (details.length) {
										msg = msg + ' (' + details.join(' ') + ')';
									}

									diag.msg = '[flow] ' + msg;

									if (!diags[file]) {
										diags[file] = [];
									}

									diags[file].push(diag);
								});
							})();
						}

						return _context.abrupt('return', diags);

					case 11:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function getDiagnostics(_x) {
		return _ref.apply(this, arguments);
	};
}();

exports.setupDiagnostics = setupDiagnostics;

var _vscode = require('vscode');

var vscode = _interopRequireWildcard(_vscode);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _FlowService = require('./pkg/flow-base/lib/FlowService');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

var lastDiagnostics = null;

function setupDiagnostics(disposables) {

	// Do an initial call to get diagnostics from the active editor if any
	if (vscode.window.activeTextEditor) {
		updateDiagnostics(vscode.window.activeTextEditor.document);
	}

	// Update diagnostics: when active text editor changes
	disposables.push(vscode.window.onDidChangeActiveTextEditor(function (editor) {
		updateDiagnostics(editor && editor.document);
	}));

	// Update diagnostics when document is edited
	disposables.push(vscode.workspace.onDidSaveTextDocument(function (event) {
		if (vscode.window.activeTextEditor) {
			updateDiagnostics(vscode.window.activeTextEditor.document);
		}
	}));
}

function updateDiagnostics(document) {
	getDiagnostics(document).then(function (diag) {
		return applyDiagnostics(diag);
	}).catch(function (error) {
		return console.error(error.toString());
	});
}

function mapSeverity(sev) {
	switch (sev) {
		case "error":
			return vscode.DiagnosticSeverity.Error;
		case "warning":
			return vscode.DiagnosticSeverity.Warning;
		default:
			return vscode.DiagnosticSeverity.Error;
	}
}

function applyDiagnostics(diagnostics) {
	if (lastDiagnostics) {
		lastDiagnostics.dispose(); // clear old collection
	}

	// create new collection
	lastDiagnostics = vscode.languages.createDiagnosticCollection();

	var _loop = function _loop(file) {
		var errors = diagnostics[file];
		var targetResource = vscode.Uri.file(file);
		var diags = errors.map(function (error) {
			// don't allow non-0 lines
			var startLine = Math.max(0, error.startLine - 1);
			var endLine = Math.max(0, error.endLine - 1);
			var range = new vscode.Range(startLine, error.startCol - 1, endLine, error.endCol);
			var location = new vscode.Location(targetResource, range);

			var diag = new vscode.Diagnostic(range, error.msg, mapSeverity(error.severity));
			diag.source = 'flow';
			return diag;
		});

		lastDiagnostics.set(targetResource, diags);
	};

	for (var file in diagnostics) {
		_loop(file);
	}
}
//# sourceMappingURL=flowDiagnostics.js.map