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
exports.findVcs = undefined;

var findVcsHelper = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(src) {
    var options, hgResult, gitResult;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = {
              cwd: _main2.default.dirname(src)
            };
            _context.next = 3;
            return (0, _process.asyncExecute)('hg', ['root'], options);

          case 3:
            hgResult = _context.sent;

            if (!(hgResult.exitCode === 0)) {
              _context.next = 6;
              break;
            }

            return _context.abrupt('return', {
              vcs: 'hg',
              root: hgResult.stdout.trim()
            });

          case 6:
            _context.next = 8;
            return (0, _process.asyncExecute)('git', ['rev-parse', '--show-toplevel'], options);

          case 8:
            gitResult = _context.sent;

            if (!(gitResult.exitCode === 0)) {
              _context.next = 11;
              break;
            }

            return _context.abrupt('return', {
              vcs: 'git',
              root: gitResult.stdout.trim()
            });

          case 11:
            throw new Error('Could not find VCS for: ' + src);

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function findVcsHelper(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * For the given source file, find the type of vcs that is managing it as well
 * as the root directory for the VCS.
 */


var findVcs = exports.findVcs = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(src) {
    var vcsInfo;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            vcsInfo = vcsInfoCache[src];

            if (!vcsInfo) {
              _context2.next = 3;
              break;
            }

            return _context2.abrupt('return', vcsInfo);

          case 3:
            _context2.next = 5;
            return findVcsHelper(src);

          case 5:
            vcsInfo = _context2.sent;

            vcsInfoCache[src] = vcsInfo;
            return _context2.abrupt('return', vcsInfo);

          case 8:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function findVcs(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var _process = require('./process');

var _main = require('../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var vcsInfoCache = {};
//# sourceMappingURL=vcs.js.map