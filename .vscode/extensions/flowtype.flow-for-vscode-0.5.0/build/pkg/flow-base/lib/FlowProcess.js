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
exports.FlowProcess = exports.FLOW_RETURN_CODES = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _rxjs = require('rxjs');

var _main = require('../../nuclide-logging/lib/main');

var _process = require('../../commons-node/process');

var _FlowHelpers = require('./FlowHelpers');

var _FlowConstants = require('./FlowConstants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = (0, _main.getLogger)();

// import {track} from '../../nuclide-analytics';

// Names modeled after https://github.com/facebook/flow/blob/master/src/common/flowExitStatus.ml
var FLOW_RETURN_CODES = exports.FLOW_RETURN_CODES = {
  ok: 0,
  serverInitializing: 1,
  typeError: 2,
  noServerRunning: 6,
  // This means that the server exists, but it is not responding, typically because it is busy doing
  // other work.
  outOfRetries: 7,
  buildIdMismatch: 9,
  unexpectedArgument: 64
};

var SERVER_READY_TIMEOUT_MS = 10 * 1000;

var EXEC_FLOW_RETRIES = 5;

var FlowProcess = exports.FlowProcess = function () {
  // The current state of the Flow server in this directory
  function FlowProcess(root) {
    var _this = this;

    _classCallCheck(this, FlowProcess);

    this._serverStatus = new _rxjs.BehaviorSubject(_FlowConstants.ServerStatus.UNKNOWN);
    this._root = root;

    this._serverStatus.subscribe(function (status) {
      logger.info('[' + status + ']: Flow server in ' + _this._root);
    });

    this._serverStatus.filter(function (x) {
      return x === _FlowConstants.ServerStatus.NOT_RUNNING;
    }).subscribe(function () {
      _this._startFlowServer();
      _this._pingServer();
    });
    function isBusyOrInit(status) {
      return status === _FlowConstants.ServerStatus.BUSY || status === _FlowConstants.ServerStatus.INIT;
    }
    this._serverStatus.filter(isBusyOrInit).subscribe(function () {
      _this._pingServer();
    });

    // this._serverStatus.filter(status => status === ServerStatus.FAILED).subscribe(() => {
    //   track('flow-server-failed');
    // });
  }
  // The path to the directory where the .flowconfig is -- i.e. the root of the Flow project.

  // If we had to start a Flow server, store the process here so we can kill it when we shut down.


  _createClass(FlowProcess, [{
    key: 'dispose',
    value: function dispose() {
      this._serverStatus.complete();
      if (this._startedServer && (0, _FlowHelpers.getStopFlowOnExit)()) {
        // The default, SIGTERM, does not reliably kill the flow servers.
        this._startedServer.kill('SIGKILL');
      }
    }

    /**
     * If the Flow server fails we will not try to restart it again automatically. Calling this
     * method lets us exit that state and retry.
     */

  }, {
    key: 'allowServerRestart',
    value: function allowServerRestart() {
      if (this._serverStatus.getValue() === _FlowConstants.ServerStatus.FAILED) {
        // We intentionally do not use _setServerStatus because leaving the FAILED state is a
        // special-case that _setServerStatus does not allow.
        this._serverStatus.next(_FlowConstants.ServerStatus.UNKNOWN);
      }
    }
  }, {
    key: 'getServerStatusUpdates',
    value: function getServerStatusUpdates() {
      return this._serverStatus.asObservable();
    }

    /**
     * Returns null if Flow cannot be found.
     */

  }, {
    key: 'execFlow',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(args, options) {
        var waitForServer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var suppressErrors = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
        var maxRetries, i, result, couldRetry, pathToFlow;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                maxRetries = waitForServer ? EXEC_FLOW_RETRIES : 0;

                if (!(this._serverStatus.getValue() === _FlowConstants.ServerStatus.FAILED)) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return', null);

              case 3:
                i = 0;

              case 4:
                _context.prev = 4;
                _context.next = 7;
                return this._rawExecFlow( // eslint-disable-line babel/no-await-in-loop
                args, options);

              case 7:
                result = _context.sent;
                return _context.abrupt('return', result);

              case 11:
                _context.prev = 11;
                _context.t0 = _context['catch'](4);
                couldRetry = [_FlowConstants.ServerStatus.NOT_RUNNING, _FlowConstants.ServerStatus.INIT, _FlowConstants.ServerStatus.BUSY].indexOf(this._serverStatus.getValue()) !== -1;

                if (!(i < maxRetries && couldRetry)) {
                  _context.next = 19;
                  break;
                }

                _context.next = 17;
                return this._serverIsReady();

              case 17:
                _context.next = 25;
                break;

              case 19:
                if (!(!couldRetry && !suppressErrors)) {
                  _context.next = 24;
                  break;
                }

                _context.next = 22;
                return (0, _FlowHelpers.getPathToFlow)();

              case 22:
                pathToFlow = _context.sent;

                logger.error('Flow failed: ' + pathToFlow + ' ' + args.join(' ') + '. Error: ' + JSON.stringify(_context.t0));

              case 24:
                throw _context.t0;

              case 25:
                i++;
                _context.next = 4;
                break;

              case 28:
                return _context.abrupt('return', null);

              case 29:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 11]]);
      }));

      function execFlow(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return execFlow;
    }()

    /** Starts a Flow server in the current root */

  }, {
    key: '_startFlowServer',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        var pathToFlow, serverProcess, logIt;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _FlowHelpers.getPathToFlow)();

              case 2:
                pathToFlow = _context2.sent;
                _context2.next = 5;
                return (0, _process.safeSpawn)( // eslint-disable-line babel/no-await-in-loop
                pathToFlow, ['server', '--from', 'nuclide', '--max-workers', this._getMaxWorkers().toString(), this._root], this._getFlowExecOptions());

              case 5:
                serverProcess = _context2.sent;

                logIt = function logIt(data) {
                  var pid = serverProcess.pid;
                  logger.debug('flow server (' + pid + '): ' + data);
                };

                serverProcess.stdout.on('data', logIt);
                serverProcess.stderr.on('data', logIt);
                serverProcess.on('exit', function (code, signal) {
                  // We only want to blacklist this root if the Flow processes
                  // actually failed, rather than being killed manually. It seems that
                  // if they are killed, the code is null and the signal is 'SIGTERM'.
                  // In the Flow crashes I have observed, the code is 2 and the signal
                  // is null. So, let's blacklist conservatively for now and we can
                  // add cases later if we observe Flow crashes that do not fit this
                  // pattern.
                  if (code === 2 && signal === null) {
                    logger.error('Flow server unexpectedly exited', _this2._root);
                    _this2._setServerStatus(_FlowConstants.ServerStatus.FAILED);
                  }
                });
                this._startedServer = serverProcess;

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _startFlowServer() {
        return _ref2.apply(this, arguments);
      }

      return _startFlowServer;
    }()

    /** Execute Flow with the given arguments */

  }, {
    key: '_rawExecFlow',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(args) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var installed, flowOptions, result;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return (0, _FlowHelpers.isFlowInstalled)();

              case 2:
                installed = _context3.sent;

                if (installed) {
                  _context3.next = 6;
                  break;
                }

                this._updateServerStatus(null);
                return _context3.abrupt('return', null);

              case 6:
                flowOptions = this._getFlowExecOptions();

                options = _extends({}, flowOptions, options);
                args = [].concat(_toConsumableArray(args), ['--retry-if-init', 'false', '--retries', '0', '--no-auto-start']);
                _context3.prev = 9;
                _context3.next = 12;
                return FlowProcess.execFlowClient(args, options);

              case 12:
                result = _context3.sent;

                this._updateServerStatus(result);
                return _context3.abrupt('return', result);

              case 17:
                _context3.prev = 17;
                _context3.t0 = _context3['catch'](9);

                this._updateServerStatus(_context3.t0);

                if (!(_context3.t0.exitCode === FLOW_RETURN_CODES.typeError)) {
                  _context3.next = 24;
                  break;
                }

                return _context3.abrupt('return', _context3.t0);

              case 24:
                throw _context3.t0;

              case 25:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[9, 17]]);
      }));

      function _rawExecFlow(_x7, _x8) {
        return _ref3.apply(this, arguments);
      }

      return _rawExecFlow;
    }()
  }, {
    key: '_updateServerStatus',
    value: function _updateServerStatus(result) {
      var status = void 0;
      if (result == null) {
        status = _FlowConstants.ServerStatus.NOT_INSTALLED;
      } else {
        switch (result.exitCode) {
          case FLOW_RETURN_CODES.ok:
          // falls through
          case FLOW_RETURN_CODES.typeError:
            status = _FlowConstants.ServerStatus.READY;
            break;
          case FLOW_RETURN_CODES.serverInitializing:
            status = _FlowConstants.ServerStatus.INIT;
            break;
          case FLOW_RETURN_CODES.noServerRunning:
            status = _FlowConstants.ServerStatus.NOT_RUNNING;
            break;
          case FLOW_RETURN_CODES.outOfRetries:
            status = _FlowConstants.ServerStatus.BUSY;
            break;
          case FLOW_RETURN_CODES.buildIdMismatch:
            // If the version doesn't match, the server is automatically killed and the client
            // returns 9.
            logger.info('Killed flow server with incorrect version in', this._root);
            status = _FlowConstants.ServerStatus.NOT_RUNNING;
            break;
          case FLOW_RETURN_CODES.unexpectedArgument:
            // If we issued an unexpected argument we have learned nothing about the state of the Flow
            // server. So, don't update.
            return;
          default:
            logger.error('Unknown return code from Flow: ' + String(result.exitCode));
            status = _FlowConstants.ServerStatus.UNKNOWN;
        }
      }
      this._setServerStatus(status);
    }
  }, {
    key: '_setServerStatus',
    value: function _setServerStatus(status) {
      var currentStatus = this._serverStatus.getValue();
      if (
      // Avoid duplicate updates
      status !== currentStatus &&
      // Avoid moving the status away from FAILED, to let any existing  work die out when the
      // server fails.
      currentStatus !== _FlowConstants.ServerStatus.FAILED) {
        this._serverStatus.next(status);
      }
    }

    /** Ping the server until it leaves the current state */

  }, {
    key: '_pingServer',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var tries = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;
        var fromState, stateChanged, i;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                fromState = this._serverStatus.getValue();
                stateChanged = false;

                this._serverStatus.filter(function (newState) {
                  return newState !== fromState;
                }).first().subscribe(function () {
                  stateChanged = true;
                });
                i = 0;

              case 4:
                if (!(!stateChanged && i < tries)) {
                  _context4.next = 12;
                  break;
                }

                _context4.next = 7;
                return this._rawExecFlow(['status']).catch(function () {
                  return null;
                });

              case 7:
                _context4.next = 9;
                return _rxjs.Observable.of(null).delay(1000).toPromise();

              case 9:
                i++;
                _context4.next = 4;
                break;

              case 12:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _pingServer(_x10) {
        return _ref4.apply(this, arguments);
      }

      return _pingServer;
    }()

    /**
     * Resolves when the server is ready or the request times out, as indicated by the result of the
     * returned Promise.
     */

  }, {
    key: '_serverIsReady',
    value: function _serverIsReady() {
      return this._serverStatus.filter(function (x) {
        return x === _FlowConstants.ServerStatus.READY;
      }).map(function () {
        return true;
      }).race(_rxjs.Observable.of(false).delay(SERVER_READY_TIMEOUT_MS))
      // If the stream is completed timeout will not return its default value and we will see an
      // EmptyError. So, provide a defaultValue here so the promise resolves.
      .first(null, null, false).toPromise();
    }

    /**
    * If this returns null, then it is not safe to run flow.
    */

  }, {
    key: '_getFlowExecOptions',
    value: function _getFlowExecOptions() {
      return {
        cwd: this._root,
        env: _extends({
          // Allows backtrace to be printed:
          // http://caml.inria.fr/pub/docs/manual-ocaml/runtime.html#sec279
          OCAMLRUNPARAM: 'b'
        }, process.env)
      };
    }
  }, {
    key: '_getMaxWorkers',
    value: function _getMaxWorkers() {
      return Math.max(_os2.default.cpus().length - 2, 1);
    }

    /**
     * This should be used to execute Flow commands that do not rely on a Flow server. So, they do not
     * need to be associated with a FlowProcess instance and they may be executed from any working
     * directory.
     *
     * Note that using this method means that you get no guarantee that the Flow version specified in
     * any given .flowconfig is the one that will be executed here, because it has no association with
     * any given root. If you need this property, create an instance with the appropriate root and use
     * execFlow.
     */

  }], [{
    key: 'execFlowClient',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(args) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var pathToFlow, ret;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                args = [].concat(_toConsumableArray(args), ['--from', 'nuclide']);
                _context5.next = 3;
                return (0, _FlowHelpers.getPathToFlow)();

              case 3:
                pathToFlow = _context5.sent;
                _context5.next = 6;
                return (0, _process.asyncExecute)(pathToFlow, args, options);

              case 6:
                ret = _context5.sent;

                if (!(ret.exitCode !== 0)) {
                  _context5.next = 9;
                  break;
                }

                throw ret;

              case 9:
                return _context5.abrupt('return', ret);

              case 10:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function execFlowClient(_x12, _x13) {
        return _ref5.apply(this, arguments);
      }

      return execFlowClient;
    }()
  }]);

  return FlowProcess;
}();
//# sourceMappingURL=FlowProcess.js.map