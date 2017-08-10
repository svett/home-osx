'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _FlowProcess = require('../lib/FlowProcess');

var _nuclideTestHelpers = require('../../nuclide-test-helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var flowProcessPath = '../lib/FlowProcess';

describe('FlowProcess', function () {
  var fakeCheckOutput = null;

  // Mocked ChildProcess instance (not typed as such because the mock only implements a subset of
  // methods).
  var childSpy = void 0;

  var FlowProcess = null;
  var flowProcess = null;

  var root = '/path/to/flow/root';

  function execFlow() {
    var waitForServer = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

    return flowProcess.execFlow([], {}, waitForServer);
  }

  beforeEach(function () {
    // We need this level of indirection to ensure that if fakeCheckOutput is rebound, the new one
    // gets executed.
    var runFakeCheckOutput = function runFakeCheckOutput() {
      return fakeCheckOutput.apply(undefined, arguments);
    };
    spyOn(require('../../commons-node/process'), 'asyncExecute').andCallFake(runFakeCheckOutput);
    fakeCheckOutput = jasmine.createSpy().andReturn({ exitCode: _FlowProcess.FLOW_RETURN_CODES.ok });

    childSpy = {
      stdout: {
        on: function on() {}
      },
      stderr: {
        on: function on() {}
      },
      on: function on() {},
      kill: function kill() {}
    };

    spyOn(require('../../commons-node/process'), 'safeSpawn').andCallFake(function () {
      return childSpy;
    });
    // we have to create another flow service here since we've mocked modules
    // we depend on since the outer beforeEach ran.
    FlowProcess = (0, _nuclideTestHelpers.uncachedRequire)(require, flowProcessPath).FlowProcess;
    flowProcess = new FlowProcess(root);
  });

  describe('Server startup and teardown', function () {
    beforeEach(function () {
      var called = false;
      // we want asyncExecute to error the first time, to mimic Flow not
      // runinng. Then, it will spawn a new flow process, and we want that to be
      // successful
      fakeCheckOutput = function fakeCheckOutput() {
        if (called) {
          return { exitCode: _FlowProcess.FLOW_RETURN_CODES.ok };
        } else {
          called = true;
          return {
            exitCode: _FlowProcess.FLOW_RETURN_CODES.noServerRunning,
            stderr: 'There is no flow server running\n\'/path/to/flow/root\''
          };
        }
      };

      spyOn(childSpy, 'kill');
      spyOn(childSpy, 'on');

      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return execFlow();

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      })));
    });

    afterEach(function () {
      jasmine.unspy(require('../../commons-node/process'), 'asyncExecute');
      jasmine.unspy(require('../../commons-node/process'), 'safeSpawn');
    });

    describe('execFlow', function () {
      it('should spawn a new Flow server', function () {
        var expectedWorkers = _os2.default.cpus().length - 2;
        // $FlowIgnore it's a spy.
        var args = require('../../commons-node/process').safeSpawn.mostRecentCall.args;
        expect(args[0]).toEqual('flow');
        expect(args[1]).toEqual(['server', '--from', 'nuclide', '--max-workers', expectedWorkers.toString(), '/path/to/flow/root']);
        expect(args[2].cwd).toEqual(root);
        expect(args[2].env.OCAMLRUNPARAM).toEqual('b');
      });
    });

    describe('crashing Flow', function () {
      var event = void 0;
      var handler = void 0;

      beforeEach(function () {
        // simulate a Flow crash
        var _childSpy$on$mostRece = _slicedToArray(childSpy.on.mostRecentCall.args, 2);

        event = _childSpy$on$mostRece[0];
        handler = _childSpy$on$mostRece[1];
        handler(2, null);
      });

      it('should blacklist the root', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  expect(event).toBe('exit');
                  _context2.next = 3;
                  return execFlow();

                case 3:
                  _context2.t0 = _context2.sent;
                  expect(_context2.t0).toBeNull();

                case 5:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, undefined);
        })));
      });

      it('should allow the server to restart if allowServerRestart is called', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  expect(event).toBe('exit');

                  flowProcess.allowServerRestart();

                  _context3.next = 4;
                  return execFlow();

                case 4:
                  _context3.t0 = _context3.sent;
                  expect(_context3.t0).not.toBeNull();

                case 6:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, undefined);
        })));
      });
    });

    describe('dispose', function () {
      it('should kill flow server', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
          return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  flowProcess.dispose();
                  expect(childSpy.kill).toHaveBeenCalledWith('SIGKILL');

                case 2:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, undefined);
        })));
      });
    });
  });

  describe('server state updates', function () {
    var currentStatus = null;
    var subscription = null;
    var statusUpdates = null;

    beforeEach(function () {
      currentStatus = null;
      statusUpdates = flowProcess.getServerStatusUpdates();
      subscription = statusUpdates.subscribe(function (status) {
        currentStatus = status;
      });
    });

    afterEach(function () {
      subscription.unsubscribe();
    });

    it('should start as unknown', function () {
      expect(currentStatus).toEqual('unknown');
    });

    var exitCodeStatusPairs = [[_FlowProcess.FLOW_RETURN_CODES.ok, 'ready'], [_FlowProcess.FLOW_RETURN_CODES.typeError, 'ready'], [_FlowProcess.FLOW_RETURN_CODES.serverInitializing, 'init'], [_FlowProcess.FLOW_RETURN_CODES.noServerRunning, 'not running'], [_FlowProcess.FLOW_RETURN_CODES.outOfRetries, 'busy'],
    // server/client version mismatch -- this kills the server
    [_FlowProcess.FLOW_RETURN_CODES.buildIdMismatch, 'not running']];
    exitCodeStatusPairs.forEach(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2);

      var exitCode = _ref6[0];
      var status = _ref6[1];

      it('should be ' + status + ' when Flow returns ' + exitCode, function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  fakeCheckOutput = function fakeCheckOutput() {
                    return { exitCode: exitCode };
                  };
                  _context5.next = 3;
                  return execFlow( /* waitForServer */false).catch(function (e) {
                    expect(e.exitCode).toBe(exitCode);
                  });

                case 3:
                  expect(currentStatus).toEqual(status);

                case 4:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, undefined);
        })));
      });
    });

    it('should ping the server after it is started', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
        var states;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                states = statusUpdates.take(4).toArray().toPromise();

                fakeCheckOutput = function fakeCheckOutput() {
                  switch (currentStatus) {
                    case 'unknown':
                      return { exitCode: _FlowProcess.FLOW_RETURN_CODES.noServerRunning };
                    case 'not running':
                      return { exitCode: _FlowProcess.FLOW_RETURN_CODES.serverInitializing };
                    case 'init':
                      return { exitCode: _FlowProcess.FLOW_RETURN_CODES.ok };
                    default:
                      throw new Error('should not happen');
                  }
                };
                _context6.next = 4;
                return execFlow( /* waitForServer */false).catch(function (e) {
                  expect(e.exitCode).toBe(_FlowProcess.FLOW_RETURN_CODES.noServerRunning);
                });

              case 4:
                _context6.next = 6;
                return states;

              case 6:
                _context6.t0 = _context6.sent;
                _context6.t1 = ['unknown', 'not running', 'init', 'ready'];
                expect(_context6.t0).toEqual(_context6.t1);

              case 9:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, undefined);
      })));
    });
  });

  describe('execFlowClient', function () {
    it('should call asyncExecute', function () {
      FlowProcess.execFlowClient(['arg']);

      var _fakeCheckOutput$args = _slicedToArray(fakeCheckOutput.argsForCall, 1);

      var asyncExecuteArgs = _fakeCheckOutput$args[0];

      expect(asyncExecuteArgs[0]).toEqual('flow');
      expect(asyncExecuteArgs[1]).toEqual(['arg', '--from', 'nuclide']);
      expect(asyncExecuteArgs[2]).toEqual({});
    });
  });
});
//# sourceMappingURL=FlowProcess-spec.js.map