'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _main = require('../../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _process = require('../process');

var _RpcProcess = require('../RpcProcess');

var _RpcProcess2 = _interopRequireDefault(_RpcProcess);

var _nuclideRpc = require('../../nuclide-rpc');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('RpcProcess', function () {
  var server = void 0;

  beforeEach(function () {
    var PROCESS_PATH = _main2.default.join(__dirname, 'fixtures/dummy-service/dummyioserver.py');
    var OPTS = {
      cwd: _main2.default.dirname(PROCESS_PATH),
      stdio: 'pipe',
      detached: false
    };

    var serviceRegistry = _nuclideRpc.ServiceRegistry.createLocal([{
      name: 'dummy',
      definition: _main2.default.join(__dirname, 'fixtures/dummy-service/DummyService.js'),
      implementation: _main2.default.join(__dirname, 'fixtures/dummy-service/DummyService.js'),
      preserveFunctionNames: true
    }]);

    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      var createProcess;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              createProcess = function createProcess() {
                return (0, _process.safeSpawn)('python', [PROCESS_PATH], OPTS);
              };

              server = new _RpcProcess2.default('Dummy IO Server', serviceRegistry, createProcess);

            case 2:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    })));
  });

  afterEach(function () {
    (0, _assert2.default)(server != null);
    server.dispose();
  });

  function getService() {
    return server.getService('dummy');
  }

  it('should be able to complete calls', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
      var response;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return getService();

            case 2:
              _context2.next = 4;
              return _context2.sent.binarysystems();

            case 4:
              response = _context2.sent;

              expect(response).toEqual({
                hello: 'Hello World'
              });

            case 6:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined);
    })));
  });

  it('should be able to handle multiple calls', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
      var service, responses;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return getService();

            case 2:
              service = _context3.sent;
              _context3.next = 5;
              return Promise.all([service.a(), service.b(), service.c(), service.d()]);

            case 5:
              responses = _context3.sent;

              expect(responses.length).toBe(4);
              expect(responses).toEqual([{ hello: 'Hello World' }, { hello: 'Hello World' }, { hello: 'Hello World' }, { hello: 'Hello World' }]);

            case 8:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    })));
  });

  it('should reject pending calls upon error', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              _context4.next = 3;
              return getService();

            case 3:
              _context4.next = 5;
              return _context4.sent.error();

            case 5:
              (0, _assert2.default)(false, 'Fail - expected promise to reject');
              _context4.next = 11;
              break;

            case 8:
              _context4.prev = 8;
              _context4.t0 = _context4['catch'](0);

              expect(_context4.t0).toEqual('Command to error received');

            case 11:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined, [[0, 8]]);
    })));
  });

  it('should reject pending calls upon the child process exiting', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              _context5.next = 3;
              return getService();

            case 3:
              _context5.next = 5;
              return _context5.sent.kill();

            case 5:
              (0, _assert2.default)(false, 'Fail - expected promise to reject');
              _context5.next = 11;
              break;

            case 8:
              _context5.prev = 8;
              _context5.t0 = _context5['catch'](0);

              expect(_context5.t0.message.startsWith('Remote Error: Connection Closed processing message')).toBeTruthy();

            case 11:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined, [[0, 8]]);
    })));
  });

  it('should recover gracefully after the child process exits', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
      var response;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              _context6.next = 3;
              return getService();

            case 3:
              _context6.next = 5;
              return _context6.sent.kill();

            case 5:
              (0, _assert2.default)(false, 'Fail - expected promise to reject');
              _context6.next = 10;
              break;

            case 8:
              _context6.prev = 8;
              _context6.t0 = _context6['catch'](0);

            case 10:
              _context6.next = 12;
              return getService();

            case 12:
              _context6.next = 14;
              return _context6.sent.polarbears();

            case 14:
              response = _context6.sent;

              expect(response).toEqual({
                hello: 'Hello World'
              });

            case 16:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, undefined, [[0, 8]]);
    })));
  });
});
//# sourceMappingURL=RpcProcess-spec.js.map