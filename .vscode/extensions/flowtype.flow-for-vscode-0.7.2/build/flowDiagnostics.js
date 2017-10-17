'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var requestDiagnostics = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(context, document) {
    var uri, version, id, diagnostics;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            uri = document.uri, version = document.version;
            id = uri.toString();

            pendingDiagnostics.set(id, version);

            if (pendingDiagnostics.size > 0) {
              status.busy();
            }

            _context.prev = 4;
            _context.next = 7;
            return getDocumentDiagnostics(context, document);

          case 7:
            diagnostics = _context.sent;

            if (pendingDiagnostics.get(id) === version) {
              applyDiagnostics(diagnostics);
            }
            _context.next = 14;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](4);

            console.error(_context.t0);

          case 14:

            status.idle();
            coverage.update(document.uri);

            if (pendingDiagnostics.get(id) === version) {
              pendingDiagnostics.delete(id);
            }

            if (pendingDiagnostics.size === 0) {
              status.idle();
            }

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[4, 11]]);
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
    var pathToURI = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _util.toURI;
    var extensions, rawDiag, flowRoot, messages, diags;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            extensions = (0, _util.getFileExtensions)();

            if (!(extensions.indexOf(path.extname(filePath)) === -1)) {
              _context3.next = 3;
              break;
            }

            return _context3.abrupt('return', noDiagnostics);

          case 3:
            _context3.next = 5;
            return (0, _FlowService.flowFindDiagnostics)(filePath, content);

          case 5:
            rawDiag = _context3.sent;

            if (!(rawDiag && rawDiag.messages)) {
              _context3.next = 13;
              break;
            }

            flowRoot = rawDiag.flowRoot, messages = rawDiag.messages;
            diags = Object.create(null);


            messages.forEach(function (message) {
              var level = message.level,
                  messageComponents = message.messageComponents;

              if (!messageComponents.length) return;

              var _messageComponents = _toArray(messageComponents),
                  baseMessage = _messageComponents[0],
                  other = _messageComponents.slice(1),
                  range = baseMessage.range;

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
            return _context3.abrupt('return', diags);

          case 13:
            return _context3.abrupt('return', noDiagnostics);

          case 14:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getFileDiagnostics(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

var getDraftDocumentDiagnostics = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(context, document) {
    var content, tryPath, uri, pathToURI;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!supportedLanguages.has(document.languageId)) {
              _context4.next = 6;
              break;
            }

            content = document.getText();
            tryPath = (0, _util.getTryPath)(context);
            uri = document.uri;

            pathToURI = function pathToURI(path) {
              return uri;
            };

            return _context4.abrupt('return', getFileDiagnostics(tryPath, content, pathToURI));

          case 6:
            return _context4.abrupt('return', noDiagnostics);

          case 7:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function getDraftDocumentDiagnostics(_x8, _x9) {
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

  return function getDirtyDocumentDiagnostics(_x10, _x11) {
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

  return function getSavedDocumentDiagnostics(_x12, _x13) {
    return _ref6.apply(this, arguments);
  };
}();

exports.setupDiagnostics = setupDiagnostics;

var _vscode = require('vscode');

var vscode = _interopRequireWildcard(_vscode);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _FlowService = require('./pkg/flow-base/lib/FlowService');

var _flowStatus = require('./flowStatus');

var _flowCoverage = require('./flowCoverage');

var _util = require('./utils/util');

var _lodash = require('lodash.debounce');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * Copyright (c) 2015-present, Facebook, Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * This source code is licensed under the license found in the LICENSE file in
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * the root directory of this source tree.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            */

var ON_CHANGE_TEXT_TIMEOUT = 500;
var status = new _flowStatus.Status();
var coverage = new _flowCoverage.Coverage();
var lastDiagnostics = null;

function setupDiagnostics(context) {
  var subscriptions = context.subscriptions;

  var debouncedUpdateDiagnostics = (0, _lodash2.default)(updateDiagnostics, ON_CHANGE_TEXT_TIMEOUT);

  // Do an initial call to get diagnostics from the active editor if any
  if (vscode.window.activeTextEditor && (0, _util.hasFlowPragma)(vscode.window.activeTextEditor.document.getText())) {
    debouncedUpdateDiagnostics(context, vscode.window.activeTextEditor.document);
  }

  // Update diagnostics when active text editor changes
  subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function (editor) {
    if (editor && (0, _util.hasFlowPragma)(editor.document.getText())) {
      debouncedUpdateDiagnostics(context, editor.document);
    }
  }));

  // Update diagnostics when document is saved
  subscriptions.push(vscode.workspace.onDidSaveTextDocument(function (event) {
    if (vscode.window.activeTextEditor && (0, _util.hasFlowPragma)(vscode.window.activeTextEditor.document.getText())) {
      debouncedUpdateDiagnostics(context, vscode.window.activeTextEditor.document);
    }
  }));

  // Update diagnostics when document is edited
  subscriptions.push(vscode.workspace.onDidChangeTextDocument(function (event) {
    var isDocumentActive = vscode.window.activeTextEditor.document.fileName === event.document.fileName;

    if (isDocumentActive && (0, _util.isRunOnEditEnabled)() && (0, _util.hasFlowPragma)(event.document.getText())) {
      debouncedUpdateDiagnostics(context, event.document);
    }
  }));
}

var pendingDiagnostics = new Map();

function updateDiagnostics(context, document) {
  var uri = document.uri,
      version = document.version;

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

var supportedLanguages = new Set(['javascript', 'javascriptreact']);

function mapSeverity(sev) {
  switch (sev) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warning':
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
    var _diagnostics$file = diagnostics[file],
        uri = _diagnostics$file.uri,
        reports = _diagnostics$file.reports;

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