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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.isGkEnabled = isGkEnabled;
exports.onceGkInitialized = onceGkInitialized;

var _once = require('./once');

var _once2 = _interopRequireDefault(_once);

var _eventKit = require('event-kit');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Get the actual Gatekeeper constructor or stub the relevant methods for OSS
 * friendliness.
 */
var getGatekeeper = (0, _once2.default)(function () {
  var Gatekeeper = void 0;
  try {
    // $FlowFB
    Gatekeeper = require('./fb-gatekeeper').Gatekeeper;
  } catch (e) {
    Gatekeeper = function () {
      function Gatekeeper() {
        _classCallCheck(this, Gatekeeper);
      }

      _createClass(Gatekeeper, [{
        key: 'isGkEnabled',
        value: function isGkEnabled() {
          return null;
        }
      }, {
        key: 'asyncIsGkEnabled',
        value: function () {
          var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    return _context.abrupt('return', null);

                  case 1:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          function asyncIsGkEnabled() {
            return _ref.apply(this, arguments);
          }

          return asyncIsGkEnabled;
        }()
      }, {
        key: 'onceGkInitialized',
        value: function onceGkInitialized(callback) {
          process.nextTick(function () {
            callback();
          });
          return new _eventKit.Disposable();
        }
      }]);

      return Gatekeeper;
    }();
  }
  return new Gatekeeper();
});

/**
 * Check a GK. Silently return false on error.
 */

exports.default = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(name, timeout) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return getGatekeeper().asyncIsGkEnabled(name, timeout);

          case 3:
            _context2.t0 = _context2.sent;
            return _context2.abrupt('return', _context2.t0 === true);

          case 7:
            _context2.prev = 7;
            _context2.t1 = _context2['catch'](0);
            return _context2.abrupt('return', false);

          case 10:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 7]]);
  }));

  function passesGK(_x, _x2) {
    return _ref2.apply(this, arguments);
  }

  return passesGK;
}();

/**
 * Synchronous GK check. There is no guarantee that GKs have loaded. This
 * should be used inside a `onceGkInitialized`.
 */


function isGkEnabled(name) {
  return getGatekeeper().isGkEnabled(name);
}

function onceGkInitialized(callback, timeout) {
  return getGatekeeper().onceGkInitialized(callback, timeout);
}
//# sourceMappingURL=passesGK.js.map