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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsPromise = require('../../commons-node/fsPromise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _xfetch = require('../../commons-node/xfetch');

var _xfetch2 = _interopRequireDefault(_xfetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('xfetch', function () {
  it('is the correct module', function () {
    if (typeof atom === 'undefined') {
      expect(_xfetch2.default).toBe(require('node-fetch'));
    } else {
      expect(_xfetch2.default).toBe(global.fetch);
    }
  });

  it('rejects a connection error', function () {
    waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
      var errorThrown;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              errorThrown = void 0;
              _context.prev = 1;
              _context.next = 4;
              return (0, _xfetch2.default)('http://0.0.0.0:62222');

            case 4:
              _context.next = 9;
              break;

            case 6:
              _context.prev = 6;
              _context.t0 = _context['catch'](1);

              errorThrown = _context.t0;

            case 9:
              if (typeof atom === 'undefined') {
                expect(errorThrown).toMatch(/FetchError/);
              } else {
                expect(errorThrown).toMatch(/Failed to fetch/);
              }

            case 10:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined, [[1, 6]]);
    })));
  });

  describe('with a connection', function () {
    var server = void 0;
    var port = void 0;

    beforeEach(function () {
      server = _http2.default.createServer(function (req, res) {
        _fs2.default.readFile(req.url, 'utf8', function (err, contents) {
          if (err) {
            res.statusCode = 404;
            res.end('Not found', 'utf8');
          } else {
            res.setHeader('Content-Type', 'text/plain;charset=utf8');
            res.end(contents, 'utf8');
          }
        });
      }).listen(0);
      port = server.address().port;
    });

    afterEach(function () {
      (0, _assert2.default)(server);
      server.close();
    });

    it('can do a 2xx GET request', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var realFilename, response, text, contents;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                realFilename = __filename;
                _context2.next = 3;
                return (0, _xfetch2.default)('http://0.0.0.0:' + port + realFilename);

              case 3:
                response = _context2.sent;

                expect(response.ok).toBe(true);

                _context2.next = 7;
                return response.text();

              case 7:
                text = _context2.sent;
                _context2.next = 10;
                return _fsPromise2.default.readFile(realFilename, 'utf8');

              case 10:
                contents = _context2.sent;

                expect(text).toEqual(contents);

              case 12:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, undefined);
      })));
    });

    it('can do a 404 GET request', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var nonexistingFilename, response;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // eslint-disable-next-line no-path-concat
                nonexistingFilename = __filename + 'XXX';
                _context3.next = 3;
                return (0, _xfetch2.default)('http://0.0.0.0:' + port + nonexistingFilename);

              case 3:
                response = _context3.sent;

                expect(response.ok).toBe(false);
                expect(response.status).toBe(404);
                expect(response.statusText).toBe('Not Found');

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, undefined);
      })));
    });
  });
});
//# sourceMappingURL=xfetch-spec.js.map