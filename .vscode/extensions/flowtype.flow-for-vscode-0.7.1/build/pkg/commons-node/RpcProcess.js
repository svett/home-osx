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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nuclideRpc = require('../nuclide-rpc');

var _process = require('./process');

var _promise = require('./promise');

var _main = require('../nuclide-logging/lib/main');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = (0, _main.getLogger)();

/**
 * A generic process wrapper around a stdio-based child process, providing a simple
 * promise-based call API. Commonly used to wrap a python (or any other language)
 * process, making it invokable through JS code.
 *
 * This class can be generalized further (to not require stdin/stdout as the communication method)
 * by having the Transport class injected, which is currently defaulted to StreamTransport.
 *
 * Child Process Implementation Notes:
 * - See Rpc.js for the JSON protocol that the child process implementation must follow.
 * - Note that stdin, stdout, and stderr must be piped, done by node by default.
 *   Don't override the stdio to close off any of these streams in the constructor opts.
 */

var RpcProcess = function () {

  /**
   * @param name           a name for this server, used to tag log entries
   * @param createProcess  a function to used create the child process when needed,
   *                       both during initialization and on restart
   */
  function RpcProcess(name, serviceRegistry, createProcess) {
    var _this = this;

    _classCallCheck(this, RpcProcess);

    this._name = name;
    this._serviceRegistry = serviceRegistry;
    this._rpcConnection = null;
    this._disposed = false;
    this._ensureProcess = (0, _promise.serializeAsyncCall)(function () {
      return _this._ensureProcessImpl(createProcess);
    });
  }

  _createClass(RpcProcess, [{
    key: 'getName',
    value: function getName() {
      return this._name;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      logger.info(this._name + ' - disposing connection.');
      this._disposed = true;
      this._cleanup();
    }
  }, {
    key: 'getService',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(serviceName) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._ensureProcess();

              case 2:
                (0, _assert2.default)(this._rpcConnection != null);
                return _context.abrupt('return', this._rpcConnection.getService(serviceName));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getService(_x) {
        return _ref.apply(this, arguments);
      }

      return getService;
    }()

    /**
     * Ensures that the child process is available. Asynchronously creates the child process,
     * only if it is currently null.
     */

  }, {
    key: '_ensureProcessImpl',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(createProcess) {
        var _this2 = this;

        var proc;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this._process) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                _context2.prev = 2;
                _context2.next = 5;
                return createProcess();

              case 5:
                proc = _context2.sent;

                logger.info(this._name + ' - created child process with PID: ', proc.pid);

                proc.stdin.on('error', function (error) {
                  logger.error(_this2._name + ' - error writing data: ', error);
                });

                this._rpcConnection = new _nuclideRpc.RpcConnection('client', this._serviceRegistry, new _nuclideRpc.StreamTransport(proc.stdin, proc.stdout));
                this._subscription = (0, _process.getOutputStream)(proc).subscribe(this._onProcessMessage.bind(this));
                this._process = proc;
                _context2.next = 17;
                break;

              case 13:
                _context2.prev = 13;
                _context2.t0 = _context2['catch'](2);

                logger.error(this._name + ' - error spawning child process: ', _context2.t0);
                throw _context2.t0;

              case 17:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[2, 13]]);
      }));

      function _ensureProcessImpl(_x2) {
        return _ref2.apply(this, arguments);
      }

      return _ensureProcessImpl;
    }()

    /**
     * Handles lifecycle messages from stderr, exit, and error streams,
     * responding by logging and staging for process restart.
     */

  }, {
    key: '_onProcessMessage',
    value: function _onProcessMessage(message) {
      switch (message.kind) {
        case 'stdout':
          break;
        case 'stderr':
          logger.warn(this._name + ' - error from stderr received: ', message.data.toString());
          break;
        case 'exit':
          // Log exit code if process exited not as a result of being disposed.
          if (!this._disposed) {
            logger.error(this._name + ' - exited: ', message.exitCode);
          }
          // Don't attempt to kill the process if it already exited.
          this._cleanup(false);
          break;
        case 'error':
          logger.error(this._name + ' - error received: ', message.error.message);
          this._cleanup();
          break;
        default:
          // This case should never be reached.
          (0, _assert2.default)(false, this._name + ' - unknown message received: ' + message);
      }
    }

    /**
     * Cleans up in case of disposal or failure, clearing all pending calls,
     * and killing the child process if necessary.
     */

  }, {
    key: '_cleanup',
    value: function _cleanup() {
      var shouldKill = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      if (this._subscription != null) {
        this._subscription.unsubscribe();
        this._subscription = null;
      }
      if (this._rpcConnection != null) {
        this._rpcConnection.dispose();
        this._rpcConnection = null;
      }
      if (this._process != null && shouldKill) {
        this._process.kill();
      }
      // If shouldKill is false, i.e. the process exited outside of this
      // object's control or disposal, the process still needs to be nulled out
      // to indicate that the process needs to be restarted upon the next call.
      this._process = null;
    }
  }]);

  return RpcProcess;
}();

exports.default = RpcProcess;
//# sourceMappingURL=RpcProcess.js.map