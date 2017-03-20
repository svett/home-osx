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
exports.__test__ = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _process = require('./process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_JOIN_TIMEOUT = 5000;
var SCRIBE_CAT_COMMAND = 'scribe_cat';

/**
 * A wrapper of `scribe_cat` (https://github.com/facebookarchive/scribe/blob/master/examples/scribe_cat)
 * command. User could call `new ScribeProcess($scribeCategoryName)` to create a process and then
 * call `scribeProcess.write($object)` to save an JSON schemaed Object into scribe category.
 * It will also recover from `scribe_cat` failure automatically.
 */

var ScribeProcess = function () {
  function ScribeProcess(scribeCategory) {
    _classCallCheck(this, ScribeProcess);

    this._scribeCategory = scribeCategory;
    this._childProcessRunning = new WeakMap();
    this._getOrCreateChildProcess();
  }

  /**
   * Check if `scribe_cat` exists in PATH.
   */


  _createClass(ScribeProcess, [{
    key: 'write',


    /**
     * Write a string to a Scribe category.
     * Ensure newlines are properly escaped.
     */
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(message) {
        var child;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._getOrCreateChildProcess();

              case 2:
                child = _context.sent;
                return _context.abrupt('return', new Promise(function (resolve, reject) {
                  child.stdin.write('' + message + _os2.default.EOL, resolve);
                }));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function write(_x) {
        return _ref.apply(this, arguments);
      }

      return write;
    }()
  }, {
    key: 'dispose',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var child;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this._childPromise) {
                  _context2.next = 5;
                  break;
                }

                _context2.next = 3;
                return this._childPromise;

              case 3:
                child = _context2.sent;

                if (this._childProcessRunning.get(child)) {
                  child.kill();
                }

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function dispose() {
        return _ref2.apply(this, arguments);
      }

      return dispose;
    }()
  }, {
    key: 'join',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var _this = this;

        var timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_JOIN_TIMEOUT;

        var _ret;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!this._childPromise) {
                  _context4.next = 5;
                  break;
                }

                return _context4.delegateYield(regeneratorRuntime.mark(function _callee3() {
                  var child;
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          _context3.next = 2;
                          return _this._childPromise;

                        case 2:
                          child = _context3.sent;

                          child.stdin.end();
                          return _context3.abrupt('return', {
                            v: new Promise(function (resolve) {
                              child.on('exit', function () {
                                return resolve();
                              });
                              setTimeout(resolve, timeout);
                            })
                          });

                        case 5:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this);
                })(), 't0', 2);

              case 2:
                _ret = _context4.t0;

                if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
                  _context4.next = 5;
                  break;
                }

                return _context4.abrupt('return', _ret.v);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function join(_x2) {
        return _ref3.apply(this, arguments);
      }

      return join;
    }()
  }, {
    key: '_getOrCreateChildProcess',
    value: function _getOrCreateChildProcess() {
      var _this2 = this;

      if (this._childPromise) {
        return this._childPromise;
      }

      this._childPromise = (0, _process.safeSpawn)(SCRIBE_CAT_COMMAND, [this._scribeCategory]).then(function (child) {
        child.stdin.setDefaultEncoding('utf8');
        _this2._childProcessRunning.set(child, true);
        child.on('error', function (error) {
          _this2._childPromise = null;
          _this2._childProcessRunning.set(child, false);
        });
        child.on('exit', function (e) {
          _this2._childPromise = null;
          _this2._childProcessRunning.set(child, false);
        });
        return child;
      });

      return this._childPromise;
    }
  }], [{
    key: 'isScribeCatOnPath',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
        var _ref5, exitCode;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return (0, _process.asyncExecute)('which', [SCRIBE_CAT_COMMAND]);

              case 2:
                _ref5 = _context5.sent;
                exitCode = _ref5.exitCode;
                return _context5.abrupt('return', exitCode === 0);

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function isScribeCatOnPath() {
        return _ref4.apply(this, arguments);
      }

      return isScribeCatOnPath;
    }()
  }]);

  return ScribeProcess;
}();

exports.default = ScribeProcess;
var __test__ = exports.__test__ = {
  setScribeCatCommand: function setScribeCatCommand(newCommand) {
    var originalCommand = SCRIBE_CAT_COMMAND;
    SCRIBE_CAT_COMMAND = newCommand;
    return originalCommand;
  }
};
//# sourceMappingURL=ScribeProcess.js.map