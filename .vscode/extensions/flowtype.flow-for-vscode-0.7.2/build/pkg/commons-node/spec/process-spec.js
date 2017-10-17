'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _mockSpawn = require('mock-spawn');

var _mockSpawn2 = _interopRequireDefault(_mockSpawn);

var _main = require('../../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

var _process = require('../process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('commons-node/process', function () {

  var origPlatform = void 0;

  beforeEach(function () {
    origPlatform = process.platform;
    // Use a fake platform so the platform's PATH is not used in case the test is run on a platform
    // that requires special handling (like OS X).
    Object.defineProperty(process, 'platform', { value: 'MockMock' });
  });

  afterEach(function () {
    Object.defineProperty(process, 'platform', { value: origPlatform });
  });

  describe('createExecEnvironment()', function () {
    it('don\'t overwrite the PATH if it\'s different than process.env.PATH', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _process.createExecEnvironment)({ foo: 'bar', PATH: '/bin' }, ['/abc/def']);

              case 2:
                _context.t0 = _context.sent;
                _context.t1 = { foo: 'bar', PATH: '/bin' };
                expect(_context.t0).toEqual(_context.t1);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      })));
    });

    it('combine the existing environment variables with the common paths passed', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var PATH, delimitedPath;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                PATH = process.env.PATH;

                (0, _assert2.default)(PATH != null);
                delimitedPath = _main2.default.splitPathList(PATH);
                _context2.next = 5;
                return (0, _process.createExecEnvironment)({ foo: 'bar', PATH: PATH }, ['/abc/def']);

              case 5:
                _context2.t0 = _context2.sent;
                _context2.t1 = { foo: 'bar', PATH: _main2.default.joinPathList([].concat(_toConsumableArray(delimitedPath), ['/abc/def'])) };
                expect(_context2.t0).toEqual(_context2.t1);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, undefined);
      })));
    });

    // This is a regression test. Previously, we were doing simple string matching that would give
    // us false positives when checking if paths were in PATH.
    it('adds paths that are descendents of paths in PATH', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var oldPath, execEnv;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                oldPath = process.env.PATH;

                process.env.PATH = '/abc/def';
                execEnv = void 0;
                _context3.prev = 3;
                _context3.next = 6;
                return (0, _process.createExecEnvironment)(process.env, ['/abc']);

              case 6:
                execEnv = _context3.sent;

              case 7:
                _context3.prev = 7;

                process.env.PATH = oldPath;
                return _context3.finish(7);

              case 10:
                expect(execEnv.PATH).toEqual(_main2.default.joinPathList(['/abc/def', '/abc']));

              case 11:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, undefined, [[3,, 7, 10]]);
      })));
    });
  });

  describe('OS X path_helper regexp', function () {
    it('matches and captures valid PATH', function () {
      var matches = 'PATH="/usr/bin:/usr/local/bin"; export PATH; echo ""'.match(_process.__test__.DARWIN_PATH_HELPER_REGEXP);
      (0, _assert2.default)(matches);
      expect(matches[1]).toEqual('/usr/bin:/usr/local/bin');
    });
  });

  describe('checkOutput', function () {
    if (origPlatform !== 'win32') {
      it('returns stdout of the running process', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
          var val;
          return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.next = 2;
                  return (0, _process.checkOutput)('echo', ['-n', 'foo'], { env: process.env });

                case 2:
                  val = _context4.sent;

                  expect(val.stdout).toEqual('foo');

                case 4:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, undefined);
        })));
      });
      it('throws an error if the exit code !== 0', function () {
        waitsForPromise({ shouldReject: true }, _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return (0, _process.checkOutput)(process.execPath, ['-e', 'process.exit(1)']);

                case 2:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, undefined);
        })));
      });
      it('pipes stdout to stdin of `pipedCommand`', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
          var val;
          return regeneratorRuntime.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return (0, _process.checkOutput)('seq', ['1', '100'], { env: process.env, pipedCommand: 'head', pipedArgs: ['-10'] });

                case 2:
                  val = _context6.sent;

                  expect(val.stdout).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].join('\n') + '\n');

                case 4:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, undefined);
        })));
      });
      // This behaviour does not work properly on Macs :(
      if (process.platform === 'linux') {
        it('terminates piped processes correctly', function () {
          waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
            var val, children;
            return regeneratorRuntime.wrap(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    _context7.next = 2;
                    return (0, _process.checkOutput)('yes', [], { env: process.env, pipedCommand: 'head', pipedArgs: ['-1'] });

                  case 2:
                    val = _context7.sent;

                    expect(val.stdout).toEqual('y\n');
                    // Make sure the `yes` process actually terminates.
                    // It's possible to end up with dangling processes if pipe isn't implemented correctly.
                    _context7.next = 6;
                    return (0, _process.checkOutput)('ps', ['--ppid', process.pid.toString()]);

                  case 6:
                    children = _context7.sent;

                    expect(children.stdout).not.toContain('yes');

                  case 8:
                  case 'end':
                    return _context7.stop();
                }
              }
            }, _callee7, undefined);
          })));
        });
      }
      describe('when passed a pipedCommand', function () {
        it('captures an error message if the first command exits', function () {
          waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee8() {
            var error;
            return regeneratorRuntime.wrap(function _callee8$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    _context8.next = 2;
                    return (0, _process.asyncExecute)('exit', ['5'], { env: process.env, pipedCommand: 'head', pipedArgs: ['-10'] });

                  case 2:
                    error = _context8.sent;

                    expect(error.errorCode).toEqual('ENOENT');

                  case 4:
                  case 'end':
                    return _context8.stop();
                }
              }
            }, _callee8, undefined);
          })));
        });
      });
    }
  });

  describe('asyncExecute', function () {
    if (origPlatform !== 'win32') {
      it('asyncExecute returns an error if the process cannot be started', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
          var result;
          return regeneratorRuntime.wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return (0, _process.asyncExecute)('non_existing_command', /* args */[]);

                case 2:
                  result = _context9.sent;

                  expect(result.errorCode).toBe('ENOENT');

                case 4:
                case 'end':
                  return _context9.stop();
              }
            }
          }, _callee9, undefined);
        })));
      });
      it('asyncExecute does not throw an error if the exit code !== 0', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee10() {
          var _ref11, exitCode;

          return regeneratorRuntime.wrap(function _callee10$(_context10) {
            while (1) {
              switch (_context10.prev = _context10.next) {
                case 0:
                  _context10.next = 2;
                  return (0, _process.asyncExecute)(process.execPath, ['-e', 'process.exit(1)']);

                case 2:
                  _ref11 = _context10.sent;
                  exitCode = _ref11.exitCode;

                  expect(exitCode).toBe(1);

                case 5:
                case 'end':
                  return _context10.stop();
              }
            }
          }, _callee10, undefined);
        })));
      });
      it('asyncExecute works with stdio ignore', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee11() {
          var _ref13, exitCode;

          return regeneratorRuntime.wrap(function _callee11$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  _context11.next = 2;
                  return (0, _process.asyncExecute)(process.execPath, ['-e', 'process.exit(0)'], { stdio: ['ignore', 'pipe', 'pipe'] });

                case 2:
                  _ref13 = _context11.sent;
                  exitCode = _ref13.exitCode;

                  expect(exitCode).toBe(0);

                case 5:
                case 'end':
                  return _context11.stop();
              }
            }
          }, _callee11, undefined);
        })));
      });
      it('supports a timeout', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee12() {
          var result;
          return regeneratorRuntime.wrap(function _callee12$(_context12) {
            while (1) {
              switch (_context12.prev = _context12.next) {
                case 0:
                  jasmine.useRealClock();
                  _context12.next = 3;
                  return (0, _process.asyncExecute)('sleep', ['5'], { timeout: 100 });

                case 3:
                  result = _context12.sent;

                  expect(result.errorCode).toBe('ETIMEDOUT');

                  _context12.next = 7;
                  return (0, _process.asyncExecute)('sleep', ['0'], { timeout: 100 });

                case 7:
                  result = _context12.sent;

                  expect(result.exitCode).toBe(0);

                case 9:
                case 'end':
                  return _context12.stop();
              }
            }
          }, _callee12, undefined);
        })));
      });
    }
  });

  describe('process.safeSpawn', function () {
    it('should not crash the process on an error', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee13() {
        var child;
        return regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                spyOn(console, 'error'); // suppress error printing
                _context13.next = 3;
                return (0, _process.safeSpawn)('fakeCommand');

              case 3:
                child = _context13.sent;

                expect(child).not.toBe(null);
                expect(child.listeners('error').length).toBeGreaterThan(0);

              case 6:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, undefined);
      })));
    });
  });

  describe('process.scriptSafeSpawn', function () {
    it('should not crash the process on an error.', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee14() {
        var child;
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                _context14.next = 2;
                return (0, _process.scriptSafeSpawn)('fakeCommand');

              case 2:
                child = _context14.sent;

                expect(child).not.toBe(null);
                expect(child.listeners('error').length).toBeGreaterThan(0);

              case 5:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, undefined);
      })));
    });
  });

  describe('process.observeProcessExit', function () {
    it('exitCode', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee15() {
        var child, exitCode;
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                child = function child() {
                  return (0, _process.safeSpawn)(process.execPath, ['-e', 'process.exit(1)']);
                };

                _context15.next = 3;
                return (0, _process.observeProcessExit)(child).toPromise();

              case 3:
                exitCode = _context15.sent;

                expect(exitCode).toBe(1);

              case 5:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, undefined);
      })));
    });

    it('stdout exitCode', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee16() {
        var child, results;
        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                child = function child() {
                  return (0, _process.safeSpawn)(process.execPath, ['-e', 'console.log("stdout1\\nstdout2\\n\\n\\n"); process.exit(1);']);
                };

                _context16.next = 3;
                return (0, _process.observeProcess)(child).toArray().toPromise();

              case 3:
                results = _context16.sent;

                expect(results).toEqual([{ kind: 'stdout', data: 'stdout1\n' }, { kind: 'stdout', data: 'stdout2\n' }, { kind: 'stdout', data: '\n' }, { kind: 'stdout', data: '\n' }, { kind: 'stdout', data: '\n' }, { kind: 'exit', exitCode: 1 }]);

              case 5:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, undefined);
      })));
    });

    it('stderr exitCode', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee17() {
        var child, results;
        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                child = function child() {
                  return (0, _process.safeSpawn)(process.execPath, ['-e', 'console.error("stderr"); process.exit(42);']);
                };

                _context17.next = 3;
                return (0, _process.observeProcess)(child).toArray().toPromise();

              case 3:
                results = _context17.sent;

                expect(results).toEqual([{ kind: 'stderr', data: 'stderr\n' }, { kind: 'exit', exitCode: 42 }]);

              case 5:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, undefined);
      })));
    });

    it('stdout, stderr and exitCode', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee18() {
        var child, results;
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                child = function child() {
                  return (0, _process.safeSpawn)(process.execPath, ['-e', 'console.error("stderr"); console.log("std out"); process.exit(42);']);
                };

                _context18.next = 3;
                return (0, _process.observeProcess)(child).toArray().toPromise();

              case 3:
                results = _context18.sent;

                expect(results).toEqual([{ kind: 'stderr', data: 'stderr\n' }, { kind: 'stdout', data: 'std out\n' }, { kind: 'exit', exitCode: 42 }]);

              case 5:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, undefined);
      })));
    });

    it("kills the process when it becomes ready if you unsubscribe before it's returned", function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee20() {
        var process, createProcess, promise, subscription;
        return regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                spyOn(console, 'log'); // suppress log printing

                // A process that lasts ten seconds.
                process = (0, _mockSpawn2.default)(function (cb) {
                  setTimeout(function () {
                    return cb(0);
                  }, 10000);
                })();

                spyOn(process, 'kill');

                createProcess = function () {
                  var _ref22 = _asyncToGenerator(regeneratorRuntime.mark(function _callee19() {
                    return regeneratorRuntime.wrap(function _callee19$(_context19) {
                      while (1) {
                        switch (_context19.prev = _context19.next) {
                          case 0:
                            _context19.next = 2;
                            return new Promise(function (resolve) {
                              setTimeout(resolve, 5000);
                            });

                          case 2:
                            return _context19.abrupt('return', process);

                          case 3:
                          case 'end':
                            return _context19.stop();
                        }
                      }
                    }, _callee19, undefined);
                  }));

                  return function createProcess() {
                    return _ref22.apply(this, arguments);
                  };
                }();

                promise = createProcess();
                subscription = (0, _process.observeProcess)(function () {
                  return promise;
                }).subscribe(function () {});

                // Unsubscribe before the process is "created".

                subscription.unsubscribe();

                // Make sure the process is killed when we get it.
                advanceClock(20000);
                _context20.next = 10;
                return promise;

              case 10:
                expect(process.kill).toHaveBeenCalled();

              case 11:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, undefined);
      })));
    });
  });

  describe('getOutputStream', function () {
    it('captures stdout, stderr and exitCode', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee21() {
        var promise, child, results;
        return regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                promise = (0, _process.safeSpawn)(process.execPath, ['-e', 'console.error("stderr"); console.log("std out"); process.exit(42);']);
                _context21.next = 3;
                return promise;

              case 3:
                child = _context21.sent;
                _context21.next = 6;
                return (0, _process.getOutputStream)(child).toArray().toPromise();

              case 6:
                results = _context21.sent;

                expect(results).toEqual([{ kind: 'stderr', data: 'stderr\n' }, { kind: 'stdout', data: 'std out\n' }, { kind: 'exit', exitCode: 42 }]);

              case 8:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21, undefined);
      })));
    });

    it('captures stdout, stderr and exitCode when passed a promise', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee22() {
        var promise, results;
        return regeneratorRuntime.wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                promise = (0, _process.safeSpawn)(process.execPath, ['-e', 'console.error("stderr"); console.log("std out"); process.exit(42);']);
                _context22.next = 3;
                return (0, _process.getOutputStream)(promise).toArray().toPromise();

              case 3:
                results = _context22.sent;

                expect(results).toEqual([{ kind: 'stderr', data: 'stderr\n' }, { kind: 'stdout', data: 'std out\n' }, { kind: 'exit', exitCode: 42 }]);

              case 5:
              case 'end':
                return _context22.stop();
            }
          }
        }, _callee22, undefined);
      })));
    });
  });

  describe('createProcessStream', function () {

    it('errors when the process does', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee23() {
        var createProcess, processStream, error;
        return regeneratorRuntime.wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                spyOn(console, 'error'); // suppress error printing

                createProcess = function createProcess() {
                  return (0, _process.safeSpawn)('fakeCommand');
                };

                processStream = (0, _process.createProcessStream)(createProcess);
                error = void 0;
                _context23.prev = 4;
                _context23.next = 7;
                return processStream.toPromise();

              case 7:
                _context23.next = 12;
                break;

              case 9:
                _context23.prev = 9;
                _context23.t0 = _context23['catch'](4);

                error = _context23.t0;

              case 12:
                expect(error).toBeDefined();
                (0, _assert2.default)(error);
                expect(error.code).toBe('ENOENT');

              case 15:
              case 'end':
                return _context23.stop();
            }
          }
        }, _callee23, undefined, [[4, 9]]);
      })));
    });

    it('can be retried', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee24() {
        var createProcess;
        return regeneratorRuntime.wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                spyOn(console, 'error'); // suppress error printing
                createProcess = jasmine.createSpy().andCallFake(function () {
                  return (0, _process.safeSpawn)('fakeCommand');
                });
                _context24.prev = 2;
                _context24.next = 5;
                return (0, _process.createProcessStream)(createProcess).retryWhen(function (errors) {
                  return errors.scan(function (errorCount, err) {
                    // If this is the third time the process has errored (i.e. the have already been
                    // two errors before), stop retrying. (We try 3 times because because Rx 3 and 4
                    // have bugs with retrying shared observables that would give false negatives for
                    // this test if we only tried twice.)
                    if (errorCount === 2) {
                      throw err;
                    }
                    return errorCount + 1;
                  }, 0);
                }).toPromise();

              case 5:
                _context24.next = 9;
                break;

              case 7:
                _context24.prev = 7;
                _context24.t0 = _context24['catch'](2);

              case 9:
                expect(createProcess.callCount).toEqual(3);

              case 10:
              case 'end':
                return _context24.stop();
            }
          }
        }, _callee24, undefined, [[2, 7]]);
      })));
    });
  });

  describe('scriptSafeSpawn', function () {
    var mySpawn = null;
    var realSpawn = null;
    var realPlatform = null;

    beforeEach(function () {
      mySpawn = (0, _mockSpawn2.default)();
      realSpawn = _child_process2.default.spawn;
      _child_process2.default.spawn = mySpawn;
      realPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });
    });

    afterEach(function () {
      (0, _assert2.default)(realSpawn != null);
      _child_process2.default.spawn = realSpawn;
      (0, _assert2.default)(realPlatform != null);
      Object.defineProperty(process, 'platform', { value: realPlatform });
    });

    describe('scriptSafeSpawn', function () {
      var arg = '--arg1 --arg2';
      var bin = '/usr/bin/fakebinary';
      var testCases = [{ arguments: [arg], expectedCmd: bin + ' \'' + arg + '\'' }, { arguments: arg.split(' '), expectedCmd: bin + ' ' + arg }];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var testCase = _step.value;

          it('should quote arguments', function () {
            expect(process.platform).toEqual('linux', 'Platform was not properly mocked.');
            waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee25() {
              var child, args;
              return regeneratorRuntime.wrap(function _callee25$(_context25) {
                while (1) {
                  switch (_context25.prev = _context25.next) {
                    case 0:
                      _context25.next = 2;
                      return (0, _process.scriptSafeSpawn)(bin, testCase.arguments);

                    case 2:
                      child = _context25.sent;

                      expect(child).not.toBeNull();
                      _context25.next = 6;
                      return new Promise(function (resolve, reject) {
                        child.on('close', resolve);
                      });

                    case 6:
                      (0, _assert2.default)(mySpawn != null);
                      expect(mySpawn.calls.length).toBe(1);
                      args = mySpawn.calls[0].args;

                      expect(args.length).toBeGreaterThan(0);
                      expect(args[args.length - 1]).toBe(testCase.expectedCmd);

                    case 11:
                    case 'end':
                      return _context25.stop();
                  }
                }
              }, _callee25, undefined);
            })));
          });
        };

        for (var _iterator = testCases[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    });
  });

  describe('observeProcess', function () {

    it('completes the stream if the process errors', function () {
      spyOn(console, 'error');
      // If the stream doesn't complete, this will timeout.
      waitsForPromise({ timeout: 1000 }, _asyncToGenerator(regeneratorRuntime.mark(function _callee26() {
        return regeneratorRuntime.wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                _context26.next = 2;
                return (0, _process.observeProcess)(function () {
                  return (0, _process.safeSpawn)('fakeCommand');
                }).toArray().toPromise();

              case 2:
              case 'end':
                return _context26.stop();
            }
          }
        }, _callee26, undefined);
      })));
    });
  });

  describe('runCommand', function () {
    beforeEach(function () {
      // Suppress console spew.
      spyOn(console, 'error');
    });

    if (origPlatform === 'win32') {
      return;
    }

    it('returns stdout of the running process', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee27() {
        var val;
        return regeneratorRuntime.wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                _context27.next = 2;
                return (0, _process.runCommand)('echo', ['-n', 'foo'], { env: process.env }).toPromise();

              case 2:
                val = _context27.sent;

                expect(val).toEqual('foo');

              case 4:
              case 'end':
                return _context27.stop();
            }
          }
        }, _callee27, undefined);
      })));
    });

    it("throws an error if the process can't be spawned", function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee28() {
        var error;
        return regeneratorRuntime.wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                error = void 0;
                _context28.prev = 1;
                _context28.next = 4;
                return (0, _process.runCommand)('fakeCommand').toPromise();

              case 4:
                _context28.next = 9;
                break;

              case 6:
                _context28.prev = 6;
                _context28.t0 = _context28['catch'](1);

                error = _context28.t0;

              case 9:
                (0, _assert2.default)(error != null);
                expect(error.name).toBe('ProcessSystemError');

              case 11:
              case 'end':
                return _context28.stop();
            }
          }
        }, _callee28, undefined, [[1, 6]]);
      })));
    });

    it('throws an error if the exit code !== 0', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee29() {
        var error;
        return regeneratorRuntime.wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                error = void 0;
                _context29.prev = 1;
                _context29.next = 4;
                return (0, _process.runCommand)(process.execPath, ['-e', 'process.exit(1)']).toPromise();

              case 4:
                _context29.next = 9;
                break;

              case 6:
                _context29.prev = 6;
                _context29.t0 = _context29['catch'](1);

                error = _context29.t0;

              case 9:
                (0, _assert2.default)(error != null);
                expect(error.name).toBe('ProcessExitError');
                expect(error.code).toBe(1);

              case 12:
              case 'end':
                return _context29.stop();
            }
          }
        }, _callee29, undefined, [[1, 6]]);
      })));
    });

    it('accumulates the stdout if the process exits with a non-zero code', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee30() {
        var error;
        return regeneratorRuntime.wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                error = void 0;
                _context30.prev = 1;
                _context30.next = 4;
                return (0, _process.runCommand)(process.execPath, ['-e', 'process.stdout.write("hola"); process.exit(1)']).toPromise();

              case 4:
                _context30.next = 9;
                break;

              case 6:
                _context30.prev = 6;
                _context30.t0 = _context30['catch'](1);

                error = _context30.t0;

              case 9:
                (0, _assert2.default)(error != null);
                expect(error.stdout).toBe('hola');

              case 11:
              case 'end':
                return _context30.stop();
            }
          }
        }, _callee30, undefined, [[1, 6]]);
      })));
    });

    it('accumulates the stderr if the process exits with a non-zero code', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee31() {
        var error;
        return regeneratorRuntime.wrap(function _callee31$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                error = void 0;
                _context31.prev = 1;
                _context31.next = 4;
                return (0, _process.runCommand)(process.execPath, ['-e', 'process.stderr.write("oopsy"); process.exit(1)']).toPromise();

              case 4:
                _context31.next = 9;
                break;

              case 6:
                _context31.prev = 6;
                _context31.t0 = _context31['catch'](1);

                error = _context31.t0;

              case 9:
                (0, _assert2.default)(error != null);
                expect(error.stderr).toBe('oopsy');

              case 11:
              case 'end':
                return _context31.stop();
            }
          }
        }, _callee31, undefined, [[1, 6]]);
      })));
    });
  });
});
//# sourceMappingURL=process-spec.js.map