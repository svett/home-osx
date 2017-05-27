'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

describe('FlowRoot', function () {
  var file = '/path/to/test.js';
  var root = '/path/to';
  var currentContents = '/* @flow */\nvar x = "this_is_a_string"\nvar y;';
  var line = 2;
  var column = 12;

  var flowRoot = null;

  var fakeExecFlow = void 0;

  function newFlowService() {
    // We do a require here instead of just importing at the top of the file because the describe
    // block below needs to mock things, and has to use uncachedRequire.
    var _require = require('../lib/FlowRoot');

    var FlowRoot = _require.FlowRoot;

    return new FlowRoot(root);
  }

  beforeEach(function () {
    flowRoot = newFlowService();
    spyOn(flowRoot._process, 'execFlow').andCallFake(function () {
      return fakeExecFlow();
    });
  });

  function mockExec(outputString) {
    fakeExecFlow = function fakeExecFlow() {
      return { stdout: outputString, exitCode: 0 };
    };
  }

  describe('flowFindDefinition', function () {
    function runWith(location) {
      mockExec(JSON.stringify(location));
      return flowRoot.flowFindDefinition(file, currentContents, line, column);
    }

    it('should return the location', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return runWith({ path: file, line: 5, start: 8 });

              case 2:
                _context.t0 = _context.sent;
                _context.t1 = { file: file, point: { line: 4, column: 7 } };
                expect(_context.t0).toEqual(_context.t1);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      })));
    });

    it('should return null if no location is found', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return runWith({});

              case 2:
                _context2.t0 = _context2.sent;
                expect(_context2.t0).toBe(null);

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, undefined);
      })));
    });
  });

  describe('flowFindDiagnostics', function () {
    function runWith(errors, filePath, contents) {
      mockExec(JSON.stringify({ errors: errors }));
      return flowRoot.flowFindDiagnostics(filePath, contents);
    }

    it('should call flow status when currentContents is null', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var flowArgs;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return runWith([], file, null);

              case 2:
                flowArgs = flowRoot._process.execFlow.mostRecentCall.args[0];

                expect(flowArgs[0]).toBe('status');

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, undefined);
      })));
    });

    it('should call flow check-contents with currentContents when it is not null', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var execArgs, flowArgs, stdin;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return runWith([], file, currentContents);

              case 2:
                execArgs = flowRoot._process.execFlow.mostRecentCall.args;
                flowArgs = execArgs[0];
                stdin = execArgs[1].stdin;

                expect(flowArgs[0]).toBe('check-contents');
                expect(stdin).toBe(currentContents);

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, undefined);
      })));
    });
  });

  describe('flowGetAutocompleteSuggestions', function () {
    var prefix = null;
    var optionNames = null;
    var options = void 0;
    var activatedManually = undefined;

    function newRunWith(results) {
      mockExec(JSON.stringify({ result: results }));
      return flowRoot.flowGetAutocompleteSuggestions(file, currentContents, line, column, prefix, activatedManually);
    }

    // Uses the old format that flow autocomplete used to use. Can be removed once we no longer want
    // to support Flow versions under v0.20.0
    function oldRunWith(results) {
      mockExec(JSON.stringify(results));
      return flowRoot.flowGetAutocompleteSuggestions(file, currentContents, line, column, prefix, activatedManually);
    }

    [oldRunWith, newRunWith].forEach(function (runWith) {
      var getNameArray = function () {
        var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(results) {
          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return runWith(results);

                case 2:
                  _context5.t0 = function (item) {
                    return item.text;
                  };

                  return _context5.abrupt('return', _context5.sent.map(_context5.t0));

                case 4:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, this);
        }));

        return function getNameArray(_x) {
          return _ref5.apply(this, arguments);
        };
      }();

      var getNameSet = function () {
        var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(results) {
          return regeneratorRuntime.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.t0 = Set;
                  _context6.next = 3;
                  return getNameArray(results);

                case 3:
                  _context6.t1 = _context6.sent;
                  return _context6.abrupt('return', new _context6.t0(_context6.t1));

                case 5:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, this);
        }));

        return function getNameSet(_x2) {
          return _ref6.apply(this, arguments);
        };
      }();

      function hasEqualElements(set1, set2) {
        if (set1.size !== set2.size) {
          return false;
        }
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = set1[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var item = _step.value;

            if (!set2.has(item)) {
              return false;
            }
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

        return true;
      }

      beforeEach(function () {
        prefix = '';
        activatedManually = false;
        optionNames = ['Foo', 'foo', 'Bar', 'BigLongNameOne', 'BigLongNameTwo'];
        options = optionNames.map(function (name) {
          return { name: name, type: 'foo' };
        });
      });

      it('should not provide suggestions when no characters have been typed', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee7() {
          return regeneratorRuntime.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return getNameSet(options);

                case 2:
                  _context7.t0 = _context7.sent;
                  _context7.t1 = new Set();
                  _context7.t2 = hasEqualElements(_context7.t0, _context7.t1);
                  expect(_context7.t2).toBe(true);

                case 6:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, undefined);
        })));
      });

      it('should always provide suggestions when activated manually', function () {
        activatedManually = true;
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee8() {
          return regeneratorRuntime.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.next = 2;
                  return getNameSet(options);

                case 2:
                  _context8.t0 = _context8.sent;
                  _context8.t1 = new Set(optionNames);
                  _context8.t2 = hasEqualElements(_context8.t0, _context8.t1);
                  expect(_context8.t2).toBe(true);

                case 6:
                case 'end':
                  return _context8.stop();
              }
            }
          }, _callee8, undefined);
        })));
      });

      it('should always provide suggestions when the prefix contains .', function () {
        prefix = '   .   ';
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee9() {
          return regeneratorRuntime.wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return getNameSet(options);

                case 2:
                  _context9.t0 = _context9.sent;
                  _context9.t1 = new Set(optionNames);
                  _context9.t2 = hasEqualElements(_context9.t0, _context9.t1);
                  expect(_context9.t2).toBe(true);

                case 6:
                case 'end':
                  return _context9.stop();
              }
            }
          }, _callee9, undefined);
        })));
      });

      it('should not filter suggestions if the prefix is a .', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee10() {
          return regeneratorRuntime.wrap(function _callee10$(_context10) {
            while (1) {
              switch (_context10.prev = _context10.next) {
                case 0:
                  prefix = '.';
                  _context10.next = 3;
                  return getNameSet(options);

                case 3:
                  _context10.t0 = _context10.sent;
                  _context10.t1 = new Set(optionNames);
                  _context10.t2 = hasEqualElements(_context10.t0, _context10.t1);
                  expect(_context10.t2).toBe(true);

                case 7:
                case 'end':
                  return _context10.stop();
              }
            }
          }, _callee10, undefined);
        })));
      });

      it('should filter suggestions by the prefix', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee11() {
          return regeneratorRuntime.wrap(function _callee11$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  prefix = 'bln';
                  _context11.next = 3;
                  return getNameSet(options);

                case 3:
                  _context11.t0 = _context11.sent;
                  _context11.t1 = new Set(['BigLongNameOne', 'BigLongNameTwo']);
                  _context11.t2 = hasEqualElements(_context11.t0, _context11.t1);
                  expect(_context11.t2).toBe(true);

                case 7:
                case 'end':
                  return _context11.stop();
              }
            }
          }, _callee11, undefined);
        })));
      });

      it('should rank better matches higher', function () {
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee12() {
          var nameArray;
          return regeneratorRuntime.wrap(function _callee12$(_context12) {
            while (1) {
              switch (_context12.prev = _context12.next) {
                case 0:
                  prefix = 'one';
                  _context12.next = 3;
                  return getNameArray(options);

                case 3:
                  nameArray = _context12.sent;

                  expect(nameArray[0]).toEqual('BigLongNameOne');

                case 5:
                case 'end':
                  return _context12.stop();
              }
            }
          }, _callee12, undefined);
        })));
      });

      it('should expose extra information about a function', function () {
        prefix = 'f';
        waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee13() {
          var result, fooResult;
          return regeneratorRuntime.wrap(function _callee13$(_context13) {
            while (1) {
              switch (_context13.prev = _context13.next) {
                case 0:
                  _context13.next = 2;
                  return runWith([{
                    name: 'foo',
                    type: '(param1: type1, param2: type2) => ret',
                    func_details: {
                      params: [{ name: 'param1', type: 'type1' }, { name: 'param2', type: 'type2' }],
                      return_type: 'ret'
                    }
                  }]);

                case 2:
                  result = _context13.sent;
                  fooResult = result[0];

                  expect(fooResult.displayText).toEqual('foo');
                  expect(fooResult.snippet).toEqual('foo(${1:param1}, ${2:param2})');
                  expect(fooResult.type).toEqual('function');
                  expect(fooResult.leftLabel).toEqual('ret');
                  expect(fooResult.rightLabel).toEqual('(param1: type1, param2: type2)');

                case 9:
                case 'end':
                  return _context13.stop();
              }
            }
          }, _callee13, undefined);
        })));
      });
    });
  });

  describe('flowGetType', function () {
    function runWithString(outputString) {
      mockExec(outputString);
      return flowRoot.flowGetType(file, currentContents, line, column, false);
    }
    function runWith(outputType) {
      return runWithString(JSON.stringify({ type: outputType }));
    }

    it('should return the type on success', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee14() {
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                _context14.next = 2;
                return runWith('thisIsAType');

              case 2:
                _context14.t0 = _context14.sent;
                _context14.t1 = { type: 'thisIsAType', rawType: undefined };
                expect(_context14.t0).toEqual(_context14.t1);

              case 5:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, undefined);
      })));
    });

    it('should return null if the type is unknown', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee15() {
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return runWith('(unknown)');

              case 2:
                _context15.t0 = _context15.sent;
                expect(_context15.t0).toBe(null);

              case 4:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, undefined);
      })));
    });

    it('should return null if the type is empty', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee16() {
        return regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                _context16.next = 2;
                return runWith('');

              case 2:
                _context16.t0 = _context16.sent;
                expect(_context16.t0).toBe(null);

              case 4:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, undefined);
      })));
    });

    it('should return null on failure', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee17() {
        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                _context17.next = 2;
                return runWithString('invalid json');

              case 2:
                _context17.t0 = _context17.sent;
                expect(_context17.t0).toBe(null);

              case 4:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, undefined);
      })));
    });

    it('should return null if the flow process fails', function () {
      waitsForPromise(_asyncToGenerator(regeneratorRuntime.mark(function _callee18() {
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                fakeExecFlow = function fakeExecFlow() {
                  throw 'error';
                };
                // this causes some errors to get logged, but I don't think it's a big
                // deal and I don't know how to mock a module
                _context18.next = 3;
                return flowRoot.flowGetType(file, currentContents, line, column, false);

              case 3:
                _context18.t0 = _context18.sent;
                expect(_context18.t0).toBe(null);

              case 5:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, undefined);
      })));
    });
  });
});
//# sourceMappingURL=FlowRoot-spec.js.map