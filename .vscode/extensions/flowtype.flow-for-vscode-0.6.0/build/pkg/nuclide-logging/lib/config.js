'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var getServerLogAppenderConfig = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.t1 = (0, _systemInfo.isRunningInTest)() || (0, _systemInfo.isRunningInClient)();

            if (_context.t1) {
              _context.next = 5;
              break;
            }

            _context.next = 4;
            return _fsPromise2.default.exists(scribeAppenderPath);

          case 4:
            _context.t1 = !_context.sent;

          case 5:
            _context.t0 = _context.t1;

            if (_context.t0) {
              _context.next = 10;
              break;
            }

            _context.next = 9;
            return _ScribeProcess2.default.isScribeCatOnPath();

          case 9:
            _context.t0 = !_context.sent;

          case 10:
            if (!_context.t0) {
              _context.next = 12;
              break;
            }

            return _context.abrupt('return', null);

          case 12:
            return _context.abrupt('return', {
              type: 'logLevelFilter',
              level: 'DEBUG',
              appender: {
                type: scribeAppenderPath,
                scribeCategory: 'errorlog_arsenal'
              }
            });

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getServerLogAppenderConfig() {
    return _ref.apply(this, arguments);
  };
}();

/**
 * @return The absolute path to the log file for the specified date.
 */


var _ScribeProcess = require('../../commons-node/ScribeProcess');

var _ScribeProcess2 = _interopRequireDefault(_ScribeProcess);

var _systemInfo = require('../../commons-node/system-info');

var _fsPromise = require('../../commons-node/fsPromise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _userInfo = require('../../commons-node/userInfo');

var _userInfo2 = _interopRequireDefault(_userInfo);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _main = require('../../nuclide-remote-uri/lib/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var LOG_DIRECTORY = _main2.default.join(_os2.default.tmpdir(), '/nuclide-' + (0, _userInfo2.default)().username + '-logs');
var LOG_FILE_PATH = _main2.default.join(LOG_DIRECTORY, 'nuclide.log');

var logDirectoryInitialized = false;
var scribeAppenderPath = _main2.default.join(__dirname, '../fb/scribeAppender.js');

var LOG4JS_DATE_FORMAT = '-yyyy-MM-dd';

function getPathToLogFileForDate(targetDate) {
  var log4jsFormatter = require('log4js/lib/date_format').asString;
  return LOG_FILE_PATH + log4jsFormatter(LOG4JS_DATE_FORMAT, targetDate);
}

/**
 * @return The absolute path to the log file for today.
 */
function getPathToLogFileForToday() {
  return getPathToLogFileForDate(new Date());
}

module.exports = {
  getDefaultConfig: function getDefaultConfig() {
    var _this = this;

    return _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
      var config, serverLogAppenderConfig;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (logDirectoryInitialized) {
                _context2.next = 4;
                break;
              }

              _context2.next = 3;
              return _fsPromise2.default.mkdirp(LOG_DIRECTORY);

            case 3:
              logDirectoryInitialized = true;

            case 4:
              config = {
                appenders: [{
                  type: 'logLevelFilter',
                  level: 'INFO',
                  appender: {
                    type: _main2.default.join(__dirname, './consoleAppender')
                  }
                }, {
                  type: 'dateFile',
                  alwaysIncludePattern: true,
                  absolute: true,
                  filename: LOG_FILE_PATH,
                  pattern: LOG4JS_DATE_FORMAT,
                  layout: {
                    type: 'pattern',
                    // Format log in following pattern:
                    // yyyy-MM-dd HH:mm:ss.mil $Level (pid:$pid) $categroy - $message.
                    pattern: '%d{ISO8601} %p (pid:' + process.pid + ') %c - %m'
                  }
                }]
              };
              _context2.next = 7;
              return getServerLogAppenderConfig();

            case 7:
              serverLogAppenderConfig = _context2.sent;

              if (serverLogAppenderConfig) {
                config.appenders.push(serverLogAppenderConfig);
              }

              return _context2.abrupt('return', config);

            case 10:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }))();
  },

  getPathToLogFileForToday: getPathToLogFileForToday,
  LOG_FILE_PATH: LOG_FILE_PATH,
  __test__: {
    getPathToLogFileForDate: getPathToLogFileForDate
  }
};
//# sourceMappingURL=config.js.map