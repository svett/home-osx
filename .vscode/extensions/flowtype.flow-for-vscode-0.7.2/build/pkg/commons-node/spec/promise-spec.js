'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var captureParallelismHistory = function () {
  var _ref36 = _asyncToGenerator(regeneratorRuntime.mark(function _callee28(asyncFunction, args) {
    var _this = this;

    var parallelismHistory, parralelism, result;
    return regeneratorRuntime.wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            parallelismHistory = [];
            parralelism = 0;
            _context28.next = 4;
            return asyncFunction.apply(null, args.map(function (arg) {
              if (typeof arg !== 'function') {
                return arg;
              }
              var func = arg;
              return function () {
                var _ref37 = _asyncToGenerator(regeneratorRuntime.mark(function _callee27(item) {
                  var value;
                  return regeneratorRuntime.wrap(function _callee27$(_context27) {
                    while (1) {
                      switch (_context27.prev = _context27.next) {
                        case 0:
                          ++parralelism;
                          parallelismHistory.push(parralelism);
                          _context27.next = 4;
                          return func(item);

                        case 4:
                          value = _context27.sent;

                          --parralelism;
                          return _context27.abrupt('return', value);

                        case 7:
                        case 'end':
                          return _context27.stop();
                      }
                    }
                  }, _callee27, _this);
                }));

                return function (_x4) {
                  return _ref37.apply(this, arguments);
                };
              }();
            }));

          case 4:
            result = _context28.sent;
            return _context28.abrupt('return', { result: result, parallelismHistory: parallelismHistory });

          case 6:
          case 'end':
            return _context28.stop();
        }
      }
    }, _callee28, this);
  }));

  return function captureParallelismHistory(_x2, _x3) {
    return _ref36.apply(this, arguments);
  };
}();

var _promise = require('../promise');

var _nuclideTestHelpers = require('../../nuclide-test-helpers');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('promises::asyncFind()', function () {

  it('Empty list of items should resolve to null.', function () {
    var isResolved = false;
    var observedResult = void 0;
    var isRejected = false;
    var observedError = void 0;

    var args = [];
    var test = function test(value) {
      throw new Error('Should not be called.');
    };

    runs(function () {
      (0, _promise.asyncFind)(args, test).then(function (result) {
        observedResult = result;
        isResolved = true;
      }).catch(function (error) {
        observedError = error;
        isRejected = true;
      });
    });

    waitsFor(function () {
      return isResolved || isRejected;
    });

    runs(function () {
      expect(isResolved).toBe(true);
      expect(observedResult).toBe(null);
      expect(isRejected).toBe(false);
      expect(observedError).toBe(undefined);
    });
  });

  it('Last item in list resolves.', function () {
    var isResolved = false;
    var observedResult = void 0;
    var isRejected = false;
    var observedError = void 0;

    var args = ['foo', 'bar', 'baz'];
    var test = function test(value) {
      if (value === 'foo') {
        return null;
      } else if (value === 'bar') {
        return Promise.resolve(null);
      } else {
        return Promise.resolve('win');
      }
    };

    runs(function () {
      (0, _promise.asyncFind)(args, test).then(function (result) {
        observedResult = result;
        isResolved = true;
      }).catch(function (error) {
        observedError = error;
        isRejected = true;
      });
    });

    waitsFor(function () {
      return isResolved || isRejected;
    });

    runs(function () {
      expect(isResolved).toBe(true);
      expect(observedResult).toBe('win');
      expect(isRejected).toBe(false);
      expect(observedError).toBe(undefined);
    });
  });
});

describe('promises::denodeify()', function () {
  /**
   * Vararg function that assumes that all elements except the last are
   * numbers, as the last argument is a callback function. All of the
   * other arguments are multiplied together. If the result is not NaN,
   * then the callback is called with the product. Otherwise, the callback
   * is called with an error.
   *
   * This function exhibits some of the quirky behavior of Node APIs that
   * accept a variable number of arguments in the middle of the parameter list
   * rather than at the end. The type signature of this function cannot be
   * expressed in Flow.
   */
  function asyncProduct() {
    var factors = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
    var product = factors.reduce(function (previousValue, currentValue) {
      return previousValue * currentValue;
    }, 1);

    var callback = arguments[arguments.length - 1];
    if (isNaN(product)) {
      callback(new Error('product was NaN'));
    } else {
      callback(null, product);
    }
  }

  it('resolves Promise when callback succeeds', function () {
    var denodeifiedAsyncProduct = (0, _promise.denodeify)(asyncProduct);
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      var trivialProduct, product;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return denodeifiedAsyncProduct();

            case 2:
              trivialProduct = _context.sent;

              expect(trivialProduct).toBe(1);

              _context.next = 6;
              return denodeifiedAsyncProduct(1, 2, 3, 4, 5);

            case 6:
              product = _context.sent;

              expect(product).toBe(120);

            case 8:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    })));
  });

  it('rejects Promise when callback fails', function () {
    var denodeifiedAsyncProduct = (0, _promise.denodeify)(asyncProduct);
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return (0, _nuclideTestHelpers.expectAsyncFailure)(denodeifiedAsyncProduct('a', 'b'), function (error) {
                expect(error.message).toBe('product was NaN');
              });

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined);
    })));
  });

  function checksReceiver(expectedReceiver, callback) {
    if (this === expectedReceiver) {
      callback(null, 'winner');
    } else {
      callback(new Error('unexpected receiver'));
    }
  }

  it('result of denodeify propagates receiver as expected', function () {
    var denodeifiedChecksReceiver = (0, _promise.denodeify)(checksReceiver);

    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
      var receiver, result;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              receiver = { denodeifiedChecksReceiver: denodeifiedChecksReceiver };
              _context3.next = 3;
              return receiver.denodeifiedChecksReceiver(receiver);

            case 3:
              result = _context3.sent;

              expect(result).toBe('winner');

            case 5:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    })));

    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
      var receiver;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              receiver = { denodeifiedChecksReceiver: denodeifiedChecksReceiver };
              _context4.next = 3;
              return (0, _nuclideTestHelpers.expectAsyncFailure)(receiver.denodeifiedChecksReceiver(null), function (error) {
                expect(error.message).toBe('unexpected receiver');
              });

            case 3:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    })));
  });
});

describe('promises::serializeAsyncCall()', function () {

  it('Returns the same result when called after scheduled', function () {
    var i = 0;
    var asyncFunSpy = jasmine.createSpy('async');
    var oneAsyncCallAtATime = (0, _promise.serializeAsyncCall)(function () {
      i++;
      var resultPromise = waitPromise(10, i);
      asyncFunSpy();
      return resultPromise;
    });
    // Start an async, and resolve to 1 in 10 ms.
    var result1Promise = oneAsyncCallAtATime();
    // Schedule the next async, and resolve to 2 in 20 ms.
    var result2Promise = oneAsyncCallAtATime();
    // Reuse scheduled promise and resolve to 2 in 20 ms.
    var result3Promise = oneAsyncCallAtATime();

    window.advanceClock(11);
    // Wait for the promise to call the next chain
    // That isn't synchrnously guranteed because it happens on `process.nextTick`.
    waitsFor(function () {
      return asyncFunSpy.callCount === 2;
    });
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
      var results;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              window.advanceClock(11);
              _context5.next = 3;
              return Promise.all([result1Promise, result2Promise, result3Promise]);

            case 3:
              results = _context5.sent;

              expect(results).toEqual([1, 2, 2]);

            case 5:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined);
    })));
  });

  it('Calls and returns (even if errors) the same number of times if serially called', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
      var i, oneAsyncCallAtATime, result1Promise, result1, result2Promise, result2, result3Promise, result3, errorPromoise, result5Promise, result5;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              i = 0;
              oneAsyncCallAtATime = (0, _promise.serializeAsyncCall)(function () {
                i++;
                if (i === 4) {
                  return Promise.reject('ERROR');
                }
                return waitPromise(10, i);
              });
              result1Promise = oneAsyncCallAtATime();

              window.advanceClock(11);
              _context6.next = 6;
              return result1Promise;

            case 6:
              result1 = _context6.sent;
              result2Promise = oneAsyncCallAtATime();

              window.advanceClock(11);
              _context6.next = 11;
              return result2Promise;

            case 11:
              result2 = _context6.sent;
              result3Promise = oneAsyncCallAtATime();

              window.advanceClock(11);
              _context6.next = 16;
              return result3Promise;

            case 16:
              result3 = _context6.sent;
              errorPromoise = oneAsyncCallAtATime();

              window.advanceClock(11);
              _context6.next = 21;
              return (0, _nuclideTestHelpers.expectAsyncFailure)(errorPromoise, function (error) {
                expect(error).toBe('ERROR');
              });

            case 21:
              result5Promise = oneAsyncCallAtATime();

              window.advanceClock(11);
              _context6.next = 25;
              return result5Promise;

            case 25:
              result5 = _context6.sent;

              expect([result1, result2, result3, result5]).toEqual([1, 2, 3, 5]);

            case 27:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, undefined);
    })));
  });
});

describe('promises::asyncLimit()', function () {
  beforeEach(function () {
    jasmine.useRealClock();
  });

  it('runs in series if limit is 1', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
      var _ref8, result, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return captureParallelismHistory(_promise.asyncLimit, [[1, 2, 3], 1, function (item) {
                return waitPromise(10, item + 1);
              }]);

            case 2:
              _ref8 = _context7.sent;
              result = _ref8.result;
              parallelismHistory = _ref8.parallelismHistory;

              expect(parallelismHistory).toEqual([1, 1, 1]);
              expect(result).toEqual([2, 3, 4]);

            case 7:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, undefined);
    })));
  });

  it('runs with the specified limit, until finishing', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee8() {
      var _ref10, result, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return captureParallelismHistory(_promise.asyncLimit, [[1, 2, 3, 4, 5, 6, 7, 8, 9], 3, function (item) {
                return waitPromise(10 + item, item - 1);
              }]);

            case 2:
              _ref10 = _context8.sent;
              result = _ref10.result;
              parallelismHistory = _ref10.parallelismHistory;

              expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
              expect(parallelismHistory).toEqual([1, 2, 3, 3, 3, 3, 3, 3, 3]);

            case 7:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, undefined);
    })));
  });

  it('works when the limit is bigger than the array length', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
      var result;
      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              _context9.next = 2;
              return (0, _promise.asyncLimit)([1, 2, 3], 10, function (item) {
                return waitPromise(10, item * 2);
              });

            case 2:
              result = _context9.sent;

              expect(result).toEqual([2, 4, 6]);

            case 4:
            case 'end':
              return _context9.stop();
          }
        }
      }, _callee9, undefined);
    })));
  });

  it('a rejected promise rejects the whole call with the error', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee11() {
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              _context11.next = 2;
              return (0, _nuclideTestHelpers.expectAsyncFailure)((0, _promise.asyncLimit)([1], 1, function () {
                var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(item) {
                  return regeneratorRuntime.wrap(function _callee10$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          throw new Error('rejected iterator promise');

                        case 1:
                        case 'end':
                          return _context10.stop();
                      }
                    }
                  }, _callee10, undefined);
                }));

                return function (_x) {
                  return _ref13.apply(this, arguments);
                };
              }()), function (error) {
                expect(error.message).toBe('rejected iterator promise');
              });

            case 2:
            case 'end':
              return _context11.stop();
          }
        }
      }, _callee11, undefined);
    })));
  });

  it('works when the array is empty', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee12() {
      var result;
      return regeneratorRuntime.wrap(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              _context12.next = 2;
              return (0, _promise.asyncLimit)([], 1, function () {
                return Promise.resolve();
              });

            case 2:
              result = _context12.sent;

              expect(result).toEqual([]);

            case 4:
            case 'end':
              return _context12.stop();
          }
        }
      }, _callee12, undefined);
    })));
  });
});

describe('promises::asyncFilter()', function () {
  beforeEach(function () {
    jasmine.useRealClock();
  });

  // eslint-disable-next-line max-len
  it('filters an array with an async iterator and maximum parallelization when no limit is specified', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee13() {
      var _ref16, filtered, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              _context13.next = 2;
              return captureParallelismHistory(_promise.asyncFilter, [[1, 2, 3, 4, 5], function (item) {
                return waitPromise(10 + item, item > 2);
              }]);

            case 2:
              _ref16 = _context13.sent;
              filtered = _ref16.result;
              parallelismHistory = _ref16.parallelismHistory;

              expect(filtered).toEqual([3, 4, 5]);
              expect(parallelismHistory).toEqual([1, 2, 3, 4, 5]);

            case 7:
            case 'end':
              return _context13.stop();
          }
        }
      }, _callee13, undefined);
    })));
  });

  it('filters an array with a limit on parallelization', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee14() {
      var _ref18, filtered, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              _context14.next = 2;
              return captureParallelismHistory(_promise.asyncFilter, [[1, 2, 3, 4, 5], function (item) {
                return waitPromise(10 + item, item > 2);
              }, 3]);

            case 2:
              _ref18 = _context14.sent;
              filtered = _ref18.result;
              parallelismHistory = _ref18.parallelismHistory;

              expect(filtered).toEqual([3, 4, 5]);
              // Increasing promise resolve time will gurantee maximum parallelization.
              expect(parallelismHistory).toEqual([1, 2, 3, 3, 3]);

            case 7:
            case 'end':
              return _context14.stop();
          }
        }
      }, _callee14, undefined);
    })));
  });
});

describe('promises::asyncObjFilter()', function () {
  beforeEach(function () {
    jasmine.useRealClock();
  });

  // eslint-disable-next-line max-len
  it('filters an object with an async iterator and maximum parallelization when no limit is specified', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee15() {
      var _ref20, filtered, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              _context15.next = 2;
              return captureParallelismHistory(_promise.asyncObjFilter, [{ a: 1, b: 2, c: 3, d: 4, e: 5 }, function (value, key) {
                return waitPromise(5 + value, value > 2);
              }]);

            case 2:
              _ref20 = _context15.sent;
              filtered = _ref20.result;
              parallelismHistory = _ref20.parallelismHistory;

              expect(filtered).toEqual({ c: 3, d: 4, e: 5 });
              expect(parallelismHistory).toEqual([1, 2, 3, 4, 5]);

            case 7:
            case 'end':
              return _context15.stop();
          }
        }
      }, _callee15, undefined);
    })));
  });

  it('filters an array with a limit on parallelization', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee16() {
      var _ref22, filtered, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              _context16.next = 2;
              return captureParallelismHistory(_promise.asyncObjFilter, [{ a: 1, b: 2, c: 3, d: 4, e: 5 }, function (value, key) {
                return waitPromise(5 + value, value > 2);
              }, 3]);

            case 2:
              _ref22 = _context16.sent;
              filtered = _ref22.result;
              parallelismHistory = _ref22.parallelismHistory;

              expect(filtered).toEqual({ c: 3, d: 4, e: 5 });
              // Increasing promise resolve time will gurantee maximum parallelization.
              expect(parallelismHistory).toEqual([1, 2, 3, 3, 3]);

            case 7:
            case 'end':
              return _context16.stop();
          }
        }
      }, _callee16, undefined);
    })));
  });
});

describe('promises::asyncSome()', function () {
  beforeEach(function () {
    jasmine.useRealClock();
  });

  // eslint-disable-next-line max-len
  it('some an array with an async iterator and maximum parallelization when no limit is specified', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee17() {
      var _ref24, result, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              _context17.next = 2;
              return captureParallelismHistory(_promise.asyncSome, [[1, 2, 3, 4, 5], function (item) {
                return waitPromise(10, item === 6);
              }]);

            case 2:
              _ref24 = _context17.sent;
              result = _ref24.result;
              parallelismHistory = _ref24.parallelismHistory;

              expect(result).toEqual(false);
              expect(parallelismHistory).toEqual([1, 2, 3, 4, 5]);

            case 7:
            case 'end':
              return _context17.stop();
          }
        }
      }, _callee17, undefined);
    })));
  });

  it('some an array with a limit on parallelization', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee18() {
      var _ref26, result, parallelismHistory;

      return regeneratorRuntime.wrap(function _callee18$(_context18) {
        while (1) {
          switch (_context18.prev = _context18.next) {
            case 0:
              _context18.next = 2;
              return captureParallelismHistory(_promise.asyncSome, [[1, 2, 3, 4, 5], function (item) {
                return waitPromise(10 + item, item === 5);
              }, 3]);

            case 2:
              _ref26 = _context18.sent;
              result = _ref26.result;
              parallelismHistory = _ref26.parallelismHistory;

              expect(result).toEqual(true);
              expect(parallelismHistory).toEqual([1, 2, 3, 3, 3]);

            case 7:
            case 'end':
              return _context18.stop();
          }
        }
      }, _callee18, undefined);
    })));
  });
});

describe('promises::retryLimit()', function () {
  beforeEach(function () {
    jasmine.useRealClock();
  });

  it('retries and fails 2 times before resolving to an acceptable result where limit = 5', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee19() {
      var succeedAfter, calls, validationCalls, retrialsResult;
      return regeneratorRuntime.wrap(function _callee19$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              succeedAfter = 2;
              calls = 0;
              validationCalls = 0;
              _context19.next = 5;
              return (0, _promise.retryLimit)(function () {
                return new Promise(function (resolve, reject) {
                  calls++;
                  if (succeedAfter-- === 0) {
                    resolve('RESULT');
                  } else {
                    reject('ERROR');
                  }
                });
              }, function (result) {
                validationCalls++;
                return result === 'RESULT';
              }, 5);

            case 5:
              retrialsResult = _context19.sent;

              expect(calls).toBe(3);
              expect(validationCalls).toBe(1);
              expect(retrialsResult).toBe('RESULT');

            case 9:
            case 'end':
              return _context19.stop();
          }
        }
      }, _callee19, undefined);
    })));
  });

  it('retries and fails consistently', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee20() {
      var calls, validationCalls, failRetriesPromise;
      return regeneratorRuntime.wrap(function _callee20$(_context20) {
        while (1) {
          switch (_context20.prev = _context20.next) {
            case 0:
              calls = 0;
              validationCalls = 0;
              failRetriesPromise = (0, _promise.retryLimit)(function () {
                calls++;
                return Promise.reject('ERROR');
              }, function (result) {
                validationCalls++;
                return result != null;
              }, 2);
              _context20.next = 5;
              return (0, _nuclideTestHelpers.expectAsyncFailure)(failRetriesPromise, function (error) {
                expect(error).toBe('ERROR');
              });

            case 5:
              expect(calls).toBe(2);
              expect(validationCalls).toBe(0);

            case 7:
            case 'end':
              return _context20.stop();
          }
        }
      }, _callee20, undefined);
    })));
  });

  it('accepts a null response', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee21() {
      var succeedAfter, calls, validationCalls, retryResult;
      return regeneratorRuntime.wrap(function _callee21$(_context21) {
        while (1) {
          switch (_context21.prev = _context21.next) {
            case 0:
              succeedAfter = 2;
              calls = 0;
              validationCalls = 0;
              _context21.next = 5;
              return (0, _promise.retryLimit)(function () {
                calls++;
                if (succeedAfter-- === 0) {
                  return Promise.resolve(null);
                } else {
                  return Promise.resolve('NOT_GOOD');
                }
              }, function (result) {
                validationCalls++;
                return result == null;
              }, 5);

            case 5:
              retryResult = _context21.sent;

              expect(retryResult).toBe(null);
              expect(calls).toBe(3);
              expect(validationCalls).toBe(3);

            case 9:
            case 'end':
              return _context21.stop();
          }
        }
      }, _callee21, undefined);
    })));
  });

  it('no valid response is ever got', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee22() {
      var nonValidRetriesPromise;
      return regeneratorRuntime.wrap(function _callee22$(_context22) {
        while (1) {
          switch (_context22.prev = _context22.next) {
            case 0:
              nonValidRetriesPromise = (0, _promise.retryLimit)(function () {
                return Promise.resolve('A');
              }, function (result) {
                return result === 'B';
              }, 2);
              _context22.next = 3;
              return (0, _nuclideTestHelpers.expectAsyncFailure)(nonValidRetriesPromise, function (error) {
                expect(error.message).toBe('No valid response found!');
              });

            case 3:
            case 'end':
              return _context22.stop();
          }
        }
      }, _callee22, undefined);
    })));
  });
});

describe('promises::RequestSerializer()', function () {
  var requestSerializer = null;

  beforeEach(function () {
    jasmine.useRealClock();
    requestSerializer = new _promise.RequestSerializer();
  });

  it('gets outdated result for old promises resolving after newer calls', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee23() {
      var oldPromise, newPromise, _ref32, oldStatus, newResult;

      return regeneratorRuntime.wrap(function _callee23$(_context23) {
        while (1) {
          switch (_context23.prev = _context23.next) {
            case 0:
              oldPromise = requestSerializer.run(waitPromise(10, 'OLD'));
              newPromise = requestSerializer.run(waitPromise(5, 'NEW'));
              _context23.next = 4;
              return oldPromise;

            case 4:
              _ref32 = _context23.sent;
              oldStatus = _ref32.status;

              expect(oldStatus).toBe('outdated');
              _context23.next = 9;
              return newPromise;

            case 9:
              newResult = _context23.sent;

              expect(newResult.status).toBe('success');
              (0, _assert2.default)(newResult.result);
              expect(newResult.result).toBe('NEW');

            case 13:
            case 'end':
              return _context23.stop();
          }
        }
      }, _callee23, undefined);
    })));
  });

  it('waitForLatestResult: waits for the latest result', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee24() {
      var latestResult;
      return regeneratorRuntime.wrap(function _callee24$(_context24) {
        while (1) {
          switch (_context24.prev = _context24.next) {
            case 0:
              requestSerializer.run(waitPromise(5, 'OLD'));
              requestSerializer.run(waitPromise(10, 'NEW'));
              _context24.next = 4;
              return requestSerializer.waitForLatestResult();

            case 4:
              latestResult = _context24.sent;

              expect(latestResult).toBe('NEW');

            case 6:
            case 'end':
              return _context24.stop();
          }
        }
      }, _callee24, undefined);
    })));
  });

  it('waitForLatestResult: waits even if the first run did not kick off', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee25() {
      var latestResultPromise, latestResult;
      return regeneratorRuntime.wrap(function _callee25$(_context25) {
        while (1) {
          switch (_context25.prev = _context25.next) {
            case 0:
              latestResultPromise = requestSerializer.waitForLatestResult();

              requestSerializer.run(waitPromise(10, 'RESULT'));
              _context25.next = 4;
              return latestResultPromise;

            case 4:
              latestResult = _context25.sent;

              expect(latestResult).toBe('RESULT');

            case 6:
            case 'end':
              return _context25.stop();
          }
        }
      }, _callee25, undefined);
    })));
  });

  it('waitForLatestResult: does not wait for the first, if the second resolves faster', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee26() {
      var latestResult;
      return regeneratorRuntime.wrap(function _callee26$(_context26) {
        while (1) {
          switch (_context26.prev = _context26.next) {
            case 0:
              requestSerializer.run(waitPromise(1000000, 'OLD')); // This will never resolve.
              requestSerializer.run(waitPromise(10, 'NEW'));
              _context26.next = 4;
              return requestSerializer.waitForLatestResult();

            case 4:
              latestResult = _context26.sent;

              expect(latestResult).toBe('NEW');

            case 6:
            case 'end':
              return _context26.stop();
          }
        }
      }, _callee26, undefined);
    })));
  });
});

function waitPromise(timeoutMs, value) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      return resolve(value);
    }, timeoutMs);
  });
}
//# sourceMappingURL=promise-spec.js.map