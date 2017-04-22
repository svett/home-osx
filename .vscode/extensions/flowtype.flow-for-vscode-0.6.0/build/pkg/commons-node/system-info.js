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
exports.getClangVersion = exports.getFlowVersion = exports.isRunningInTest = exports.isDevelopment = exports.OS_TYPE = undefined;

var getFlowVersion = exports.getFlowVersion = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var flowPath, _ref2, stdout;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // $UPFixMe: This should use nuclide-features-config
            flowPath = global.atom && global.atom.config.get('nuclide-flow.pathToFlow') || 'flow';
            _context.next = 3;
            return (0, _process.checkOutput)(flowPath, ['--version']);

          case 3:
            _ref2 = _context.sent;
            stdout = _ref2.stdout;
            return _context.abrupt('return', stdout.trim());

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getFlowVersion() {
    return _ref.apply(this, arguments);
  };
}();

var getClangVersion = exports.getClangVersion = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    var _ref4, stdout;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _process.checkOutput)('clang', ['--version']);

          case 2:
            _ref4 = _context2.sent;
            stdout = _ref4.stdout;
            return _context2.abrupt('return', stdout.trim());

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getClangVersion() {
    return _ref3.apply(this, arguments);
  };
}();

exports.isRunningInClient = isRunningInClient;
exports.getAtomNuclideDir = getAtomNuclideDir;
exports.getAtomVersion = getAtomVersion;
exports.getNuclideVersion = getNuclideVersion;
exports.getNuclideRealDir = getNuclideRealDir;
exports.getOsType = getOsType;
exports.isRunningInWindows = isRunningInWindows;
exports.getOsVersion = getOsVersion;
exports.getRuntimePath = getRuntimePath;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _once = require('./once');

var _once2 = _interopRequireDefault(_once);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _main = require('../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

var _process = require('./process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var NUCLIDE_PACKAGE_JSON_PATH = require.resolve('../../../package.json');
var NUCLIDE_BASEDIR = _main2.default.dirname(NUCLIDE_PACKAGE_JSON_PATH);

var pkgJson = JSON.parse(_fs2.default.readFileSync(NUCLIDE_PACKAGE_JSON_PATH).toString());

var OS_TYPE = exports.OS_TYPE = {
  WIN32: 'win32',
  WIN64: 'win64',
  LINUX: 'linux',
  OSX: 'darwin'
};

// "Development" is defined as working from source - not packaged code.
// apm/npm and internal releases don't package the base `.flowconfig`, so
// we use this to figure if we're packaged or not.
var isDevelopment = exports.isDevelopment = (0, _once2.default)(function () {
  try {
    _fs2.default.statSync(_main2.default.join(NUCLIDE_BASEDIR, '.flowconfig'));
    return true;
  } catch (err) {
    return false;
  }
});

// Prior to Atom v1.7.0, `atom.inSpecMode` had a chance of performing an IPC call that could be
// expensive depending on how much work the other process was doing. Because this value will not
// change during run time, memoize the value to ensure the IPC call is performed only once.
//
// See [`getWindowLoadSettings`][1] for the sneaky getter and `remote` call that this memoization
// ensures happens only once.
//
// [1]: https://github.com/atom/atom/blob/v1.6.2/src/window-load-settings-helpers.coffee#L10-L14
var isRunningInTest = exports.isRunningInTest = (0, _once2.default)(function () {
  if (isRunningInClient()) {
    return atom.inSpecMode();
  } else {
    return process.env.NODE_ENV === 'test';
  }
});

function isRunningInClient() {
  return typeof atom !== 'undefined';
}

// This path may be a symlink.
function getAtomNuclideDir() {
  if (!isRunningInClient()) {
    throw Error('Not running in Atom.');
  }
  var nuclidePackageModule = atom.packages.getLoadedPackage('nuclide');
  (0, _assert2.default)(nuclidePackageModule);
  return nuclidePackageModule.path;
}

function getAtomVersion() {
  if (!isRunningInClient()) {
    throw Error('Not running in Atom.');
  }
  return atom.getVersion();
}

function getNuclideVersion() {
  return pkgJson.version;
}

function getNuclideRealDir() {
  return NUCLIDE_BASEDIR;
}

function getOsType() {
  return _os2.default.platform();
}

function isRunningInWindows() {
  return getOsType() === OS_TYPE.WIN32 || getOsType() === OS_TYPE.WIN64;
}

function getOsVersion() {
  return _os2.default.release();
}

function getRuntimePath() {
  // "resourcesPath" only exists in Atom. It's as close as you can get to
  // Atom's path. In the general case, it looks like this:
  // Mac: "/Applications/Atom.app/Contents/Resources"
  // Linux: "/usr/share/atom/resources"
  // Windows: "C:\\Users\\asuarez\\AppData\\Local\\atom\\app-1.6.2\\resources"
  //          "C:\Atom\resources"
  if (global.atom && typeof process.resourcesPath === 'string') {
    var resourcesPath = process.resourcesPath;
    if (_os2.default.platform() === 'darwin') {
      return resourcesPath.replace(/\/Contents\/Resources$/, '');
    } else if (_os2.default.platform() === 'linux') {
      return resourcesPath.replace(/\/resources$/, '');
    } else {
      return resourcesPath.replace(/[\\]+resources$/, '');
    }
  } else {
    return process.execPath;
  }
}
//# sourceMappingURL=system-info.js.map