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
exports.asyncSome = exports.asyncObjFilter = exports.asyncFilter = exports.Deferred = exports.retryLimit = exports.triggerAfterWait = exports.RequestSerializer = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/**
 * Executes a provided callback only if a promise takes longer than
 * `milliSeconds` milliseconds to resolve.
 *
 * @param `promise` the promise to wait on.
 * @param `milliSeconds` max amount of time that `promise` can take to resolve
 * before timeoutFn is fired.
 * @param `timeoutFn` the function to execute when a promise takes longer than
 * `milliSeconds` ms to resolve.
 * @param `cleanupFn` the cleanup function to execute after the promise resolves.
 */
var triggerAfterWait = exports.triggerAfterWait = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(promise, milliSeconds, timeoutFn, cleanupFn) {
    var timeout;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            timeout = setTimeout(timeoutFn, milliSeconds);
            _context3.prev = 1;
            _context3.next = 4;
            return promise;

          case 4:
            return _context3.abrupt('return', _context3.sent);

          case 5:
            _context3.prev = 5;

            clearTimeout(timeout);
            if (cleanupFn) {
              cleanupFn();
            }
            return _context3.finish(5);

          case 9:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[1,, 5, 9]]);
  }));

  return function triggerAfterWait(_x2, _x3, _x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Call an async function repeatedly with a maximum number of trials limit,
 * until a valid result that's defined by a validation function.
 * A failed call can result from an async thrown exception, or invalid result.
 *
 * @param `retryFunction` the async logic that's wanted to be retried.
 * @param `validationFunction` the validation function that decides whether a response is valid.
 * @param `maximumTries` the number of times the `retryFunction` can fail to get a valid
 * response before the `retryLimit` is terminated reporting an error.
 * @param `retryIntervalMs` optional, the number of milliseconds to wait between trials, if wanted.
 *
 * If an exception is encountered on the last trial, the exception is thrown.
 * If no valid response is found, an exception is thrown.
 */


var retryLimit = exports.retryLimit = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(retryFunction, validationFunction, maximumTries) {
    var retryIntervalMs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var result, tries, lastError;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            result = null;
            tries = 0;
            lastError = null;
            /* eslint-disable babel/no-await-in-loop */

          case 3:
            if (!(tries === 0 || tries < maximumTries)) {
              _context4.next = 22;
              break;
            }

            _context4.prev = 4;
            _context4.next = 7;
            return retryFunction();

          case 7:
            result = _context4.sent;

            lastError = null;

            if (!validationFunction(result)) {
              _context4.next = 11;
              break;
            }

            return _context4.abrupt('return', result);

          case 11:
            _context4.next = 17;
            break;

          case 13:
            _context4.prev = 13;
            _context4.t0 = _context4['catch'](4);

            lastError = _context4.t0;
            result = null;

          case 17:
            if (!(++tries < maximumTries && retryIntervalMs !== 0)) {
              _context4.next = 20;
              break;
            }

            _context4.next = 20;
            return sleep(retryIntervalMs);

          case 20:
            _context4.next = 3;
            break;

          case 22:
            if (!(lastError != null)) {
              _context4.next = 26;
              break;
            }

            throw lastError;

          case 26:
            if (!(tries === maximumTries)) {
              _context4.next = 30;
              break;
            }

            throw new Error('No valid response found!');

          case 30:
            return _context4.abrupt('return', result);

          case 31:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[4, 13]]);
  }));

  return function retryLimit(_x6, _x7, _x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Limits async function execution parallelism to only one at a time.
 * Hence, if a call is already running, it will wait for it to finish,
 * then start the next async execution, but if called again while not finished,
 * it will return the scheduled execution promise.
 *
 * Sample Usage:
 * ```
 * let i = 1;
 * const oneExecAtATime = oneParallelAsyncCall(() => {
 *   return next Promise((resolve, reject) => {
 *     setTimeout(200, () => resolve(i++));
 *   });
 * });
 *
 * const result1Promise = oneExecAtATime(); // Start an async, and resolve to 1 in 200 ms.
 * const result2Promise = oneExecAtATime(); // Schedule the next async, and resolve to 2 in 400 ms.
 * const result3Promise = oneExecAtATime(); // Reuse scheduled promise and resolve to 2 in 400 ms.
 * ```
 */


/**
 * `filter` Promise utility that allows filtering an array with an async Promise function.
 * It's an alternative to `Array.prototype.filter` that accepts an async function.
 * You can optionally configure a limit to set the maximum number of async operations at a time.
 *
 * Previously, with the `Promise.all` primitive, we can't set the parallelism limit and we have to
 * `filter`, so, we replace the old `filter` code:
 *     var existingFilePaths = [];
 *     await Promise.all(filePaths.map(async (filePath) => {
 *       if (await fsPromise.exists(filePath)) {
 *         existingFilePaths.push(filePath);
 *       }
 *     }));
 * with limit 5 parallel filesystem operations at a time:
 *    var existingFilePaths = await asyncFilter(filePaths, fsPromise.exists, 5);
 *
 * @param array the array of items for `filter`ing.
 * @param filterFunction the async `filter` function that returns a Promise that resolves to a
 *   boolean.
 * @param limit the configurable number of parallel async operations.
 */
var asyncFilter = exports.asyncFilter = function () {
  var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(array, filterFunction, limit) {
    var _this6 = this;

    var filteredList;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            filteredList = [];
            _context8.next = 3;
            return asyncLimit(array, limit || array.length, function () {
              var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(item) {
                return regeneratorRuntime.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        _context7.next = 2;
                        return filterFunction(item);

                      case 2:
                        if (!_context7.sent) {
                          _context7.next = 4;
                          break;
                        }

                        filteredList.push(item);

                      case 4:
                      case 'end':
                        return _context7.stop();
                    }
                  }
                }, _callee7, _this6);
              }));

              return function (_x15) {
                return _ref8.apply(this, arguments);
              };
            }());

          case 3:
            return _context8.abrupt('return', filteredList);

          case 4:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function asyncFilter(_x12, _x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}();

var asyncObjFilter = exports.asyncObjFilter = function () {
  var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(obj, filterFunction, limit) {
    var _this7 = this;

    var keys, filteredObj;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            keys = Object.keys(obj);
            filteredObj = {};
            _context10.next = 4;
            return asyncLimit(keys, limit || keys.length, function () {
              var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(key) {
                var item;
                return regeneratorRuntime.wrap(function _callee9$(_context9) {
                  while (1) {
                    switch (_context9.prev = _context9.next) {
                      case 0:
                        item = obj[key];
                        _context9.next = 3;
                        return filterFunction(item, key);

                      case 3:
                        if (!_context9.sent) {
                          _context9.next = 5;
                          break;
                        }

                        filteredObj[key] = item;

                      case 5:
                      case 'end':
                        return _context9.stop();
                    }
                  }
                }, _callee9, _this7);
              }));

              return function (_x19) {
                return _ref10.apply(this, arguments);
              };
            }());

          case 4:
            return _context10.abrupt('return', filteredObj);

          case 5:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function asyncObjFilter(_x16, _x17, _x18) {
    return _ref9.apply(this, arguments);
  };
}();

/**
 * `some` Promise utility that allows `some` an array with an async Promise some function.
 * It's an alternative to `Array.prototype.some` that accepts an async some function.
 * You can optionally configure a limit to set the maximum number of async operations at a time.
 *
 * Previously, with the Promise.all primitive, we can't set the parallelism limit and we have to
 * `some`, so, we replace the old `some` code:
 *     var someFileExist = false;
 *     await Promise.all(filePaths.map(async (filePath) => {
 *       if (await fsPromise.exists(filePath)) {
 *         someFileExist = true;
 *       }
 *     }));
 * with limit 5 parallel filesystem operations at a time:
 *    var someFileExist = await asyncSome(filePaths, fsPromise.exists, 5);
 *
 * @param array the array of items for `some`ing.
 * @param someFunction the async `some` function that returns a Promise that resolves to a
 *   boolean.
 * @param limit the configurable number of parallel async operations.
 */


var asyncSome = exports.asyncSome = function () {
  var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(array, someFunction, limit) {
    var _this8 = this;

    var resolved;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            resolved = false;
            _context12.next = 3;
            return asyncLimit(array, limit || array.length, function () {
              var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(item) {
                return regeneratorRuntime.wrap(function _callee11$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        if (!resolved) {
                          _context11.next = 2;
                          break;
                        }

                        return _context11.abrupt('return');

                      case 2:
                        _context11.next = 4;
                        return someFunction(item);

                      case 4:
                        if (!_context11.sent) {
                          _context11.next = 6;
                          break;
                        }

                        resolved = true;

                      case 6:
                      case 'end':
                        return _context11.stop();
                    }
                  }
                }, _callee11, _this8);
              }));

              return function (_x23) {
                return _ref12.apply(this, arguments);
              };
            }());

          case 3:
            return _context12.abrupt('return', resolved);

          case 4:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function asyncSome(_x20, _x21, _x22) {
    return _ref11.apply(this, arguments);
  };
}();

/**
 * Check if an object is Promise by testing if it has a `then` function property.
 */


exports.sleep = sleep;
exports.serializeAsyncCall = serializeAsyncCall;
exports.asyncFind = asyncFind;
exports.denodeify = denodeify;
exports.asyncLimit = asyncLimit;
exports.isPromise = isPromise;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Allows a caller to ensure that the results it receives from consecutive
 * promise resolutions are never outdated. Usage:
 *
 * var requestSerializer = new RequestSerializer();
 *
 * // in some later loop:
 *
 * // note that you do not await the async function here -- you must pass the
 * // promise it returns to `run`
 * var result = await requestSerializer.run(someAsyncFunction())
 *
 * if (result.status === 'success') {
 *   ....
 *   result.result
 * } else if (result.status === 'outdated') {
 *   ....
 * }
 *
 * The contract is that the status is 'success' if and only if this was the most
 * recently dispatched call of 'run'. For example, if you call run(promise1) and
 * then run(promise2), and promise2 resolves first, the second callsite would
 * receive a 'success' status. If promise1 later resolved, the first callsite
 * would receive an 'outdated' status.
 */
var RequestSerializer = exports.RequestSerializer = function () {
  function RequestSerializer() {
    var _this = this;

    _classCallCheck(this, RequestSerializer);

    this._lastDispatchedOp = 0;
    this._lastFinishedOp = 0;
    this._latestPromise = new Promise(function (resolve, reject) {
      _this._waitResolve = resolve;
    });
  }

  _createClass(RequestSerializer, [{
    key: 'run',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(promise) {
        var thisOp, result;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                thisOp = this._lastDispatchedOp + 1;

                this._lastDispatchedOp = thisOp;
                this._latestPromise = promise;
                this._waitResolve();
                _context.next = 6;
                return promise;

              case 6:
                result = _context.sent;

                if (!(this._lastFinishedOp < thisOp)) {
                  _context.next = 12;
                  break;
                }

                this._lastFinishedOp = thisOp;
                return _context.abrupt('return', {
                  status: 'success',
                  result: result
                });

              case 12:
                return _context.abrupt('return', {
                  status: 'outdated'
                });

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function run(_x) {
        return _ref.apply(this, arguments);
      }

      return run;
    }()

    /**
     * Returns a Promise that resolves to the last result of `run`,
     * as soon as there are no more outstanding `run` calls.
     */

  }, {
    key: 'waitForLatestResult',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        var lastPromise, result;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                lastPromise = null;
                result = null;
                /* eslint-disable babel/no-await-in-loop */

              case 2:
                if (!(lastPromise !== this._latestPromise)) {
                  _context2.next = 9;
                  break;
                }

                lastPromise = this._latestPromise;
                // Wait for the current last know promise to resolve, or a next run have started.
                _context2.next = 6;
                return new Promise(function (resolve, reject) {
                  _this2._waitResolve = resolve;
                  _this2._latestPromise.then(resolve);
                });

              case 6:
                result = _context2.sent;
                _context2.next = 2;
                break;

              case 9:
                return _context2.abrupt('return', result);

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function waitForLatestResult() {
        return _ref2.apply(this, arguments);
      }

      return waitForLatestResult;
    }()
  }, {
    key: 'isRunInProgress',
    value: function isRunInProgress() {
      return this._lastDispatchedOp > this._lastFinishedOp;
    }
  }]);

  return RequestSerializer;
}();

/*
 * Returns a promise that will resolve after `milliSeconds` milli seconds.
 * this can be used to pause execution asynchronously.
 * e.g. await sleep(1000), pauses the async flow execution for 1 second.
 */


function sleep(milliSeconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, milliSeconds);
  });
}function serializeAsyncCall(asyncFun) {
  var scheduledCall = null;
  var pendingCall = null;
  var startAsyncCall = function startAsyncCall() {
    var resultPromise = asyncFun();
    pendingCall = resultPromise.then(function () {
      return pendingCall = null;
    }, function () {
      return pendingCall = null;
    });
    return resultPromise;
  };
  var callNext = function callNext() {
    scheduledCall = null;
    return startAsyncCall();
  };
  var scheduleNextCall = function scheduleNextCall() {
    if (scheduledCall == null) {
      (0, _assert2.default)(pendingCall, 'pendingCall must not be null!');
      scheduledCall = pendingCall.then(callNext, callNext);
    }
    return scheduledCall;
  };
  return function () {
    if (pendingCall == null) {
      return startAsyncCall();
    } else {
      return scheduleNextCall();
    }
  };
}

/**
 * Provides a promise along with methods to change its state. Our version of the non-standard
 * `Promise.defer()`.
 *
 * IMPORTANT: This should almost never be used!! Instead, use the Promise constructor. See
 *  <https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns#the-deferred-anti-pattern>
 */

var Deferred = exports.Deferred = function Deferred() {
  var _this3 = this;

  _classCallCheck(this, Deferred);

  this.promise = new Promise(function (resolve, reject) {
    _this3.resolve = resolve;
    _this3.reject = reject;
  });
};

/**
 * Returns a value derived asynchronously from an element in the items array.
 * The test function is applied sequentially to each element in items until
 * one returns a Promise that resolves to a non-null value. When this happens,
 * the Promise returned by this method will resolve to that non-null value. If
 * no such Promise is produced, then the Promise returned by this function
 * will resolve to null.
 *
 * @param items Array of elements that will be passed to test, one at a time.
 * @param test Will be called with each item and must return either:
 *     (1) A "thenable" (i.e, a Promise or promise-like object) that resolves
 *         to a derived value (that will be returned) or null.
 *     (2) null.
 *     In both cases where null is returned, test will be applied to the next
 *     item in the array.
 * @param thisArg Receiver that will be used when test is called.
 * @return Promise that resolves to an asynchronously derived value or null.
 */


function asyncFind(items, test, thisArg) {
  return new Promise(function (resolve, reject) {
    // Create a local copy of items to defend against the caller modifying the
    // array before this Promise is resolved.
    items = items.slice();
    var numItems = items.length;

    var next = function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(index) {
        var item, result;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(index === numItems)) {
                  _context5.next = 3;
                  break;
                }

                resolve(null);
                return _context5.abrupt('return');

              case 3:
                item = items[index];
                _context5.next = 6;
                return test.call(thisArg, item);

              case 6:
                result = _context5.sent;

                if (result !== null) {
                  resolve(result);
                } else {
                  next(index + 1);
                }

              case 8:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function next(_x11) {
        return _ref5.apply(this, arguments);
      };
    }();

    next(0);
  });
}

function denodeify(f) {
  return function () {
    var _this4 = this;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      function callback(error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
      f.apply(_this4, args.concat([callback]));
    });
  };
}

/**
 * A Promise utility that runs a maximum of limit async operations at a time
 * iterating over an array and returning the result of executions.
 * e.g. to limit the number of file reads to 5,
 * replace the code:
 *    var fileContents = await Promise.all(filePaths.map(fsPromise.readFile))
 * with:
 *    var fileContents = await asyncLimit(filePaths, 5, fsPromise.readFile)
 *
 * This is particulrily useful to limit IO operations to a configurable maximum (to avoid
 * blocking), while enjoying the configured level of parallelism.
 *
 * @param array the array of items for iteration.
 * @param limit the configurable number of parallel async operations.
 * @param mappingFunction the async Promise function that could return a useful result.
 */
function asyncLimit(array, limit, mappingFunction) {
  var _this5 = this;

  var result = new Array(array.length);
  var parallelPromises = 0;
  var index = 0;

  var parallelLimit = Math.min(limit, array.length) || 1;

  return new Promise(function (resolve, reject) {
    var runPromise = function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
        var i;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(index === array.length)) {
                  _context6.next = 3;
                  break;
                }

                if (parallelPromises === 0) {
                  resolve(result);
                }
                return _context6.abrupt('return');

              case 3:
                ++parallelPromises;
                i = index++;
                _context6.prev = 5;
                _context6.next = 8;
                return mappingFunction(array[i]);

              case 8:
                result[i] = _context6.sent;
                _context6.next = 14;
                break;

              case 11:
                _context6.prev = 11;
                _context6.t0 = _context6['catch'](5);

                reject(_context6.t0);

              case 14:
                --parallelPromises;
                runPromise();

              case 16:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, _this5, [[5, 11]]);
      }));

      return function runPromise() {
        return _ref6.apply(this, arguments);
      };
    }();

    while (parallelLimit--) {
      runPromise();
    }
  });
}function isPromise(object) {
  return Boolean(object) && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && typeof object.then === 'function';
}
//# sourceMappingURL=promise.js.map