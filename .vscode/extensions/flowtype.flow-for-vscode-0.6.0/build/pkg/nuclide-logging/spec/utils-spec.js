'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _utils = require('../lib/utils');

var _stacktrace = require('../lib/stacktrace');

var _stacktrace2 = _interopRequireDefault(_stacktrace);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Construct a loggingEvent following log4js event format.
function createLoggingEvent() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return {
    startTime: new Date(),
    categoryName: 'test',
    data: args,
    level: {
      level: 40000,
      levelStr: 'ERROR'
    },
    logger: {
      category: 'arsenal',
      _events: {
        log: [null, null]
      }
    }
  };
}

describe('Logview Appender Utils.', function () {
  beforeEach(function () {
    (0, _stacktrace2.default)();
  });

  it('patches error of loggingEvent', function () {
    var error = new Error('test');
    var loggingEventWithError = createLoggingEvent(error);
    expect(loggingEventWithError.data[0] instanceof Error).toBe(true);
    expect(loggingEventWithError.data[0]).toBe(error);

    var patchedLoggingEventWithError = (0, _utils.patchErrorsOfLoggingEvent)(loggingEventWithError);
    expect(patchedLoggingEventWithError.data[0] instanceof Error).toBe(false);
    expect(_typeof(patchedLoggingEventWithError.data[0].stack)).toBe('string');
    expect(patchedLoggingEventWithError.data[0].stackTrace instanceof Array).toBe(true);
  });

  it('addes error if no error exists in loggingEvent.data', function () {
    var loggingEventWithoutError = createLoggingEvent();
    expect(loggingEventWithoutError.data.length).toBe(0);
    var patchedLoggingEventWithoutError = (0, _utils.patchErrorsOfLoggingEvent)(loggingEventWithoutError);
    expect(_typeof(patchedLoggingEventWithoutError.data[0].stack)).toBe('string');
  });

  it('Test serialization/deserialization utils.', function () {
    var loggingEvent = (0, _utils.patchErrorsOfLoggingEvent)(createLoggingEvent(new Error('123')));

    var serialization = (0, _utils.serializeLoggingEvent)(loggingEvent);
    expect(typeof serialization === 'string').toBe(true);

    var deserialization = (0, _utils.deserializeLoggingEvent)(serialization);
    expect(deserialization.startTime.toString()).toEqual(loggingEvent.startTime.toString());
    expect(deserialization.categoryName).toEqual(loggingEvent.categoryName);
    expect(JSON.stringify(deserialization.level)).toEqual(JSON.stringify(loggingEvent.level));
    expect(JSON.stringify(deserialization.logger)).toEqual(JSON.stringify(loggingEvent.logger));
    expect(JSON.stringify(deserialization.data[0])).toEqual(JSON.stringify(loggingEvent.data[0]));
  });
});
//# sourceMappingURL=utils-spec.js.map