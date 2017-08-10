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
exports.FlowRoot = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fuzzaldrin = require('fuzzaldrin');

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _main = require('../../nuclide-logging/lib/main');

var _FlowHelpers = require('./FlowHelpers');

var _FlowProcess = require('./FlowProcess');

var _FlowVersion = require('./FlowVersion');

var _astToOutline = require('./astToOutline');

var _diagnosticsParser = require('./diagnosticsParser');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = (0, _main.getLogger)();

/** Encapsulates all of the state information we need about a specific Flow root */
var FlowRoot = exports.FlowRoot = function () {
  function FlowRoot(root) {
    var _this = this;

    _classCallCheck(this, FlowRoot);

    this._root = root;
    this._process = new _FlowProcess.FlowProcess(root);
    this._version = new _FlowVersion.FlowVersion(function () {
      return _this._flowGetVersion();
    });
    this._process.getServerStatusUpdates().filter(function (state) {
      return state === 'not running';
    }).subscribe(function () {
      return _this._version.invalidateVersion();
    });
  }
  // The path to the directory where the .flowconfig is -- i.e. the root of the Flow project.


  _createClass(FlowRoot, [{
    key: 'dispose',
    value: function dispose() {
      this._process.dispose();
    }
  }, {
    key: 'allowServerRestart',
    value: function allowServerRestart() {
      this._process.allowServerRestart();
    }
  }, {
    key: 'getPathToRoot',
    value: function getPathToRoot() {
      return this._root;
    }
  }, {
    key: 'getServerStatusUpdates',
    value: function getServerStatusUpdates() {
      return this._process.getServerStatusUpdates();
    }
  }, {
    key: 'flowFindDefinition',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(file, currentContents, line, column) {
        var options, args, result, json;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = {};
                // We pass the current contents of the buffer to Flow via stdin.
                // This makes it possible for get-def to operate on the unsaved content in
                // the user's editor rather than what is saved on disk. It would be annoying
                // if the user had to save before using the jump-to-definition feature to
                // ensure he or she got accurate results.

                options.stdin = currentContents;

                args = ['get-def', '--json', '--path', file, line, column];
                _context.prev = 3;
                _context.next = 6;
                return this._process.execFlow(args, options);

              case 6:
                result = _context.sent;

                if (result) {
                  _context.next = 9;
                  break;
                }

                return _context.abrupt('return', null);

              case 9:
                json = parseJSON(args, result.stdout);

                if (!json.path) {
                  _context.next = 14;
                  break;
                }

                return _context.abrupt('return', {
                  file: json.path,
                  point: {
                    line: json.line - 1,
                    column: json.start - 1
                  }
                });

              case 14:
                return _context.abrupt('return', null);

              case 15:
                _context.next = 20;
                break;

              case 17:
                _context.prev = 17;
                _context.t0 = _context['catch'](3);
                return _context.abrupt('return', null);

              case 20:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 17]]);
      }));

      function flowFindDefinition(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return flowFindDefinition;
    }()

    /**
     * If currentContents is null, it means that the file has not changed since
     * it has been saved, so we can avoid piping the whole contents to the Flow
     * process.
     */

  }, {
    key: 'flowFindDiagnostics',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(file, currentContents) {
        var options, args, result, json;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._forceRecheck(file);

              case 2:
                options = {};
                args = void 0;

                if (currentContents) {
                  options.stdin = currentContents;

                  // Currently, `flow check-contents` returns all of the errors in the
                  // project. It would be nice if it would use the path for filtering, as
                  // currently the client has to do the filtering.
                  args = ['check-contents', '--json', file];
                } else {
                  // We can just use `flow status` if the contents are unchanged.
                  args = ['status', '--json', file];
                }

                result = void 0;
                _context2.prev = 6;
                _context2.next = 9;
                return this._process.execFlow(args, options, /* waitForServer */true);

              case 9:
                result = _context2.sent;

                if (result) {
                  _context2.next = 12;
                  break;
                }

                return _context2.abrupt('return', null);

              case 12:
                _context2.next = 22;
                break;

              case 14:
                _context2.prev = 14;
                _context2.t0 = _context2['catch'](6);

                if (!(_context2.t0.exitCode !== undefined)) {
                  _context2.next = 20;
                  break;
                }

                result = _context2.t0;
                _context2.next = 22;
                break;

              case 20:
                logger.error(_context2.t0);
                return _context2.abrupt('return', null);

              case 22:
                json = void 0;
                _context2.prev = 23;

                json = parseJSON(args, result.stdout);
                _context2.next = 30;
                break;

              case 27:
                _context2.prev = 27;
                _context2.t1 = _context2['catch'](23);
                return _context2.abrupt('return', null);

              case 30:
                return _context2.abrupt('return', (0, _diagnosticsParser.flowStatusOutputToDiagnostics)(this._root, json));

              case 31:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[6, 14], [23, 27]]);
      }));

      function flowFindDiagnostics(_x5, _x6) {
        return _ref2.apply(this, arguments);
      }

      return flowFindDiagnostics;
    }()
  }, {
    key: 'flowGetAutocompleteSuggestions',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(file, currentContents, line, column, prefix, activatedManually) {
        var minimumPrefixLength, prefixHasDot, replacementPrefix, options, args, result, json, resultsArray, candidates;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // We may want to make this configurable, but if it is ever higher than one we need to make sure
                // it works properly when the user manually activates it (e.g. with ctrl+space). See
                // https://github.com/atom/autocomplete-plus/issues/597
                //
                // If this is made configurable, consider using autocomplete-plus' minimumWordLength setting, as
                // per https://github.com/atom/autocomplete-plus/issues/594
                minimumPrefixLength = 1;

                // Allows completions to immediately appear when we are completing off of object properties.
                // This also needs to be changed if minimumPrefixLength goes above 1, since after you type a
                // single alphanumeric character, autocomplete-plus no longer includes the dot in the prefix.

                prefixHasDot = prefix.indexOf('.') !== -1;

                // If it is just whitespace and punctuation, ignore it (this keeps us
                // from eating leading dots).

                replacementPrefix = /^[\s.]*$/.test(prefix) ? '' : prefix;

                if (!(!activatedManually && !prefixHasDot && replacementPrefix.length < minimumPrefixLength)) {
                  _context3.next = 5;
                  break;
                }

                return _context3.abrupt('return', []);

              case 5:
                options = {};
                args = ['autocomplete', '--json', file];


                options.stdin = (0, _FlowHelpers.insertAutocompleteToken)(currentContents, line, column);
                _context3.prev = 8;
                _context3.next = 11;
                return this._process.execFlow(args, options);

              case 11:
                result = _context3.sent;

                if (result) {
                  _context3.next = 14;
                  break;
                }

                return _context3.abrupt('return', []);

              case 14:
                json = parseJSON(args, result.stdout);
                resultsArray = void 0;

                if (Array.isArray(json)) {
                  // Flow < v0.20.0
                  resultsArray = json;
                } else {
                  // Flow >= v0.20.0. The output format was changed to support more detailed failure
                  // information.
                  resultsArray = json.result;
                }
                candidates = resultsArray.map(function (item) {
                  return (0, _FlowHelpers.processAutocompleteItem)(replacementPrefix, item);
                });
                return _context3.abrupt('return', (0, _fuzzaldrin.filter)(candidates, replacementPrefix, { key: 'displayText' }));

              case 21:
                _context3.prev = 21;
                _context3.t0 = _context3['catch'](8);
                return _context3.abrupt('return', []);

              case 24:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[8, 21]]);
      }));

      function flowGetAutocompleteSuggestions(_x7, _x8, _x9, _x10, _x11, _x12) {
        return _ref3.apply(this, arguments);
      }

      return flowGetAutocompleteSuggestions;
    }()
  }, {
    key: 'flowGetType',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(file, currentContents, line, column, includeRawType) {
        var options, args, output, result, json, type, rawType;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                options = {};


                options.stdin = currentContents;

                line++;
                column++;
                args = ['type-at-pos', '--json', '--path', file, line, column];

                if (includeRawType) {
                  args.push('--raw');
                }

                output = void 0;
                _context4.prev = 7;
                _context4.next = 10;
                return this._process.execFlow(args, options);

              case 10:
                result = _context4.sent;

                if (result) {
                  _context4.next = 13;
                  break;
                }

                return _context4.abrupt('return', null);

              case 13:
                output = result.stdout;
                if (output === '') {
                  // if there is a syntax error, Flow returns the JSON on stderr while
                  // still returning a 0 exit code (t8018595)
                  output = result.stderr;
                }
                _context4.next = 20;
                break;

              case 17:
                _context4.prev = 17;
                _context4.t0 = _context4['catch'](7);
                return _context4.abrupt('return', null);

              case 20:
                json = void 0;
                _context4.prev = 21;

                json = parseJSON(args, output);
                _context4.next = 28;
                break;

              case 25:
                _context4.prev = 25;
                _context4.t1 = _context4['catch'](21);
                return _context4.abrupt('return', null);

              case 28:
                type = json.type;
                rawType = json.raw_type;

                if (!(!type || type === '(unknown)' || type === '')) {
                  _context4.next = 33;
                  break;
                }

                if (type === '') {
                  // This should not happen. The Flow team believes it's an error in Flow
                  // if it does. I'm leaving the condition here because it used to happen
                  // before the switch to JSON and I'd rather log something than have the
                  // user experience regress in case I'm wrong.
                  logger.error('Received empty type hint from `flow type-at-pos`');
                }
                return _context4.abrupt('return', null);

              case 33:
                return _context4.abrupt('return', { type: type, rawType: rawType });

              case 34:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[7, 17], [21, 25]]);
      }));

      function flowGetType(_x13, _x14, _x15, _x16, _x17) {
        return _ref4.apply(this, arguments);
      }

      return flowGetType;
    }()
  }, {
    key: 'flowGetCoverage',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(path) {
        var version, useDumpTypes;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this._version.getVersion();

              case 2:
                version = _context5.sent;

                // Fall back to dump types if we don't know the version
                useDumpTypes = version == null || _semver2.default.lte(version, '0.27.0');

                if (!useDumpTypes) {
                  _context5.next = 10;
                  break;
                }

                _context5.next = 7;
                return this._getCoverageViaDumpTypes(path);

              case 7:
                _context5.t0 = _context5.sent;
                _context5.next = 13;
                break;

              case 10:
                _context5.next = 12;
                return this._getCoverageViaCoverage(path);

              case 12:
                _context5.t0 = _context5.sent;

              case 13:
                return _context5.abrupt('return', _context5.t0);

              case 14:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function flowGetCoverage(_x18) {
        return _ref5.apply(this, arguments);
      }

      return flowGetCoverage;
    }()
  }, {
    key: '_getCoverageViaDumpTypes',
    value: function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(path) {
        var args, result, json, allEntries, uncoveredEntries, uncoveredRanges, uncoveredCount, totalCount, coveredCount;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                args = ['dump-types', '--json', path];
                result = void 0;
                _context6.prev = 2;
                _context6.next = 5;
                return this._process.execFlow(args, {});

              case 5:
                result = _context6.sent;
                _context6.next = 11;
                break;

              case 8:
                _context6.prev = 8;
                _context6.t0 = _context6['catch'](2);
                return _context6.abrupt('return', null);

              case 11:
                if (!(result == null)) {
                  _context6.next = 13;
                  break;
                }

                return _context6.abrupt('return', null);

              case 13:
                json = void 0;
                _context6.prev = 14;

                json = parseJSON(args, result.stdout);
                _context6.next = 21;
                break;

              case 18:
                _context6.prev = 18;
                _context6.t1 = _context6['catch'](14);
                return _context6.abrupt('return', null);

              case 21:
                allEntries = json;
                uncoveredEntries = allEntries.filter(function (item) {
                  return item.type === '' || item.type === 'any';
                });
                uncoveredRanges = uncoveredEntries.map(function (item) {
                  return (0, _FlowHelpers.flowCoordsToAtomCoords)(item.loc);
                });
                uncoveredCount = uncoveredEntries.length;
                totalCount = allEntries.length;
                coveredCount = totalCount - uncoveredCount;
                return _context6.abrupt('return', {
                  percentage: totalCount === 0 ? 100 : coveredCount / totalCount * 100,
                  uncoveredRanges: uncoveredRanges
                });

              case 28:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[2, 8], [14, 18]]);
      }));

      function _getCoverageViaDumpTypes(_x19) {
        return _ref6.apply(this, arguments);
      }

      return _getCoverageViaDumpTypes;
    }()
  }, {
    key: '_getCoverageViaCoverage',
    value: function () {
      var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(path) {
        var args, result, json, expressions, uncoveredCount, coveredCount, totalCount, uncoveredRanges;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                args = ['coverage', '--json', path];
                result = void 0;
                _context7.prev = 2;
                _context7.next = 5;
                return this._process.execFlow(args, {});

              case 5:
                result = _context7.sent;
                _context7.next = 11;
                break;

              case 8:
                _context7.prev = 8;
                _context7.t0 = _context7['catch'](2);
                return _context7.abrupt('return', null);

              case 11:
                if (!(result == null)) {
                  _context7.next = 13;
                  break;
                }

                return _context7.abrupt('return', null);

              case 13:
                json = void 0;
                _context7.prev = 14;

                json = parseJSON(args, result.stdout);
                _context7.next = 21;
                break;

              case 18:
                _context7.prev = 18;
                _context7.t1 = _context7['catch'](14);
                return _context7.abrupt('return', null);

              case 21:
                expressions = json.expressions;
                uncoveredCount = expressions.uncovered_count;
                coveredCount = expressions.covered_count;
                totalCount = uncoveredCount + coveredCount;
                uncoveredRanges = expressions.uncovered_locs.map(_FlowHelpers.flowCoordsToAtomCoords);
                return _context7.abrupt('return', {
                  percentage: totalCount === 0 ? 100 : coveredCount / totalCount * 100,
                  uncoveredRanges: uncoveredRanges
                });

              case 27:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this, [[2, 8], [14, 18]]);
      }));

      function _getCoverageViaCoverage(_x20) {
        return _ref7.apply(this, arguments);
      }

      return _getCoverageViaCoverage;
    }()
  }, {
    key: '_forceRecheck',
    value: function () {
      var _ref8 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(file) {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.prev = 0;
                _context8.next = 3;
                return this._process.execFlow(['force-recheck', file],
                /* options */{},
                // Make an attempt to force a recheck, but if the server is busy don't insist.
                /* waitsForServer */false,
                /* suppressErrors */true);

              case 3:
                return _context8.abrupt('return', true);

              case 6:
                _context8.prev = 6;
                _context8.t0 = _context8['catch'](0);
                return _context8.abrupt('return', false);

              case 9:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this, [[0, 6]]);
      }));

      function _forceRecheck(_x21) {
        return _ref8.apply(this, arguments);
      }

      return _forceRecheck;
    }()
  }, {
    key: '_flowGetVersion',
    value: function () {
      var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
        var args, json, result;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                args = ['version', '--json'];
                json = void 0;
                _context9.prev = 2;
                _context9.next = 5;
                return _FlowProcess.FlowProcess.execFlowClient(args);

              case 5:
                result = _context9.sent;

                if (!(result == null)) {
                  _context9.next = 8;
                  break;
                }

                return _context9.abrupt('return', null);

              case 8:
                json = parseJSON(args, result.stdout);
                _context9.next = 15;
                break;

              case 11:
                _context9.prev = 11;
                _context9.t0 = _context9['catch'](2);

                logger.warn(_context9.t0);
                return _context9.abrupt('return', null);

              case 15:
                return _context9.abrupt('return', json.semver);

              case 16:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this, [[2, 11]]);
      }));

      function _flowGetVersion() {
        return _ref9.apply(this, arguments);
      }

      return _flowGetVersion;
    }()
  }], [{
    key: 'flowGetOutline',
    value: function () {
      var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(currentContents) {
        var options, args, json, result;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                options = {
                  stdin: currentContents
                };
                args = ['ast'];
                json = void 0;
                _context10.prev = 3;
                _context10.next = 6;
                return _FlowProcess.FlowProcess.execFlowClient(args, options);

              case 6:
                result = _context10.sent;

                if (!(result == null)) {
                  _context10.next = 9;
                  break;
                }

                return _context10.abrupt('return', null);

              case 9:
                json = parseJSON(args, result.stdout);
                _context10.next = 16;
                break;

              case 12:
                _context10.prev = 12;
                _context10.t0 = _context10['catch'](3);

                logger.warn(_context10.t0);
                return _context10.abrupt('return', null);

              case 16:
                _context10.prev = 16;
                return _context10.abrupt('return', (0, _astToOutline.astToOutline)(json));

              case 20:
                _context10.prev = 20;
                _context10.t1 = _context10['catch'](16);

                // Traversing the AST is an error-prone process and it's hard to be sure we've handled all the
                // cases. Fail gracefully if it does not work.
                logger.error(_context10.t1);
                return _context10.abrupt('return', null);

              case 24:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this, [[3, 12], [16, 20]]);
      }));

      function flowGetOutline(_x22) {
        return _ref10.apply(this, arguments);
      }

      return flowGetOutline;
    }()
  }]);

  return FlowRoot;
}();

function parseJSON(args, value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    logger.error('Invalid JSON result from flow ' + args.join(' ') + '. JSON:\n\'' + value + '\'.');
    throw e;
  }
}
//# sourceMappingURL=FlowRoot.js.map