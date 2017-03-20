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

/**
 * Searches upward through the filesystem from pathToDirectory to find a file with
 * fileName.
 * @param fileName The name of the file to find.
 * @param pathToDirectory Where to begin the search. Must be a path to a directory,
 *   not a file.
 * @return directory that contains the nearest file or null.
 */
var findNearestFile = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(fileName, pathToDirectory) {
    var currentPath, fileToFind, hasFile;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // TODO(5586355): If this becomes a bottleneck, we should consider memoizing
            // this function. The downside would be that if someone added a closer file
            // with fileName to pathToFile (or deleted the one that was cached), then we
            // would have a bug. This would probably be pretty rare, though.
            currentPath = _main2.default.resolve(pathToDirectory);

          case 1:
            // eslint-disable-line no-constant-condition
            fileToFind = _main2.default.join(currentPath, fileName);
            _context.next = 4;
            return exists(fileToFind);

          case 4:
            hasFile = _context.sent;

            if (!hasFile) {
              _context.next = 7;
              break;
            }

            return _context.abrupt('return', currentPath);

          case 7:
            if (!_main2.default.isRoot(currentPath)) {
              _context.next = 9;
              break;
            }

            return _context.abrupt('return', null);

          case 9:
            currentPath = _main2.default.dirname(currentPath);

          case 10:
            if (true) {
              _context.next = 1;
              break;
            }

          case 11:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function findNearestFile(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Searches upward through the filesystem from pathToDirectory to find the furthest
 * file with fileName.
 * @param fileName The name of the file to find.
 * @param pathToDirectory Where to begin the search. Must be a path to a directory,
 *   not a file.
 * @param stopOnMissing Stop searching when we reach a directory without fileName.
 * @return directory that contains the furthest file or null.
 */


var findFurthestFile = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(fileName, pathToDirectory) {
    var stopOnMissing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var currentPath, result, fileToFind, hasFile;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            currentPath = _main2.default.resolve(pathToDirectory);
            result = null;

          case 2:
            // eslint-disable-line no-constant-condition
            fileToFind = _main2.default.join(currentPath, fileName);
            _context2.next = 5;
            return exists(fileToFind);

          case 5:
            hasFile = _context2.sent;

            if (!(!hasFile && stopOnMissing || _main2.default.isRoot(currentPath))) {
              _context2.next = 10;
              break;
            }

            return _context2.abrupt('return', result);

          case 10:
            if (hasFile) {
              result = currentPath;
            }

          case 11:
            currentPath = _main2.default.dirname(currentPath);

          case 12:
            if (true) {
              _context2.next = 2;
              break;
            }

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function findFurthestFile(_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Runs the equivalent of `mkdir -p` with the given path.
 *
 * Like most implementations of mkdirp, if it fails, it is possible that
 * directories were created for some prefix of the given path.
 * @return true if the path was created; false if it already existed.
 */
var mkdirp = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(filePath) {
    var isExistingDirectory;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return exists(filePath);

          case 2:
            isExistingDirectory = _context3.sent;

            if (!isExistingDirectory) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt('return', false);

          case 7:
            return _context3.abrupt('return', new Promise(function (resolve, reject) {
              (0, _mkdirp2.default)(filePath, function (err) {
                if (err) {
                  reject(err);
                } else {
                  resolve(true);
                }
              });
            }));

          case 8:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function mkdirp(_x8) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Removes directories even if they are non-empty. Does not fail if the directory doesn't exist.
 */


var rmdir = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(filePath) {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt('return', new Promise(function (resolve, reject) {
              (0, _rimraf2.default)(filePath, function (err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }));

          case 1:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function rmdir(_x9) {
    return _ref4.apply(this, arguments);
  };
}();

/** @return true only if we are sure directoryPath is on NFS. */


var isNfs = function () {
  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(entityPath) {
    var _ref6, stdout, exitCode;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(process.platform === 'linux' || process.platform === 'darwin')) {
              _context5.next = 13;
              break;
            }

            _context5.next = 3;
            return (0, _process.asyncExecute)('stat', ['-f', '-L', '-c', '%T', entityPath]);

          case 3:
            _ref6 = _context5.sent;
            stdout = _ref6.stdout;
            exitCode = _ref6.exitCode;

            if (!(exitCode === 0)) {
              _context5.next = 10;
              break;
            }

            return _context5.abrupt('return', stdout.trim() === 'nfs');

          case 10:
            return _context5.abrupt('return', false);

          case 11:
            _context5.next = 14;
            break;

          case 13:
            return _context5.abrupt('return', false);

          case 14:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function isNfs(_x10) {
    return _ref5.apply(this, arguments);
  };
}();

/**
 * Takes a method from Node's fs module and returns a "denodeified" equivalent, i.e., an adapter
 * with the same functionality, but returns a Promise rather than taking a callback. This isn't
 * quite as efficient as Q's implementation of denodeify, but it's considerably less code.
 */


var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _main = require('../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _temp = require('temp');

var _temp2 = _interopRequireDefault(_temp);

var _process = require('./process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * Create a temp directory with given prefix. The caller is responsible for cleaning up the
 *   drectory.
 * @param prefix optinal prefix for the temp directory name.
 * @return path to a temporary directory.
 */
function tempdir() {
  var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  return new Promise(function (resolve, reject) {
    _temp2.default.mkdir(prefix, function (err, dirPath) {
      if (err) {
        reject(err);
      } else {
        resolve(dirPath);
      }
    });
  });
}

/**
 * @return path to a temporary file. The caller is responsible for cleaning up
 *     the file.
 */
function tempfile(options) {
  return new Promise(function (resolve, reject) {
    _temp2.default.open(options, function (err, info) {
      if (err) {
        reject(err);
      } else {
        _fsPlus2.default.close(info.fd, function (closeErr) {
          if (closeErr) {
            reject(closeErr);
          } else {
            resolve(info.path);
          }
        });
      }
    });
  });
}

function getCommonAncestorDirectory(filePaths) {
  var commonDirectoryPath = _main2.default.dirname(filePaths[0]);
  while (filePaths.some(function (filePath) {
    return !filePath.startsWith(commonDirectoryPath);
  })) {
    commonDirectoryPath = _main2.default.dirname(commonDirectoryPath);
  }
  return commonDirectoryPath;
}

function exists(filePath) {
  return new Promise(function (resolve, reject) {
    _fsPlus2.default.exists(filePath, resolve);
  });
}function _denodeifyFsMethod(methodName) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var method = _fsPlus2.default[methodName];
    return new Promise(function (resolve, reject) {
      method.apply(_fsPlus2.default, args.concat([function (err, result) {
        return err ? reject(err) : resolve(result);
      }]));
    });
  };
}

exports.default = {
  tempdir: tempdir,
  tempfile: tempfile,
  findNearestFile: findNearestFile,
  findFurthestFile: findFurthestFile,
  getCommonAncestorDirectory: getCommonAncestorDirectory,
  exists: exists,
  mkdirp: mkdirp,
  rmdir: rmdir,
  isNfs: isNfs,

  copy: _denodeifyFsMethod('copy'),
  chmod: _denodeifyFsMethod('chmod'),
  lstat: _denodeifyFsMethod('lstat'),
  mkdir: _denodeifyFsMethod('mkdir'),
  readdir: _denodeifyFsMethod('readdir'),
  readFile: _denodeifyFsMethod('readFile'),
  readlink: _denodeifyFsMethod('readlink'),
  realpath: _denodeifyFsMethod('realpath'),
  rename: _denodeifyFsMethod('rename'),
  move: _denodeifyFsMethod('move'),
  stat: _denodeifyFsMethod('stat'),
  symlink: _denodeifyFsMethod('symlink'),
  unlink: _denodeifyFsMethod('unlink'),
  writeFile: _denodeifyFsMethod('writeFile')
};
//# sourceMappingURL=fsPromise.js.map