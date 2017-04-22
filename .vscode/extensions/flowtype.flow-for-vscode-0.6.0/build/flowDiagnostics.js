'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var requestDiagnostics = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(context, document) {
		var uri, version, id, diagnostics;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						uri = document.uri;
						version = document.version;
						id = uri.toString();

						pendingDiagnostics.set(id, version);
						if (pendingDiagnostics.size > 0) {
							status.busy();
						}
						_context.prev = 5;
						_context.next = 8;
						return getDocumentDiagnostics(context, document);

					case 8:
						diagnostics = _context.sent;

						if (pendingDiagnostics.get(id) === version) {
							applyDiagnostics(diagnostics);
						}
						_context.next = 15;
						break;

					case 12:
						_context.prev = 12;
						_context.t0 = _context['catch'](5);

						console.error(_context.t0);

					case 15:

						status.idle();
						coverage.update(document.uri);

						if (pendingDiagnostics.get(id) === version) {
							pendingDiagnostics.delete(id);
						}

						if (pendingDiagnostics.size === 0) {
							status.idle();
						}

					case 19:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, this, [[5, 12]]);
	}));

	return function requestDiagnostics(_x, _x2) {
		return _ref.apply(this, arguments);
	};
}();

var getDocumentDiagnostics = function () {
	var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(context, document) {
		return regeneratorRuntime.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						if (!document.isUntitled) {
							_context2.next = 4;
							break;
						}

						return _context2.abrupt('return', getDraftDocumentDiagnostics(context, document));

					case 4:
						if (!document.isDirty) {
							_context2.next = 8;
							break;
						}

						return _context2.abrupt('return', getDirtyDocumentDiagnostics(context, document));

					case 8:
						return _context2.abrupt('return', getSavedDocumentDiagnostics(context, document));

					case 9:
					case 'end':
						return _context2.stop();
				}
			}
		}, _callee2, this);
	}));

	return function getDocumentDiagnostics(_x3, _x4) {
		return _ref2.apply(this, arguments);
	};
}();

var getFileDiagnostics = function () {
	var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(filePath, content) {
		var pathToURI = arguments.length <= 2 || arguments[2] === undefined ? _util.toURI : arguments[2];

		var rawDiag, _ret;

		return regeneratorRuntime.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						if (!(path.extname(filePath) !== '.js' && path.extname(filePath) !== '.jsx')) {
							_context3.next = 2;
							break;
						}

						return _context3.abrupt('return', noDiagnostics);

					case 2:
						_context3.next = 4;
						return (0, _FlowService.flowFindDiagnostics)(filePath, content);

					case 4:
						rawDiag = _context3.sent;

						if (!(rawDiag && rawDiag.messages)) {
							_context3.next = 11;
							break;
						}

						_ret = function () {
							var flowRoot = rawDiag.flowRoot;
							var messages = rawDiag.messages;

							var diags = Object.create(null);

							messages.forEach(function (message) {
								var level = message.level;
								var messageComponents = message.messageComponents;

								if (!messageComponents.length) return;

								var _messageComponents = _toArray(messageComponents);

								var baseMessage = _messageComponents[0];

								var other = _messageComponents.slice(1);
								var range = baseMessage.range;

								if (range == null) return;

								var file = path.resolve(flowRoot, range.file);
								var uri = pathToURI(file);

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

								diag.msg = msg;

								if (!diags[file]) {
									diags[file] = { uri: uri, reports: [] };
								}

								diags[file].reports.push(diag);
							});
							return {
								v: diags
							};
						}();

						if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
							_context3.next = 9;
							break;
						}

						return _context3.abrupt('return', _ret.v);

					case 9:
						_context3.next = 12;
						break;

					case 11:
						return _context3.abrupt('return', noDiagnostics);

					case 12:
					case 'end':
						return _context3.stop();
				}
			}
		}, _callee3, this);
	}));

	return function getFileDiagnostics(_x5, _x6, _x7) {
		return _ref3.apply(this, arguments);
	};
}();

var getDraftDocumentDiagnostics = function () {
	var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(context, document) {
		var content, _ret2;

		return regeneratorRuntime.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						if (!supportedLanguages.has(document.languageId)) {
							_context4.next = 6;
							break;
						}

						content = document.getText();

						if (!(0, _util.hasFlowPragma)(content)) {
							_context4.next = 6;
							break;
						}

						_ret2 = function () {
							var tryPath = (0, _util.getTryPath)(context);
							var uri = document.uri;
							var pathToURI = function pathToURI(path) {
								return path == tryPath ? uri : uri;
							};

							return {
								v: getFileDiagnostics(tryPath, content, pathToURI)
							};
						}();

						if (!((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object")) {
							_context4.next = 6;
							break;
						}

						return _context4.abrupt('return', _ret2.v);

					case 6:
						return _context4.abrupt('return', noDiagnostics);

					case 7:
					case 'end':
						return _context4.stop();
				}
			}
		}, _callee4, this);
	}));

	return function getDraftDocumentDiagnostics(_x9, _x10) {
		return _ref4.apply(this, arguments);
	};
}();

var getDirtyDocumentDiagnostics = function () {
	var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(context, document) {
		return regeneratorRuntime.wrap(function _callee5$(_context5) {
			while (1) {
				switch (_context5.prev = _context5.next) {
					case 0:
						return _context5.abrupt('return', getFileDiagnostics(document.uri.fsPath, document.getText()));

					case 1:
					case 'end':
						return _context5.stop();
				}
			}
		}, _callee5, this);
	}));

	return function getDirtyDocumentDiagnostics(_x11, _x12) {
		return _ref5.apply(this, arguments);
	};
}();

var getSavedDocumentDiagnostics = function () {
	var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(context, document) {
		return regeneratorRuntime.wrap(function _callee6$(_context6) {
			while (1) {
				switch (_context6.prev = _context6.next) {
					case 0:
						return _context6.abrupt('return', getFileDiagnostics(document.uri.fsPath, null));

					case 1:
					case 'end':
						return _context6.stop();
				}
			}
		}, _callee6, this);
	}));

	return function getSavedDocumentDiagnostics(_x13, _x14) {
		return _ref6.apply(this, arguments);
	};
}();

exports.setupDiagnostics = setupDiagnostics;

var _vscode = require('vscode');

var vscode = _interopRequireWildcard(_vscode);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _flowStatus = require('./flowStatus');

var _flowCoverage = require('./flowCoverage');

var _FlowService = require('./pkg/flow-base/lib/FlowService');

var _util = require('./utils/util');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

var lastDiagnostics = null;
var status = new _flowStatus.Status();
var coverage = new _flowCoverage.Coverage();

function setupDiagnostics(context) {
	var subscriptions = context.subscriptions;
	// Do an initial call to get diagnostics from the active editor if any

	if (vscode.window.activeTextEditor) {
		updateDiagnostics(context, vscode.window.activeTextEditor.document);
	}

	// Update diagnostics: when active text editor changes
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function (editor) {
		if (editor) {
			updateDiagnostics(context, editor.document);
		}
	}));

	// Update diagnostics when document is edited
	subscriptions.push(vscode.workspace.onDidSaveTextDocument(function (event) {
		if (vscode.window.activeTextEditor) {
			updateDiagnostics(context, vscode.window.activeTextEditor.document);
		}
	}));

	subscriptions.push(vscode.workspace.onDidChangeTextDocument(function (event) {
		var isDocumentActive = vscode.window.activeTextEditor.document === event.document;
		if (isDocumentActive && (0, _util.isRunOnEditEnabled)()) {
			updateDiagnostics(context, event.document);
		}
	}));
}

var pendingDiagnostics = new Map();

function updateDiagnostics(context, document) {
	var uri = document.uri;
	var version = document.version;

	var id = uri.toString();
	var pendingVersion = pendingDiagnostics.get(id);
	if (pendingVersion == null) {
		requestDiagnostics(context, document);
	} else if (pendingVersion !== version) {
		abortDiagnostics(id);
		requestDiagnostics(context, document);
	}
}

function abortDiagnostics(id) {
	if (pendingDiagnostics.has(id)) {
		pendingDiagnostics.delete(id);
	}

	if (pendingDiagnostics.size === 0) {
		status.idle();
	}
}

var noDiagnostics = Object.create(null);

var supportedLanguages = new Set(["javascript", "javascriptreact"]);

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
		var _diagnostics$file = diagnostics[file];
		var uri = _diagnostics$file.uri;
		var reports = _diagnostics$file.reports;

		var diags = reports.map(function (error) {
			// don't allow non-0 lines
			var startLine = Math.max(0, error.startLine - 1);
			var endLine = Math.max(0, error.endLine - 1);
			var range = new vscode.Range(startLine, error.startCol - 1, endLine, error.endCol);
			var location = new vscode.Location(uri, range);

			var diag = new vscode.Diagnostic(range, error.msg, mapSeverity(error.severity));
			diag.source = 'flow';
			return diag;
		});

		lastDiagnostics.set(uri, diags);
	};

	for (var file in diagnostics) {
		_loop(file);
	}
}
//# sourceMappingURL=flowDiagnostics.js.map