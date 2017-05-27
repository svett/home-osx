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

var _events = require('events');

var _event = require('../event');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('attachEvent', function () {

  describe('the returned disposable', function () {

    it("doesn't remove other listeners when disposed multiple times", function () {
      var foo = jasmine.createSpy('foo');
      var emitter = new _events.EventEmitter();
      var d1 = (0, _event.attachEvent)(emitter, 'event', foo);
      (0, _event.attachEvent)(emitter, 'event', foo);
      d1.dispose();
      d1.dispose();
      emitter.emit('event');
      expect(foo).toHaveBeenCalled();
    });
  });
});

describe('observableFromSubscribeFunction', function () {
  var callback = void 0;
  var disposable = void 0;

  // The subscribe function will put the given callback and the returned disposable in the variables
  // above for inspection.
  var subscribeFunction = function subscribeFunction(fn) {
    callback = fn;
    disposable = {
      dispose: function dispose() {
        callback = null;
      }
    };
    spyOn(disposable, 'dispose').andCallThrough();
    return disposable;
  };

  beforeEach(function () {
    callback = null;
    disposable = null;
  });

  it('should not call the subscription function until the Observable is subscribed to', function () {
    var observable = (0, _event.observableFromSubscribeFunction)(subscribeFunction);
    expect(callback).toBeNull();
    observable.subscribe(function () {});
    expect(callback).not.toBeNull();
  });

  it('should send events to the observable stream', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      var result;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              result = (0, _event.observableFromSubscribeFunction)(subscribeFunction).take(2).toArray().toPromise();

              (0, _assert2.default)(callback != null);
              callback(1);
              callback(2);
              _context.next = 6;
              return result;

            case 6:
              _context.t0 = _context.sent;
              _context.t1 = [1, 2];
              expect(_context.t0).toEqual(_context.t1);

            case 9:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    })));
  });

  it('should properly unsubscribe and resubscribe', function () {
    var observable = (0, _event.observableFromSubscribeFunction)(subscribeFunction);
    var subscription = observable.subscribe(function () {});
    expect(callback).not.toBeNull();

    (0, _assert2.default)(disposable != null);
    expect(disposable.dispose).not.toHaveBeenCalled();
    subscription.unsubscribe();
    expect(disposable.dispose).toHaveBeenCalled();

    expect(callback).toBeNull();

    subscription = observable.subscribe(function () {});

    expect(callback).not.toBeNull();

    expect(disposable.dispose).not.toHaveBeenCalled();
    subscription.unsubscribe();
    expect(disposable.dispose).toHaveBeenCalled();
  });
});
//# sourceMappingURL=event-spec.js.map