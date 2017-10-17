'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _promiseExecutors = require('../promise-executors');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('PromiseQueue', function () {

  // Workarounds to enable setTimeout, as suggested by:
  // https://discuss.atom.io/t/solved-settimeout-not-working-firing-in-specs-tests/11427/17
  beforeEach(function () {
    jasmine.useRealClock();
  });

  it('Run three async operations serially and make sure they do not overlap.', function () {
    var queue = new _promiseExecutors.PromiseQueue();
    var res1Start = 0;
    var res1End = 0;
    var res2Start = 0;
    var res2End = 0;
    var res3Start = 0;
    var res3End = 0;

    runs(function () {
      queue.submit(function (resolve, reject) {
        res1Start = Date.now();
        setTimeout(function () {
          resolve(res1End = Date.now());
        }, 100);
      });
      queue.submit(function (resolve, reject) {
        res2Start = Date.now();
        setTimeout(function () {
          resolve(res2End = Date.now());
        }, 200);
      });
      queue.submit(function (resolve, reject) {
        res3Start = Date.now();
        setTimeout(function () {
          resolve(res3End = Date.now());
        }, 300);
      });
    });

    waitsFor(function () {
      return res1End && res2End && res3End;
    }, 700);

    runs(function () {
      // Make sure that none of the executors overlapped.
      expect(res1Start).not.toBeGreaterThan(res1End);
      expect(res1End).not.toBeGreaterThan(res2Start);
      expect(res2Start).not.toBeGreaterThan(res2End);
      expect(res2End).not.toBeGreaterThan(res3Start);
      expect(res3Start).not.toBeGreaterThan(res3End);
    });
  });
});

describe('PromisePool', function () {
  beforeEach(function () {
    jasmine.useRealClock();
  });

  it('Run async operations in parallel and do not exceed pool size.', function () {
    var poolSize = 3;
    var numDelayedExecutors = 30;
    var delayMs = 10;
    var numRunning = 0;

    var executors = [];
    for (var i = 0; i < numDelayedExecutors; i++) {
      executors.push(function (resolve, reject) {
        numRunning++;
        expect(numRunning <= poolSize).toBe(true);
        setTimeout(function () {
          expect(numRunning <= poolSize).toBe(true);
          numRunning--;
          resolve();
        }, delayMs);
      });
    }

    var queue = new _promiseExecutors.PromisePool(poolSize);

    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      var start, end;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              start = Date.now();
              _context.next = 3;
              return Promise.all(executors.map(function (executor) {
                return queue.submit(executor);
              }));

            case 3:
              end = Date.now();

              expect(end - start).toBeLessThan(numDelayedExecutors * delayMs / (poolSize - 1));

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    })));
  });
});
//# sourceMappingURL=promise-executors-spec.js.map