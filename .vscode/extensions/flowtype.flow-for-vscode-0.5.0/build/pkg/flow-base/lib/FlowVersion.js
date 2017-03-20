'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FlowVersion = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _FlowConstants = require('./FlowConstants');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Queries Flow for its version and caches the results. The version is a best guess: it is not 100%
 * guaranteed to be reliable due to caching, but will nearly always be correct.
 */
var FlowVersion = exports.FlowVersion = function () {
  function FlowVersion(versionFn) {
    _classCallCheck(this, FlowVersion);

    this._versionFn = versionFn;
    this._lastVersion = null;
  }

  _createClass(FlowVersion, [{
    key: 'invalidateVersion',
    value: function invalidateVersion() {
      this._lastVersion = null;
    }
  }, {
    key: 'getVersion',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var lastVersion, msSinceReceived;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                lastVersion = this._lastVersion;

                if (!(lastVersion == null)) {
                  _context.next = 5;
                  break;
                }

                _context.next = 4;
                return this._queryAndSetVersion();

              case 4:
                return _context.abrupt('return', _context.sent);

              case 5:
                msSinceReceived = Date.now() - lastVersion.receivedTime;

                if (!(msSinceReceived >= _FlowConstants.VERSION_TIMEOUT_MS)) {
                  _context.next = 10;
                  break;
                }

                _context.next = 9;
                return this._queryAndSetVersion();

              case 9:
                return _context.abrupt('return', _context.sent);

              case 10:
                return _context.abrupt('return', lastVersion.version);

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getVersion() {
        return _ref.apply(this, arguments);
      }

      return getVersion;
    }()
  }, {
    key: '_queryAndSetVersion',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var version;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._versionFn();

              case 2:
                version = _context2.sent;

                this._lastVersion = {
                  version: version,
                  receivedTime: Date.now()
                };
                return _context2.abrupt('return', version);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _queryAndSetVersion() {
        return _ref2.apply(this, arguments);
      }

      return _queryAndSetVersion;
    }()
  }]);

  return FlowVersion;
}();
//# sourceMappingURL=FlowVersion.js.map