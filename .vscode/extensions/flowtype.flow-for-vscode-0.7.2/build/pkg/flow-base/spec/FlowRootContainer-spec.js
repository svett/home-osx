'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _nuclideTestHelpers = require('../../nuclide-test-helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('FlowRootContainer', function () {

  var flowRootContainer = null;
  beforeEach(function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      var _ref2, FlowRootContainer;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              spyOn(require('../lib/FlowHelpers'), 'findFlowConfigDir').andReturn(Promise.resolve('/definitely/a/legit/path/'));

              _ref2 = (0, _nuclideTestHelpers.uncachedRequire)(require, '../lib/FlowRootContainer');
              FlowRootContainer = _ref2.FlowRootContainer;

              flowRootContainer = new FlowRootContainer();

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    })));
  });

  it('should return a new root', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
      var root;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return flowRootContainer.getRootForPath('foo');

            case 2:
              root = _context2.sent;

              expect(root).not.toBeNull();

            case 4:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined);
    })));
  });

  it('should run a command with the proper root', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
      var result;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return flowRootContainer.runWithRoot('foo', function () {
                var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(flowRoot) {
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          expect(flowRoot).not.toBeNull();
                          return _context3.abrupt('return', 42);

                        case 2:
                        case 'end':
                          return _context3.stop();
                      }
                    }
                  }, _callee3, undefined);
                }));

                return function (_x) {
                  return _ref5.apply(this, arguments);
                };
              }());

            case 2:
              result = _context4.sent;

              expect(result).toBe(42);

            case 4:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    })));
  });

  it('should return all roots', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
      var flowRoot;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              expect(Array.from(flowRootContainer.getAllRoots())).toEqual([]);
              _context5.next = 3;
              return flowRootContainer.getRootForPath('foo');

            case 3:
              flowRoot = _context5.sent;

              expect(Array.from(flowRootContainer.getAllRoots())).toEqual([flowRoot]);

            case 5:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined);
    })));
  });

  it('should return server status updates', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
      var resultsPromise, flowRoot;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              resultsPromise = flowRootContainer.getServerStatusUpdates().take(2).toArray().toPromise();
              _context6.next = 3;
              return flowRootContainer.getRootForPath('foo');

            case 3:
              flowRoot = _context6.sent;

              (0, _assert2.default)(flowRoot != null);
              flowRoot._process._serverStatus.next('failed');

              _context6.next = 8;
              return resultsPromise;

            case 8:
              _context6.t0 = _context6.sent;
              _context6.t1 = [{
                pathToRoot: '/definitely/a/legit/path/',
                status: 'unknown'
              }, {
                pathToRoot: '/definitely/a/legit/path/',
                status: 'failed'
              }];
              expect(_context6.t0).toEqual(_context6.t1);

            case 11:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, undefined);
    })));
  });
});
//# sourceMappingURL=FlowRootContainer-spec.js.map