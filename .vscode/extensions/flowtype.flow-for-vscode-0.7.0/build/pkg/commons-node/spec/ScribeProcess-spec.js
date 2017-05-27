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

var _fsPromise = require('../fsPromise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _ScribeProcess = require('../ScribeProcess');

var _ScribeProcess2 = _interopRequireDefault(_ScribeProcess);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('scribe_cat test suites', function () {
  var getContentOfScribeCategory = function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(category) {
      var categoryFilePath, content, result;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              categoryFilePath = _main2.default.join(tempDir, category);
              _context.next = 3;
              return _fsPromise2.default.readFile(categoryFilePath);

            case 3:
              content = _context.sent;
              result = content.toString().split('\n').filter(function (item) {
                return item.length > 0;
              });
              return _context.abrupt('return', result);

            case 6:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function getContentOfScribeCategory(_x) {
      return _ref.apply(this, arguments);
    };
  }();

  var tempDir = '';
  var scribeProcess = null;
  var originalCommand = '';

  beforeEach(function () {
    jasmine.useRealClock();
    // The script who simluate behavior of scribe_cat. Different from `scribe_cat` who save
    // data into scribe, it save data into ${process.env['SCRIBE_MOCK_PATH'] + category_name}
    // so that we could verify that the data is saved.
    // Also, if a special data "abort" (with quote) is received, it will crash itself.
    var scribeCatMockCommandPath = _main2.default.join(_main2.default.dirname(__filename), 'scripts', 'scribe_cat_mock');
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _fsPromise2.default.tempdir();

            case 2:
              tempDir = _context2.sent;

              originalCommand = _ScribeProcess.__test__.setScribeCatCommand(scribeCatMockCommandPath);
              process.env.SCRIBE_MOCK_PATH = tempDir;

            case 5:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined);
    })));
  });

  afterEach(function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!scribeProcess) {
                _context3.next = 3;
                break;
              }

              _context3.next = 3;
              return scribeProcess.dispose();

            case 3:
              _ScribeProcess.__test__.setScribeCatCommand(originalCommand);

            case 4:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, undefined);
    })));
  });

  it('Saves data to scribe category', function () {
    var localScribeProcess = scribeProcess = new _ScribeProcess2.default('test');

    var messages = ['A', 'nuclide', 'is', 'an', 'atomic', 'species', 'characterized', 'by', 'the', 'specific', 'constitution', 'of', 'its', 'nucleus.'];
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return Promise.all(messages.map(function (message) {
                return localScribeProcess.write(message);
              }));

            case 2:
              _context4.next = 4;
              return localScribeProcess.join();

            case 4:
              _context4.t0 = expect(messages);
              _context4.next = 7;
              return getContentOfScribeCategory('test');

            case 7:
              _context4.t1 = _context4.sent;

              _context4.t0.toEqual.call(_context4.t0, _context4.t1);

            case 9:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, undefined);
    })));
  });

  it('Saves data to scribe category and resume from error', function () {
    var localScribeProcess = scribeProcess = new _ScribeProcess2.default('test');

    var firstPart = 'A nuclide is an atomic species'.split(' ');
    var secondPart = 'characterized by the specific constitution of its nucleus.'.split(' ');

    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return Promise.all(firstPart.map(function (message) {
                return localScribeProcess.write(message);
              }));

            case 2:
              _context5.next = 4;
              return localScribeProcess.write(JSON.stringify('abort'));

            case 4:
              _context5.next = 6;
              return localScribeProcess.join();

            case 6:
              _context5.next = 8;
              return Promise.all(secondPart.map(function (message) {
                return localScribeProcess.write(message);
              }));

            case 8:
              _context5.next = 10;
              return localScribeProcess.join();

            case 10:
              _context5.t0 = expect(firstPart.concat(secondPart));
              _context5.next = 13;
              return getContentOfScribeCategory('test');

            case 13:
              _context5.t1 = _context5.sent;

              _context5.t0.toEqual.call(_context5.t0, _context5.t1);

            case 15:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, undefined);
    })));
  });
});
//# sourceMappingURL=ScribeProcess-spec.js.map