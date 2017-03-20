'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var isFlowInstalled = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var flowPath;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return getPathToFlow();

          case 2:
            flowPath = _context.sent;

            if (flowPathCache.has(flowPath)) {
              _context.next = 10;
              break;
            }

            _context.t0 = flowPathCache;
            _context.t1 = flowPath;
            _context.next = 8;
            return canFindFlow(flowPath);

          case 8:
            _context.t2 = _context.sent;

            _context.t0.set.call(_context.t0, _context.t1, _context.t2);

          case 10:
            return _context.abrupt('return', flowPathCache.get(flowPath));

          case 11:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function isFlowInstalled() {
    return _ref3.apply(this, arguments);
  };
}();

var canFindFlow = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(flowPath) {
    var _buildSearchFlowComma, _command, _args2;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            // https://github.com/facebook/nuclide/issues/561
            _buildSearchFlowComma = buildSearchFlowCommand(flowPath), _command = _buildSearchFlowComma.command, _args2 = _buildSearchFlowComma.args;
            _context2.next = 4;
            return (0, _process.checkOutput)(_command, _args2);

          case 4:
            return _context2.abrupt('return', true);

          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', false);

          case 10:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 7]]);
  }));

  return function canFindFlow(_x) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * @return The path to Flow on the user's machine. First using the the user's 
 *   config, then looking into the node_modules for the project.
 * 
 *   It is cached, so it is expected that changing the users settings will 
 *   trigger a call to `clearWorkspaceCaches`.
 */

var getPathToFlow = function () {
  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    var config, shouldUseNodeModule, userPath;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (global.cachedPathToFlowBin) {
              _context3.next = 21;
              break;
            }

            config = global.vscode.workspace.getConfiguration('flow');
            shouldUseNodeModule = config.get('useNPMPackagedFlow');
            userPath = config.get('pathToFlow');
            _context3.t0 = shouldUseNodeModule;

            if (!_context3.t0) {
              _context3.next = 9;
              break;
            }

            _context3.next = 8;
            return canFindFlow(nodeModuleFlowLocation());

          case 8:
            _context3.t0 = _context3.sent;

          case 9:
            if (!_context3.t0) {
              _context3.next = 13;
              break;
            }

            global.cachedPathToFlowBin = nodeModuleFlowLocation();
            _context3.next = 20;
            break;

          case 13:
            _context3.next = 15;
            return canFindFlow(userPath);

          case 15:
            if (!_context3.sent) {
              _context3.next = 19;
              break;
            }

            global.cachedPathToFlowBin = userPath;
            _context3.next = 20;
            break;

          case 19:
            global.cachedPathToFlowBin = "flow";

          case 20:

            logger.info("Path to Flow: " + global.cachedPathToFlowBin);

          case 21:
            return _context3.abrupt('return', global.cachedPathToFlowBin);

          case 22:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getPathToFlow() {
    return _ref5.apply(this, arguments);
  };
}();

/**
 * @return The potential path to Flow on the user's machine if they are using NPM/Yarn to manage
 * their installs of flow.
 */


var _main = require('../../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

var _process = require('../../commons-node/process');

var _fsPromise = require('../../commons-node/fsPromise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _main3 = require('../../nuclide-logging/lib/main');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var logger = (0, _main3.getLogger)();

var flowConfigDirCache = (0, _lruCache2.default)({
  max: 10,
  maxAge: 1000 * 30 });
var flowPathCache = (0, _lruCache2.default)({
  max: 10,
  maxAge: 1000 * 30 });

function insertAutocompleteToken(contents, line, col) {
  var lines = contents.split('\n');
  var theLine = lines[line];
  theLine = theLine.substring(0, col) + 'AUTO332' + theLine.substring(col);
  lines[line] = theLine;
  return lines.join('\n');
}

/**
 * Takes an autocomplete item from Flow and returns a valid autocomplete-plus
 * response, as documented here:
 * https://github.com/atom/autocomplete-plus/wiki/Provider-API
 */
function processAutocompleteItem(replacementPrefix, flowItem) {
  // Truncate long types for readability
  var description = flowItem.type.length < 80 ? flowItem.type : flowItem.type.substring(0, 80) + ' ...';
  var result = {
    description: description,
    displayText: flowItem.name,
    replacementPrefix: replacementPrefix
  };
  var funcDetails = flowItem.func_details;
  if (funcDetails) {
    // The parameters in human-readable form for use on the right label.
    var rightParamStrings = funcDetails.params.map(function (param) {
      return param.name + ': ' + param.type;
    });
    var snippetString = getSnippetString(funcDetails.params.map(function (param) {
      return param.name;
    }));
    result = _extends({}, result, {
      leftLabel: funcDetails.return_type,
      rightLabel: '(' + rightParamStrings.join(', ') + ')',
      snippet: flowItem.name + '(' + snippetString + ')',
      type: 'function'
    });
  } else {
    result = _extends({}, result, {
      rightLabel: flowItem.type,
      text: flowItem.name
    });
  }
  return result;
}

function getSnippetString(paramNames) {
  var groupedParams = groupParamNames(paramNames);
  // The parameters turned into snippet strings.
  var snippetParamStrings = groupedParams.map(function (params) {
    return params.join(', ');
  }).map(function (param, i) {
    return '${' + (i + 1) + ':' + param + '}';
  });
  return snippetParamStrings.join(', ');
}

/**
 * Group the parameter names so that all of the trailing optional parameters are together with the
 * last non-optional parameter. That makes it easy to ignore the optional parameters, since they
 * will be selected along with the last non-optional parameter and you can just type to overwrite
 * them.
 */
function groupParamNames(paramNames) {
  // Split the parameters into two groups -- all of the trailing optional paramaters, and the rest
  // of the parameters. Trailing optional means all optional parameters that have only optional
  var _paramNames$reduceRig = paramNames.reduceRight(function (_ref, param) {
    var _ref2 = _slicedToArray(_ref, 2),
        ordinary = _ref2[0],
        optional = _ref2[1];

    // If there have only been optional params so far, and this one is optional, add it to the
    // list of trailing optional params.
    if (isOptional(param) && ordinary.length === 0) {
      optional.unshift(param);
    } else {
      ordinary.unshift(param);
    }
    return [ordinary, optional];
  }, [[], []]),
      _paramNames$reduceRig2 = _slicedToArray(_paramNames$reduceRig, 2),
      ordinaryParams = _paramNames$reduceRig2[0],
      trailingOptional = _paramNames$reduceRig2[1];

  var groupedParams = ordinaryParams.map(function (param) {
    return [param];
  });
  var lastParam = groupedParams[groupedParams.length - 1];
  if (lastParam != null) {
    lastParam.push.apply(lastParam, _toConsumableArray(trailingOptional));
  } else if (trailingOptional.length > 0) {
    groupedParams.push(trailingOptional);
  }

  return groupedParams;
}

function isOptional(param) {
  (0, _assert2.default)(param.length > 0);
  var lastChar = param[param.length - 1];
  return lastChar === '?';
}

function clearWorkspaceCaches() {
  flowPathCache.reset();
  flowConfigDirCache.reset();
  global.cachedPathToFlowBin = undefined;
}

function nodeModuleFlowLocation() {
  if (process.platform === 'win32') {
    return global.vscode.workspace.rootPath + '\\node_modules\\.bin\\flow.cmd';
  } else {
    return global.vscode.workspace.rootPath + '/node_modules/.bin/flow';
  }
}

/**
 * @return The command and arguments used to test the presence of flow according to platform.
 */
function buildSearchFlowCommand(testPath) {
  if (process.platform !== 'win32') {
    return {
      command: 'which',
      args: [testPath]
    };
  } else {
    var splitCharLocation = testPath.lastIndexOf('\\');
    var _command2 = testPath.substring(splitCharLocation + 1, testPath.length);
    var searchDirectory = testPath.substring(0, splitCharLocation);
    var _args5 = !searchDirectory ? [_command2] : ['/r', searchDirectory, _command2];
    return {
      command: (process.env.SYSTEMROOT || 'C:\\Windows') + '\\System32\\where',
      args: _args5
    };
  }
}

function getStopFlowOnExit() {
  // $UPFixMe: This should use nuclide-features-config
  // Does not currently do so because this is an npm module that may run on the server.
  if (global.vscode) {
    return global.vscode.workspace.getConfiguration('flow').get('stopFlowOnExit');
  }
  return true;
}

function findFlowConfigDir(localFile) {
  if (!flowConfigDirCache.has(localFile)) {
    var flowConfigDir = _fsPromise2.default.findNearestFile('.flowconfig', _main2.default.dirname(localFile));
    flowConfigDirCache.set(localFile, flowConfigDir);
  }
  return flowConfigDirCache.get(localFile);
}

function flowCoordsToAtomCoords(flowCoords) {
  return {
    start: {
      line: flowCoords.start.line - 1,
      column: flowCoords.start.column - 1
    },
    end: {
      line: flowCoords.end.line - 1,
      // Yes, this is inconsistent. Yes, it works as expected in practice.
      column: flowCoords.end.column
    }
  };
}

module.exports = {
  buildSearchFlowCommand: buildSearchFlowCommand,
  findFlowConfigDir: findFlowConfigDir,
  getPathToFlow: getPathToFlow,
  getStopFlowOnExit: getStopFlowOnExit,
  insertAutocompleteToken: insertAutocompleteToken,
  isFlowInstalled: isFlowInstalled,
  processAutocompleteItem: processAutocompleteItem,
  groupParamNames: groupParamNames,
  flowCoordsToAtomCoords: flowCoordsToAtomCoords,
  clearWorkspaceCaches: clearWorkspaceCaches
};
//# sourceMappingURL=FlowHelpers.js.map