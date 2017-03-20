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
exports.FlowRootContainer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _rxjs = require('rxjs');

var _FlowHelpers = require('./FlowHelpers');

var _FlowRoot = require('./FlowRoot');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FlowRootContainer = exports.FlowRootContainer = function () {
  function FlowRootContainer() {
    var _this = this;

    _classCallCheck(this, FlowRootContainer);

    this._disposed = false;
    this._flowRootMap = new Map();

    // No need to dispose of this subscription since we want to keep it for the entire life of this
    // object. When this object is garbage collected the subject should be too.
    this._flowRoot$ = new _rxjs.Subject();
    this._flowRoot$.subscribe(function (flowRoot) {
      _this._flowRootMap.set(flowRoot.getPathToRoot(), flowRoot);
    });
  }
  // string rather than NuclideUri because this module will always execute at the location of the
  // file, so it will always be a real path and cannot be prefixed with nuclide://


  _createClass(FlowRootContainer, [{
    key: 'getRootForPath',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(path) {
        var rootPath, instance;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this._checkForDisposal();
                _context.next = 3;
                return (0, _FlowHelpers.findFlowConfigDir)(path);

              case 3:
                rootPath = _context.sent;

                if (!(rootPath == null || this._disposed)) {
                  _context.next = 6;
                  break;
                }

                return _context.abrupt('return', null);

              case 6:
                instance = this._flowRootMap.get(rootPath);

                if (!instance) {
                  instance = new _FlowRoot.FlowRoot(rootPath);
                  this._flowRoot$.next(instance);
                }
                return _context.abrupt('return', instance);

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getRootForPath(_x) {
        return _ref.apply(this, arguments);
      }

      return getRootForPath;
    }()
  }, {
    key: 'runWithRoot',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(file, f) {
        var instance;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this._checkForDisposal();
                _context2.next = 3;
                return this.getRootForPath(file);

              case 3:
                instance = _context2.sent;

                if (!(instance == null)) {
                  _context2.next = 6;
                  break;
                }

                return _context2.abrupt('return', null);

              case 6:
                _context2.next = 8;
                return f(instance);

              case 8:
                return _context2.abrupt('return', _context2.sent);

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function runWithRoot(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return runWithRoot;
    }()
  }, {
    key: 'getAllRoots',
    value: function getAllRoots() {
      this._checkForDisposal();
      return this._flowRootMap.values();
    }
  }, {
    key: 'getServerStatusUpdates',
    value: function getServerStatusUpdates() {
      this._checkForDisposal();
      return this._flowRoot$.flatMap(function (root) {
        var pathToRoot = root.getPathToRoot();
        // The status update stream will be completed when a root is disposed, so there is no need to
        // use takeUntil here to truncate the stream and release resources.
        return root.getServerStatusUpdates().map(function (status) {
          return { pathToRoot: pathToRoot, status: status };
        });
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._checkForDisposal();
      this._flowRootMap.forEach(function (instance) {
        return instance.dispose();
      });
      this._flowRootMap.clear();
      this._disposed = true;
    }
  }, {
    key: '_checkForDisposal',
    value: function _checkForDisposal() {
      (0, _assert2.default)(!this._disposed, 'Method called on disposed FlowRootContainer');
    }
  }]);

  return FlowRootContainer;
}();
//# sourceMappingURL=FlowRootContainer.js.map