'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _FlowVersion = require('../lib/FlowVersion');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('FlowVersion', function () {
  var flowVersion = null;
  var getVersionSpy = null;
  var fakeVersion = null;

  beforeEach(function () {
    getVersionSpy = jasmine.createSpy().andCallFake(function () {
      return Promise.resolve(fakeVersion);
    });
    flowVersion = new _FlowVersion.FlowVersion(getVersionSpy);
  });

  it('should return the version the first time', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              fakeVersion = 'foo';
              _context.next = 3;
              return flowVersion.getVersion();

            case 3:
              _context.t0 = _context.sent;
              expect(_context.t0).toEqual('foo');

              expect(getVersionSpy.callCount).toEqual(1);

            case 6:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    })));
  });

  it('should cache versions between calls', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              fakeVersion = 'foo';
              _context2.next = 3;
              return flowVersion.getVersion();

            case 3:
              fakeVersion = 'bar';
              _context2.next = 6;
              return flowVersion.getVersion();

            case 6:
              _context2.t0 = _context2.sent;
              expect(_context2.t0).toEqual('foo');

              expect(getVersionSpy.callCount).toEqual(1);

            case 9:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined);
    })));
  });

  it('should properly invalidate the cached result when invalidate is called', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              fakeVersion = 'foo';
              _context3.next = 3;
              return flowVersion.getVersion();

            case 3:
              fakeVersion = 'bar';
              flowVersion.invalidateVersion();
              _context3.next = 7;
              return flowVersion.getVersion();

            case 7:
              _context3.t0 = _context3.sent;
              expect(_context3.t0).toEqual('bar');

              expect(getVersionSpy.callCount).toEqual(2);

            case 10:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    })));
  });

  it('should properly invalidate the cached result when enough time has elapsed', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              fakeVersion = 'foo';
              _context4.next = 3;
              return flowVersion.getVersion();

            case 3:
              fakeVersion = 'bar';
              window.advanceClock(11 * 60 * 1000);
              _context4.next = 7;
              return flowVersion.getVersion();

            case 7:
              _context4.t0 = _context4.sent;
              expect(_context4.t0).toEqual('bar');

              expect(getVersionSpy.callCount).toEqual(2);

            case 10:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    })));
  });
});
//# sourceMappingURL=FlowVersion-spec.js.map