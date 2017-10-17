'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Coverage = undefined;

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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var lastDiagnostics = null;

var Coverage = exports.Coverage = function () {
  _createClass(Coverage, null, [{
    key: 'createStatusBarItem',
    value: function createStatusBarItem() {
      var coverageStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      coverageStatus.tooltip = 'Flow type coverage. Click to toggle uncovered code';
      coverageStatus.command = 'flow.show-coverage';
      return coverageStatus;
    }
  }]);

  function Coverage() {
    var _this = this;

    _classCallCheck(this, Coverage);

    this.coverageStatus = Coverage.createStatusBarItem();
    this.state = { showUncovered: false, uri: null };

    vscode.commands.registerCommand('flow.show-coverage', function () {
      _this.setState({ showUncovered: !_this.state.showUncovered });
    });
  }

  _createClass(Coverage, [{
    key: 'setState',
    value: function setState(newState) {
      this.state = Object.assign({}, this.state, newState);
      this.render();
    }
  }, {
    key: 'update',
    value: function update(uri) {
      this.setState({ uri: uri });
    }
  }, {
    key: 'applyDiagnostics',
    value: function applyDiagnostics(coverageReport, uri) {
      if (lastDiagnostics) {
        lastDiagnostics.dispose();
      }

      lastDiagnostics = vscode.languages.createDiagnosticCollection();

      var uncoveredRanges = coverageReport.uncoveredRanges;


      var diags = uncoveredRanges.map(function (item) {
        var range = new vscode.Range(item.start.line, item.start.column, item.end.line, item.end.column);

        var diag = new vscode.Diagnostic(range, 'uncovered code', vscode.DiagnosticSeverity.Information);
        diag.source = 'flow coverage';
        return diag;
      });

      if (this.state.showUncovered) {
        lastDiagnostics.set(uri, diags);
      }
    }
  }, {
    key: 'render',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var uri, coverageReport, percentage;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                uri = this.state.uri;

                if (uri) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return', null);

              case 3:
                this.coverageStatus.show();

                _context.prev = 4;
                _context.next = 7;
                return (0, _FlowService.flowGetCoverage)(uri.fsPath);

              case 7:
                coverageReport = _context.sent;

                if (coverageReport) {
                  percentage = typeof coverageReport.percentage === 'number' && coverageReport.percentage.toFixed(1);

                  this.coverageStatus.text = 'Flow: ' + percentage.toString() + '%';
                  this.applyDiagnostics(coverageReport, uri);
                }
                _context.next = 14;
                break;

              case 11:
                _context.prev = 11;
                _context.t0 = _context['catch'](4);

                this.coverageStatus.text = '';

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 11]]);
      }));

      function render() {
        return _ref.apply(this, arguments);
      }

      return render;
    }()
  }]);

  return Coverage;
}();

exports.default = Coverage;
//# sourceMappingURL=flowCoverage.js.map