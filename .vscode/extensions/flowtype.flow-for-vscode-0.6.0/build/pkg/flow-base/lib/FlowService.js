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
exports.flowGetCoverage = exports.flowGetType = undefined;

var flowGetType = exports.flowGetType = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(file, currentContents, line, column, includeRawType) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', getRootContainer().runWithRoot(file, function (root) {
              return root.flowGetType(file, currentContents, line, column, includeRawType);
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function flowGetType(_x, _x2, _x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  };
}();

var flowGetCoverage = exports.flowGetCoverage = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(file) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', getRootContainer().runWithRoot(file, function (root) {
              return root.flowGetCoverage(file);
            }));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function flowGetCoverage(_x6) {
    return _ref2.apply(this, arguments);
  };
}();

exports.dispose = dispose;
exports.getServerStatusUpdates = getServerStatusUpdates;
exports.flowFindDefinition = flowFindDefinition;
exports.flowFindDiagnostics = flowFindDiagnostics;
exports.flowGetAutocompleteSuggestions = flowGetAutocompleteSuggestions;
exports.flowGetOutline = flowGetOutline;
exports.allowServerRestart = allowServerRestart;

var _FlowRoot = require('./FlowRoot');

var _FlowRootContainer = require('./FlowRootContainer');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

// The origin of this type is at nuclide-tokenized-text/lib/main.js
// When updating update both locations!


// The origin of this type is at nuclide-tokenized-text/lib/main.js
// When updating update both locations!


/*
 * Each error or warning can consist of any number of different messages from
 * Flow to help explain the problem and point to different locations that may be
 * of interest.
 */


// The origin of this type is at nuclide-tokenized-text/lib/main.js
// When updating update both locations!


// If types are added here, make sure to also add them to FlowConstants.js. This needs to be the
// canonical type definition so that we can use these in the service framework.


// Diagnostic information, returned from findDiagnostics.


var rootContainer = null;

function getRootContainer() {
  if (rootContainer == null) {
    rootContainer = new _FlowRootContainer.FlowRootContainer();
  }
  return rootContainer;
}

function dispose() {
  if (rootContainer != null) {
    rootContainer.dispose();
    rootContainer = null;
  }
}

function getServerStatusUpdates() {
  return getRootContainer().getServerStatusUpdates();
}

function flowFindDefinition(file, currentContents, line, column) {
  return getRootContainer().runWithRoot(file, function (root) {
    return root.flowFindDefinition(file, currentContents, line, column);
  });
}

function flowFindDiagnostics(file, currentContents) {
  return getRootContainer().runWithRoot(file, function (root) {
    return root.flowFindDiagnostics(file, currentContents);
  });
}

function flowGetAutocompleteSuggestions(file, currentContents, line, column, prefix, activatedManually) {
  return getRootContainer().runWithRoot(file, function (root) {
    return root.flowGetAutocompleteSuggestions(file, currentContents, line, column, prefix, activatedManually);
  });
}

function flowGetOutline(currentContents) {
  return _FlowRoot.FlowRoot.flowGetOutline(currentContents);
}

function allowServerRestart() {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = getRootContainer().getAllRoots()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var root = _step.value;

      root.allowServerRestart();
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}
//# sourceMappingURL=FlowService.js.map