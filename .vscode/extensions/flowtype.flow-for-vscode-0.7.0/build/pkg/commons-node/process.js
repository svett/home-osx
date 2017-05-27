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
exports.__test__ = exports.checkOutput = exports.forkWithExecEnvironment = exports.safeSpawn = exports.createExecEnvironment = exports.ProcessExitError = exports.ProcessSystemError = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * Since OS X apps don't inherit PATH when not launched from the CLI, this function creates a new
 * environment object given the original environment by modifying the env.PATH using following
 * logic:
 *  1) If originalEnv.PATH doesn't equal to process.env.PATH, which means the PATH has been
 *    modified, we shouldn't do anything.
 *  1) If we are running in OS X, use `/usr/libexec/path_helper -s` to get the correct PATH and
 *    REPLACE the PATH.
 *  2) If step 1 failed or we are not running in OS X, APPEND commonBinaryPaths to current PATH.
 */
var createExecEnvironment = exports.createExecEnvironment = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(originalEnv, commonBinaryPaths) {
    var execEnv, platformPath, paths;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            execEnv = _extends({}, originalEnv);

            if (!(execEnv.PATH !== process.env.PATH)) {
              _context.next = 3;
              break;
            }

            return _context.abrupt('return', execEnv);

          case 3:

            execEnv.PATH = execEnv.PATH || '';

            platformPath = null;
            _context.prev = 5;
            _context.next = 8;
            return getPlatformPath();

          case 8:
            platformPath = _context.sent;
            _context.next = 14;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](5);

            logError('Failed to getPlatformPath', _context.t0);

          case 14:

            // If the platform returns a non-empty PATH, use it. Otherwise use the default set of common
            // binary paths.
            if (platformPath) {
              execEnv.PATH = platformPath;
            } else if (commonBinaryPaths.length) {
              paths = _main2.default.splitPathList(execEnv.PATH);

              commonBinaryPaths.forEach(function (commonBinaryPath) {
                if (paths.indexOf(commonBinaryPath) === -1) {
                  paths.push(commonBinaryPath);
                }
              });
              execEnv.PATH = _main2.default.joinPathList(paths);
            }

            return _context.abrupt('return', execEnv);

          case 16:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[5, 11]]);
  }));

  return function createExecEnvironment(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Basically like spawn, except it handles and logs errors instead of crashing
 * the process. This is much lower-level than asyncExecute. Unless you have a
 * specific reason you should use asyncExecute instead.
 */
var safeSpawn = exports.safeSpawn = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(command) {
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var child;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return createExecEnvironment(options.env || process.env, COMMON_BINARY_PATHS);

          case 2:
            options.env = _context2.sent;
            child = (0, _crossSpawn2.default)(command, args, options);

            monitorStreamErrors(child, command, args, options);
            child.on('error', function (error) {
              logError('error with command:', command, args, options, 'error:', error);
            });
            return _context2.abrupt('return', child);

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function safeSpawn(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var forkWithExecEnvironment = exports.forkWithExecEnvironment = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(modulePath) {
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var forkOptions, child;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.t0 = _extends;
            _context3.t1 = {};
            _context3.t2 = options;
            _context3.next = 5;
            return createExecEnvironment(options.env || process.env, COMMON_BINARY_PATHS);

          case 5:
            _context3.t3 = _context3.sent;
            _context3.t4 = {
              env: _context3.t3
            };
            forkOptions = (0, _context3.t0)(_context3.t1, _context3.t2, _context3.t4);
            child = _child_process2.default.fork(modulePath, args, forkOptions);

            child.on('error', function (error) {
              logError('error from module:', modulePath, args, options, 'error:', error);
            });
            return _context3.abrupt('return', child);

          case 11:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function forkWithExecEnvironment(_x6) {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Takes the command and args that you would normally pass to `spawn()` and returns `newArgs` such
 * that you should call it with `spawn('script', newArgs)` to run the original command/args pair
 * under `script`.
 */


/**
 * Simple wrapper around asyncExecute that throws if the exitCode is non-zero.
 */
var checkOutput = exports.checkOutput = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(command, args) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var result, reason;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return asyncExecute(command, args, options);

          case 2:
            result = _context4.sent;

            if (!(result.exitCode !== 0)) {
              _context4.next = 6;
              break;
            }

            reason = result.exitCode != null ? 'exitCode: ' + result.exitCode : 'error: ' + String(result.errorMessage);
            throw new Error('asyncExecute "' + command + '" failed with ' + reason + ', ' + ('stderr: ' + String(result.stderr) + ', stdout: ' + String(result.stdout) + '.'));

          case 6:
            return _context4.abrupt('return', result);

          case 7:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function checkOutput(_x15, _x16) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Run a command, accumulate the output. Errors are surfaced as stream errors and unsubscribing will
 * kill the process.
 */


exports.createArgsForScriptCommand = createArgsForScriptCommand;
exports.scriptSafeSpawn = scriptSafeSpawn;
exports.scriptSafeSpawnAndObserveOutput = scriptSafeSpawnAndObserveOutput;
exports.createProcessStream = createProcessStream;
exports.observeProcessExit = observeProcessExit;
exports.getOutputStream = getOutputStream;
exports.observeProcess = observeProcess;
exports.asyncExecute = asyncExecute;
exports.runCommand = runCommand;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _crossSpawn = require('cross-spawn');

var _crossSpawn2 = _interopRequireDefault(_crossSpawn);

var _main = require('../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

var _stream = require('./stream');

var _rxjs = require('rxjs');

var _promiseExecutors = require('./promise-executors');

var _shellQuote = require('shell-quote');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ProcessSystemError = exports.ProcessSystemError = function (_Error) {
  _inherits(ProcessSystemError, _Error);

  function ProcessSystemError(opts) {
    _classCallCheck(this, ProcessSystemError);

    var _this = _possibleConstructorReturn(this, (ProcessSystemError.__proto__ || Object.getPrototypeOf(ProcessSystemError)).call(this, '"' + opts.command + '" failed with code ' + opts.code));

    _this.name = 'ProcessSystemError';
    _this.command = opts.command;
    _this.args = opts.args;
    _this.options = opts.options;
    _this.code = opts.code;
    _this.originalError = opts.originalError;
    return _this;
  }

  return ProcessSystemError;
}(Error);

var ProcessExitError = exports.ProcessExitError = function (_Error2) {
  _inherits(ProcessExitError, _Error2);

  function ProcessExitError(opts) {
    _classCallCheck(this, ProcessExitError);

    var _this2 = _possibleConstructorReturn(this, (ProcessExitError.__proto__ || Object.getPrototypeOf(ProcessExitError)).call(this, '"' + opts.command + '" failed with code ' + opts.code + '\n\n' + opts.stderr));

    _this2.name = 'ProcessExitError';
    _this2.command = opts.command;
    _this2.args = opts.args;
    _this2.options = opts.options;
    _this2.code = opts.code;
    _this2.stdout = opts.stdout;
    _this2.stderr = opts.stderr;
    return _this2;
  }

  return ProcessExitError;
}(Error);

var platformPathPromise = void 0;

var blockingQueues = {};
var COMMON_BINARY_PATHS = ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin'];

/**
 * Captures the value of the PATH env variable returned by Darwin's (OS X) `path_helper` utility.
 * `path_helper -s`'s return value looks like this:
 *
 *     PATH="/usr/bin"; export PATH;
 */
var DARWIN_PATH_HELPER_REGEXP = /PATH="([^"]+)"/;

var STREAM_NAMES = ['stdin', 'stdout', 'stderr'];

function getPlatformPath() {
  // Do not return the cached value if we are executing under the test runner.
  if (platformPathPromise && process.env.NODE_ENV !== 'test') {
    // Path is being fetched, await the Promise that's in flight.
    return platformPathPromise;
  }

  // We do not cache the result of this check because we have unit tests that temporarily redefine
  // the value of process.platform.
  if (process.platform === 'darwin') {
    // OS X apps don't inherit PATH when not launched from the CLI, so reconstruct it. This is a
    // bug, filed against Atom Linter here: https://github.com/AtomLinter/Linter/issues/150
    // TODO(jjiaa): remove this hack when the Atom issue is closed
    platformPathPromise = new Promise(function (resolve, reject) {
      _child_process2.default.execFile('/usr/libexec/path_helper', ['-s'], function (error, stdout, stderr) {
        if (error) {
          reject(error);
        } else {
          var match = stdout.toString().match(DARWIN_PATH_HELPER_REGEXP);
          resolve(match && match.length > 1 ? match[1] : '');
        }
      });
    });
  } else {
    platformPathPromise = Promise.resolve('');
  }

  return platformPathPromise;
}

function logError() {
  var _console;

  // Can't use nuclide-logging here to not cause cycle dependency.
  /*eslint-disable no-console*/
  (_console = console).error.apply(_console, arguments);
  /*eslint-enable no-console*/
}

function monitorStreamErrors(process, command, args, options) {
  STREAM_NAMES.forEach(function (streamName) {
    // $FlowIssue
    var stream = process[streamName];
    if (stream == null) {
      return;
    }
    stream.on('error', function (error) {
      // This can happen without the full execution of the command to fail,
      // but we want to learn about it.
      logError('stream error on stream ' + streamName + ' with command:', command, args, options, 'error:', error);
    });
  });
}function createArgsForScriptCommand(command) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  if (process.platform === 'darwin') {
    // On OS X, script takes the program to run and its arguments as varargs at the end.
    return ['-q', '/dev/null', command].concat(args);
  } else {
    // On Linux, script takes the command to run as the -c parameter.
    var allArgs = [command].concat(args);
    return ['-q', '/dev/null', '-c', (0, _shellQuote.quote)(allArgs)];
  }
}

/**
 * Basically like safeSpawn, but runs the command with the `script` command.
 * `script` ensures terminal-like environment and commands we run give colored output.
 */
function scriptSafeSpawn(command) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var newArgs = createArgsForScriptCommand(command, args);
  return safeSpawn('script', newArgs, options);
}

/**
 * Wraps scriptSafeSpawn with an Observable that lets you listen to the stdout and
 * stderr of the spawned process.
 */
function scriptSafeSpawnAndObserveOutput(command) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  return _rxjs.Observable.create(function (observer) {
    var childProcess = void 0;
    scriptSafeSpawn(command, args, options).then(function (proc) {
      childProcess = proc;

      childProcess.stdout.on('data', function (data) {
        observer.next({ stdout: data.toString() });
      });

      var stderr = '';
      childProcess.stderr.on('data', function (data) {
        stderr += data;
        observer.next({ stderr: data.toString() });
      });

      childProcess.on('exit', function (exitCode) {
        if (exitCode !== 0) {
          observer.error(stderr);
        } else {
          observer.complete();
        }
        childProcess = null;
      });
    });

    return function () {
      if (childProcess) {
        childProcess.kill();
      }
    };
  });
}

/**
 * Creates an observable with the following properties:
 *
 * 1. It contains a process that's created using the provided factory upon subscription.
 * 2. It doesn't complete until the process exits (or errors).
 * 3. The process is killed when there are no more subscribers.
 *
 * IMPORTANT: The exit event does NOT mean that all stdout and stderr events have been received.
 */
function _createProcessStream(createProcess, throwOnError) {
  return _rxjs.Observable.create(function (observer) {
    var promise = Promise.resolve(createProcess());
    var process = void 0;
    var disposed = false;
    var exited = false;
    var maybeKill = function maybeKill() {
      if (process != null && disposed && !exited) {
        process.kill();
        process = null;
      }
    };

    promise.then(function (p) {
      process = p;
      maybeKill();
    });

    // Create a stream that contains the process but never completes. We'll use this to build the
    // completion conditions.
    var processStream = _rxjs.Observable.fromPromise(promise).merge(_rxjs.Observable.never());

    var errors = processStream.switchMap(function (p) {
      return _rxjs.Observable.fromEvent(p, 'error');
    });
    var exit = processStream.flatMap(function (p) {
      return _rxjs.Observable.fromEvent(p, 'exit', function (code, signal) {
        return signal;
      });
    })
    // An exit signal from SIGUSR1 doesn't actually exit the process, so skip that.
    .filter(function (signal) {
      return signal !== 'SIGUSR1';
    }).do(function () {
      exited = true;
    });
    var completion = throwOnError ? exit : exit.race(errors);

    return new _stream.CompositeSubscription(processStream.merge(throwOnError ? errors.flatMap(_rxjs.Observable.throw) : _rxjs.Observable.empty()).takeUntil(completion).subscribe(observer), function () {
      disposed = true;maybeKill();
    });
  });
  // TODO: We should really `.share()` this observable, but there seem to be issues with that and
  //   `.retry()` in Rx 3 and 4. Once we upgrade to Rx5, we should share this observable and verify
  //   that our retry logic (e.g. in adb-logcat) works.
}

function createProcessStream(createProcess) {
  return _createProcessStream(createProcess, true);
}

/**
 * Observe the stdout, stderr and exit code of a process.
 * stdout and stderr are split by newlines.
 */
function observeProcessExit(createProcess) {
  return _createProcessStream(createProcess, false).flatMap(function (process) {
    return _rxjs.Observable.fromEvent(process, 'exit').take(1);
  });
}

function getOutputStream(childProcess) {
  return _rxjs.Observable.fromPromise(Promise.resolve(childProcess)).flatMap(function (process) {
    // We need to start listening for the exit event immediately, but defer emitting it until the
    // output streams end.
    var exit = _rxjs.Observable.fromEvent(process, 'exit').take(1).map(function (exitCode) {
      return { kind: 'exit', exitCode: exitCode };
    }).publishReplay();
    var exitSub = exit.connect();

    var error = _rxjs.Observable.fromEvent(process, 'error').map(function (errorObj) {
      return { kind: 'error', error: errorObj };
    });
    var stdout = (0, _stream.splitStream)((0, _stream.observeStream)(process.stdout)).map(function (data) {
      return { kind: 'stdout', data: data };
    });
    var stderr = (0, _stream.splitStream)((0, _stream.observeStream)(process.stderr)).map(function (data) {
      return { kind: 'stderr', data: data };
    });

    return (0, _stream.takeWhileInclusive)(_rxjs.Observable.merge(_rxjs.Observable.merge(stdout, stderr).concat(exit), error), function (event) {
      return event.kind !== 'error' && event.kind !== 'exit';
    }).finally(function () {
      exitSub.unsubscribe();
    });
  });
}

/**
 * Observe the stdout, stderr and exit code of a process.
 */
function observeProcess(createProcess) {
  return _createProcessStream(createProcess, false).flatMap(getOutputStream);
}

/**
 * Returns a promise that resolves to the result of executing a process.
 *
 * @param command The command to execute.
 * @param args The arguments to pass to the command.
 * @param options Options for changing how to run the command.
 *     Supports the options listed here: http://nodejs.org/api/child_process.html
 *     in addition to the custom options listed in AsyncExecuteOptions.
 */
function asyncExecute(command, args) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // Clone passed in options so this function doesn't modify an object it doesn't own.
  var localOptions = _extends({}, options);

  var executor = function executor(resolve, reject) {
    var firstChild = void 0;
    var lastChild = void 0;

    var firstChildStderr = void 0;
    if (localOptions.pipedCommand) {
      // If a second command is given, pipe stdout of first to stdin of second. String output
      // returned in this function's Promise will be stderr/stdout of the second command.
      firstChild = (0, _crossSpawn2.default)(command, args, localOptions);
      monitorStreamErrors(firstChild, command, args, localOptions);
      firstChildStderr = '';

      firstChild.on('error', function (error) {
        // Resolve early with the result when encountering an error.
        resolve({
          command: [command].concat(args).join(' '),
          errorMessage: error.message,
          errorCode: error.code,
          stderr: firstChildStderr,
          stdout: ''
        });
      });

      if (firstChild.stderr != null) {
        firstChild.stderr.on('data', function (data) {
          firstChildStderr += data;
        });
      }

      lastChild = (0, _crossSpawn2.default)(localOptions.pipedCommand, localOptions.pipedArgs, localOptions);
      monitorStreamErrors(lastChild, command, args, localOptions);
      // pipe() normally pauses the writer when the reader errors (closes).
      // This is not how UNIX pipes work: if the reader closes, the writer needs
      // to also close (otherwise the writer process may hang.)
      // We have to manually close the writer in this case.
      if (lastChild.stdin != null && firstChild.stdout != null) {
        lastChild.stdin.on('error', function () {
          firstChild.stdout.emit('end');
        });
        firstChild.stdout.pipe(lastChild.stdin);
      }
    } else {
      lastChild = (0, _crossSpawn2.default)(command, args, localOptions);
      monitorStreamErrors(lastChild, command, args, localOptions);
      firstChild = lastChild;
    }

    var stderr = '';
    var stdout = '';
    var timeout = null;
    if (localOptions.timeout != null) {
      timeout = setTimeout(function () {
        // Prevent the other handlers from firing.
        lastChild.removeAllListeners();
        lastChild.kill();
        resolve({
          command: [command].concat(args).join(' '),
          errorMessage: 'Exceeded timeout of ' + localOptions.timeout + 'ms',
          errorCode: 'ETIMEDOUT',
          stderr: stderr,
          stdout: stdout
        });
      }, localOptions.timeout);
    }

    lastChild.on('close', function (exitCode) {
      resolve({
        exitCode: exitCode,
        stderr: stderr,
        stdout: stdout
      });
      if (timeout != null) {
        clearTimeout(timeout);
      }
    });

    lastChild.on('error', function (error) {
      // Return early with the result when encountering an error.
      resolve({
        command: [command].concat(args).join(' '),
        errorMessage: error.message,
        errorCode: error.code,
        stderr: stderr,
        stdout: stdout
      });
      if (timeout != null) {
        clearTimeout(timeout);
      }
    });

    if (lastChild.stderr != null) {
      lastChild.stderr.on('data', function (data) {
        stderr += data;
      });
    }
    if (lastChild.stdout != null) {
      lastChild.stdout.on('data', function (data) {
        stdout += data;
      });
    }

    if (typeof localOptions.stdin === 'string' && firstChild.stdin != null) {
      // Note that the Node docs have this scary warning about stdin.end() on
      // http://nodejs.org/api/child_process.html#child_process_child_stdin:
      //
      // "A Writable Stream that represents the child process's stdin. Closing
      // this stream via end() often causes the child process to terminate."
      //
      // In practice, this has not appeared to cause any issues thus far.
      firstChild.stdin.write(localOptions.stdin);
      firstChild.stdin.end();
    }
  };

  function makePromise() {
    if (localOptions.queueName === undefined) {
      return new Promise(executor);
    } else {
      if (!blockingQueues[localOptions.queueName]) {
        blockingQueues[localOptions.queueName] = new _promiseExecutors.PromiseQueue();
      }
      return blockingQueues[localOptions.queueName].submit(executor);
    }
  }

  return createExecEnvironment(localOptions.env || process.env, COMMON_BINARY_PATHS).then(function (val) {
    localOptions.env = val;
    return makePromise();
  }, function (error) {
    localOptions.env = localOptions.env || process.env;
    return makePromise();
  });
}function runCommand(command) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  return observeProcess(function () {
    return safeSpawn(command, args, options);
  }).reduce(function (acc, event) {
    switch (event.kind) {
      case 'stdout':
        acc.stdout += event.data;
        break;
      case 'stderr':
        acc.stderr += event.data;
        break;
      case 'error':
        acc.error = event.error;
        break;
      case 'exit':
        acc.exitCode = event.exitCode;
        break;
    }
    return acc;
  }, { error: null, stdout: '', stderr: '', exitCode: null }).map(function (acc) {
    if (acc.error != null) {
      throw new ProcessSystemError({
        command: command,
        args: args,
        options: options,
        code: acc.error.code, // Alias of errno
        originalError: acc.error });
    }
    if (acc.exitCode != null && acc.exitCode !== 0) {
      throw new ProcessExitError({
        command: command,
        args: args,
        options: options,
        code: acc.exitCode,
        stdout: acc.stdout,
        stderr: acc.stderr
      });
    }
    return acc.stdout;
  });
}

var __test__ = exports.__test__ = {
  DARWIN_PATH_HELPER_REGEXP: DARWIN_PATH_HELPER_REGEXP
};
//# sourceMappingURL=process.js.map