'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _stream = require('../stream');

var _eventKit = require('event-kit');

var _rxjs = require('rxjs');

var _stream2 = require('stream');

var _stream3 = _interopRequireDefault(_stream2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var setsAreEqual = function setsAreEqual(a, b) {
  return a.size === b.size && Array.from(a).every(b.has.bind(b));
};
var diffsAreEqual = function diffsAreEqual(a, b) {
  return setsAreEqual(a.added, b.added) && setsAreEqual(a.removed, b.removed);
};
var createDisposable = function createDisposable() {
  var disposable = new _eventKit.Disposable(function () {});
  spyOn(disposable, 'dispose');
  return disposable;
};

describe('commons-node/stream', function () {

  it('splitStream', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      var input, output;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              input = ['foo\nbar', '\n', '\nba', 'z', '\nblar'];
              _context.next = 3;
              return (0, _stream.splitStream)(_rxjs.Observable.from(input)).toArray().toPromise();

            case 3:
              output = _context.sent;

              expect(output).toEqual(['foo\n', 'bar\n', '\n', 'baz\n', 'blar']);

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    })));
  });

  it('observeStream', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
      var input, stream, promise, output;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              input = ['foo\nbar', '\n', '\nba', 'z', '\nblar'];
              stream = new _stream3.default.PassThrough();
              promise = (0, _stream.observeStream)(stream).toArray().toPromise();

              input.forEach(function (value) {
                stream.write(value, 'utf8');
              });
              stream.end();
              _context2.next = 7;
              return promise;

            case 7:
              output = _context2.sent;

              expect(output.join('')).toEqual(input.join(''));

            case 9:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined);
    })));
  });

  it('observeStream - error', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
      var stream, input, output, promise, error, result;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              stream = new _stream3.default.PassThrough();
              input = ['foo\nbar', '\n', '\nba', 'z', '\nblar'];
              output = [];
              promise = new Promise(function (resolve, reject) {
                (0, _stream.observeStream)(stream).subscribe(function (v) {
                  return output.push(v);
                }, function (e) {
                  return resolve(e);
                }, function () {});
              });
              error = new Error('Had an error');


              input.forEach(function (value) {
                stream.write(value, 'utf8');
              });
              stream.emit('error', error);

              _context3.next = 9;
              return promise;

            case 9:
              result = _context3.sent;

              expect(output).toEqual(input);
              expect(result).toBe(error);

            case 12:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    })));
  });

  describe('takeWhileInclusive', function () {

    it('completes the stream when something matches the predicate', function () {
      var source = new _rxjs.Subject();
      var result = (0, _stream.takeWhileInclusive)(source, function (x) {
        return x !== 2;
      });
      var next = jasmine.createSpy();
      var complete = jasmine.createSpy();
      result.subscribe({ next: next, complete: complete });
      source.next(1);
      source.next(2);
      source.next(3);
      expect(complete).toHaveBeenCalled();
      expect(next.calls.map(function (call) {
        return call.args[0];
      })).toEqual([1, 2]);
    });
  });
});

describe('cacheWhileSubscribed', function () {
  var input = null;
  var output = null;

  function subscribeArray(arr) {
    return output.subscribe(function (x) {
      return arr.push(x);
    });
  }
  beforeEach(function () {
    input = new _rxjs.Subject();
    output = (0, _stream.cacheWhileSubscribed)(input);
  });

  it('should provide cached values to late subscribers', function () {
    var arr1 = [];
    var arr2 = [];

    input.next(0);
    var sub1 = subscribeArray(arr1);
    input.next(1);
    input.next(2);
    var sub2 = subscribeArray(arr2);

    sub1.unsubscribe();
    sub2.unsubscribe();
    expect(arr1).toEqual([1, 2]);
    expect(arr2).toEqual([2]);
  });

  it('should not store stale events when everyone is unsubscribed', function () {
    var arr1 = [];
    var arr2 = [];

    input.next(0);
    var sub1 = subscribeArray(arr1);
    input.next(1);
    sub1.unsubscribe();

    input.next(2);

    var sub2 = subscribeArray(arr2);
    input.next(3);
    sub2.unsubscribe();

    expect(arr1).toEqual([1]);
    expect(arr2).toEqual([3]);
  });
});

describe('diffSets', function () {

  it('emits a diff for the first item', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
      var source, diffsPromise, diffs;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              source = new _rxjs.Subject();
              diffsPromise = (0, _stream.diffSets)(source).toArray().toPromise();

              source.next(new Set([1, 2, 3]));
              source.complete();
              _context4.next = 6;
              return diffsPromise;

            case 6:
              diffs = _context4.sent;

              expect(diffs.length).toBe(1);
              expect(diffsAreEqual(diffs[0], {
                added: new Set([1, 2, 3]),
                removed: new Set()
              })).toBe(true);

            case 9:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    })));
  });

  it('correctly identifies removed items', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
      var source, diffsPromise, diffs;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              source = new _rxjs.Subject();
              diffsPromise = (0, _stream.diffSets)(source).toArray().toPromise();

              source.next(new Set([1, 2, 3]));
              source.next(new Set([1, 2]));
              source.complete();
              _context5.next = 7;
              return diffsPromise;

            case 7:
              diffs = _context5.sent;

              expect(setsAreEqual(diffs[1].removed, new Set([3]))).toBe(true);

            case 9:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined);
    })));
  });

  it('correctly identifies added items', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
      var source, diffsPromise, diffs;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              source = new _rxjs.Subject();
              diffsPromise = (0, _stream.diffSets)(source).toArray().toPromise();

              source.next(new Set([1, 2]));
              source.next(new Set([1, 2, 3]));
              source.complete();
              _context6.next = 7;
              return diffsPromise;

            case 7:
              diffs = _context6.sent;

              expect(setsAreEqual(diffs[1].added, new Set([3]))).toBe(true);

            case 9:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, undefined);
    })));
  });

  it("doesn't emit a diff when nothing changes", function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
      var source, diffsPromise, diffs;
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              source = new _rxjs.Subject();
              diffsPromise = (0, _stream.diffSets)(source).toArray().toPromise();

              source.next(new Set([1, 2, 3]));
              source.next(new Set([1, 2, 3]));
              source.complete();
              _context7.next = 7;
              return diffsPromise;

            case 7:
              diffs = _context7.sent;

              // Make sure we only get one diff (from the implicit initial empty set).
              expect(diffs.length).toBe(1);

            case 9:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, undefined);
    })));
  });
});

describe('reconcileSetDiffs', function () {

  it("calls the add action for each item that's added", function () {
    var diffs = new _rxjs.Subject();
    var addAction = jasmine.createSpy().andReturn(new _eventKit.Disposable(function () {}));
    (0, _stream.reconcileSetDiffs)(diffs, addAction);
    diffs.next({
      added: new Set(['a', 'b']),
      removed: new Set()
    });
    expect(addAction.calls.map(function (call) {
      return call.args[0];
    })).toEqual(['a', 'b']);
  });

  it("disposes for each item that's removed", function () {
    var diffs = new _rxjs.Subject();
    var disposables = {
      a: createDisposable(),
      b: createDisposable()
    };
    var addAction = function addAction(item) {
      return disposables[item];
    };
    (0, _stream.reconcileSetDiffs)(diffs, addAction);
    diffs.next({
      added: new Set(['a', 'b']),
      removed: new Set()
    });
    diffs.next({
      added: new Set(),
      removed: new Set(['a', 'b'])
    });
    expect(disposables.a.dispose).toHaveBeenCalled();
    expect(disposables.b.dispose).toHaveBeenCalled();
  });

  it('disposes for all items when disposed', function () {
    var diffs = new _rxjs.Subject();
    var disposables = {
      a: createDisposable(),
      b: createDisposable()
    };
    var addAction = function addAction(item) {
      return disposables[item];
    };
    var reconciliationDisposable = (0, _stream.reconcileSetDiffs)(diffs, addAction);
    diffs.next({
      added: new Set(['a', 'b']),
      removed: new Set()
    });
    reconciliationDisposable.dispose();
    expect(disposables.a.dispose).toHaveBeenCalled();
    expect(disposables.b.dispose).toHaveBeenCalled();
  });
});

describe('toggle', function () {
  var toggler = null;
  var source = null;
  var output = null;
  var outputArray = null;

  beforeEach(function () {
    toggler = new _rxjs.Subject();
    // Deferred so individual 'it' blocks can set the source on the fly.
    output = (0, _stream.toggle)(_rxjs.Observable.defer(function () {
      return source;
    }), toggler);
  });

  describe('with a standard source', function () {
    var realSource = null;

    beforeEach(function () {
      source = realSource = new _rxjs.Subject();
      outputArray = [];
      output.subscribe(function (x) {
        return outputArray.push(x);
      });
    });

    it("should not emit anything before the toggler is set to 'true'", function () {
      realSource.next(5);
      expect(outputArray).toEqual([]);
    });

    it("should start emitting events when the toggler is set to 'true'", function () {
      toggler.next(true);
      realSource.next(5);
      expect(outputArray).toEqual([5]);
    });

    it("should stop emitting events when the toggler is set to 'false'", function () {
      toggler.next(true);
      toggler.next(false);
      realSource.next(4);
      expect(outputArray).toEqual([]);
    });
  });

  // These ones are set apart from the rest because we want a cold observable to explicitly test
  // that toggling off unsubscribes and then resubscribes.
  describe('subscription behavior', function () {
    beforeEach(function () {
      source = _rxjs.Observable.of(1, 2, 3);
      outputArray = [];
      output.subscribe(function (x) {
        return outputArray.push(x);
      });
    });

    it('should unsubscribe and resusbscribe when toggled off and back on', function () {
      expect(outputArray).toEqual([]);

      toggler.next(true);

      expect(outputArray).toEqual([1, 2, 3]);

      toggler.next(false);
      toggler.next(true);

      expect(outputArray).toEqual([1, 2, 3, 1, 2, 3]);
    });

    it('should not re-subscribe on duplicate toggler values', function () {
      toggler.next(true);
      toggler.next(true);
      expect(outputArray).toEqual([1, 2, 3]);
    });
  });
});
//# sourceMappingURL=stream-spec.js.map