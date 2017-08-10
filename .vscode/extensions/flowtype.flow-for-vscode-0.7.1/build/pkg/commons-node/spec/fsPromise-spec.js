'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _main = require('../../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

var _temp = require('temp');

var _temp2 = _interopRequireDefault(_temp);

var _fsPromise = require('../fsPromise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

_temp2.default.track();

describe('fsPromise test suite', function () {

  describe('findNearestFile()', function () {
    var dirPath = void 0;
    var nestedDirPath = void 0;
    var fileName = void 0;
    var filePath = void 0;

    beforeEach(function () {
      dirPath = _temp2.default.mkdirSync('nearest_test');
      nestedDirPath = _main2.default.join(dirPath, 'nested_dir');
      _fs2.default.mkdirSync(nestedDirPath);
      fileName = '.some_file';
      filePath = _main2.default.join(dirPath, fileName);
      _fs2.default.writeFileSync(filePath, 'just a file');
    });

    it('find the file if given the exact directory', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var foundPath;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _fsPromise2.default.findNearestFile(fileName, dirPath);

              case 2:
                foundPath = _context.sent;

                expect(foundPath).toBe(dirPath);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      })));
    });

    it('find the file if given a nested directory', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var foundPath;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return _fsPromise2.default.findNearestFile(fileName, nestedDirPath);

              case 2:
                foundPath = _context2.sent;

                expect(foundPath).toBe(dirPath);

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, undefined);
      })));
    });

    it('does not find the file if not existing', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var foundPath;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return _fsPromise2.default.findNearestFile('non-existent.txt', nestedDirPath);

              case 2:
                foundPath = _context3.sent;

                expect(foundPath).toBe(null);

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, undefined);
      })));
    });
  });

  describe('findFurthestFile()', function () {
    var dirPath = void 0;
    var fileName = void 0;

    beforeEach(function () {
      dirPath = _temp2.default.mkdirSync('furthest_test');
      fileName = '.some_file';

      var currPath = dirPath;
      for (var i = 0; i < 5; i++) {
        currPath = _main2.default.join(currPath, '' + i);
        _fs2.default.mkdirSync(currPath);
        // Skip one file to test consecutive vs non-consecutive.
        if (i !== 2) {
          var filePath = _main2.default.join(currPath, fileName);
          _fs2.default.writeFileSync(filePath, 'just a file');
        }
      }
    });

    it('find the file if given the exact directory', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var expectedPath, foundPath;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                expectedPath = _main2.default.join(dirPath, '0');
                _context4.next = 3;
                return _fsPromise2.default.findFurthestFile(fileName, expectedPath);

              case 3:
                foundPath = _context4.sent;

                expect(foundPath).toBe(expectedPath);

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, undefined);
      })));
    });

    it('finds the furthest file if given a nested directory', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
        var expectedPath, startPath, foundPath;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                expectedPath = _main2.default.join(dirPath, '0');
                startPath = _main2.default.join(dirPath, '0/1/2/3/4');
                _context5.next = 4;
                return _fsPromise2.default.findFurthestFile(fileName, startPath);

              case 4:
                foundPath = _context5.sent;

                expect(foundPath).toBe(expectedPath);

              case 6:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, undefined);
      })));
    });

    it('terminates search as soon as file is not found if given the stopOnMissing flag', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
        var expectedPath, startPath, foundPath;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                expectedPath = _main2.default.join(dirPath, '0/1/2/3');
                startPath = _main2.default.join(dirPath, '0/1/2/3/4');
                _context6.next = 4;
                return _fsPromise2.default.findFurthestFile(fileName, startPath, true /* stopOnMissing */
                );

              case 4:
                foundPath = _context6.sent;

                expect(foundPath).toBe(expectedPath);

              case 6:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, undefined);
      })));
    });

    it('does not find the file if not existing', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
        var startPath, foundPath;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                startPath = _main2.default.join(dirPath, '0/1/2/3/4');
                _context7.next = 3;
                return _fsPromise2.default.findFurthestFile('non-existent.txt', startPath);

              case 3:
                foundPath = _context7.sent;

                expect(foundPath).toBe(null);

              case 5:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, undefined);
      })));
    });
  });

  describe('getCommonAncestorDirectory', function () {
    it('gets the parent directory', function () {
      expect(_fsPromise2.default.getCommonAncestorDirectory(['/foo/bar.txt', '/foo/baz/lol.txt'])).toBe('/foo');
      expect(_fsPromise2.default.getCommonAncestorDirectory(['/foo/bar/abc/def/abc.txt', '/foo/bar/lol.txt'])).toBe('/foo/bar');
    });
  });
});
//# sourceMappingURL=fsPromise-spec.js.map