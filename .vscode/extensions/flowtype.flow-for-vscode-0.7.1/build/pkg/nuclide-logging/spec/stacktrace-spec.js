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

var _stacktrace = require('../lib/stacktrace');

var _stacktrace2 = _interopRequireDefault(_stacktrace);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var STACK_FRAME_PROPERTIES = ['functionName', 'methodName', 'fileName', 'lineNumber', 'columnNumber', 'evalOrigin', 'isTopLevel', 'isEval', 'isNative', 'isConstructor'];

function validateStructuredStackTraceCreated(e) {
  // $FlowIssue
  expect(e.stackTrace instanceof Array).toBe(true);
  // $FlowIssue
  e.stackTrace.forEach(function (frame) {
    var keys = Object.keys(frame);
    STACK_FRAME_PROPERTIES.forEach(function (property) {
      expect(keys.indexOf(property) >= 0).toBe(true);
    });
  });
}

describe('stacktrace hook', function () {
  afterEach(function () {
    // $FlowFixMe
    delete Error.prepareStackTrace;
    _stacktrace.__test__.resetPrepareStackTraceHooked();
  });

  it('creates hooked prepareStackTrace', function () {
    var createHookedPrepareStackTrace = _stacktrace.__test__.createHookedPrepareStackTrace;

    var prepareStackTrace = function prepareStackTrace(error, frames) {
      return 'test';
    };
    var hooked = createHookedPrepareStackTrace(prepareStackTrace);
    expect(hooked.name).toBe('nuclideHookedPrepareStackTrace');
    expect(hooked !== prepareStackTrace).toBe(true);
  });

  it('does\'t hook a hooked function again', function () {
    var createHookedPrepareStackTrace = _stacktrace.__test__.createHookedPrepareStackTrace;

    var prepareStackTrace = function prepareStackTrace(error, frames) {
      return 'test';
    };
    var hooked = createHookedPrepareStackTrace(prepareStackTrace);
    expect(hooked.name).toBe('nuclideHookedPrepareStackTrace');
    expect(hooked !== prepareStackTrace).toBe(true);

    var hookedTwice = createHookedPrepareStackTrace(hooked);
    expect(hookedTwice.name).toBe('nuclideHookedPrepareStackTrace');
    expect(hookedTwice).toBe(hooked);
  });

  it('generates structured stacktrace', function () {
    (0, _stacktrace2.default)();
    var e = new Error();
    // e.stackTrace won't be availabe until e.stack is called.
    // $FlowIssue
    expect(e.stackTrace).toBe(undefined);
    expect(_typeof(e.stack)).toBe('string');
    validateStructuredStackTraceCreated(e);
  });

  it('doesn\'t screw up previous customization', function () {

    var customizedStack = 'There is no spoon';
    // $FlowFixMe
    Error.prepareStackTrace = function (_, frames) {
      return customizedStack;
    };

    var e = new Error();
    // e.stack is customized.
    expect(e.stack).toBe(customizedStack);
    // $FlowIssue
    expect(e.stackTrace).toBe(undefined);

    (0, _stacktrace2.default)();

    e = new Error();
    // $FlowIssue
    expect(e.stackTrace).toBe(undefined);
    // e.stack is still customized.
    expect(e.stack).toBe(customizedStack);
    validateStructuredStackTraceCreated(e);
  });

  it('support following up customization', function () {
    (0, _stacktrace2.default)();

    var e = new Error();
    // $FlowIssue
    expect(e.stackTrace).toBe(undefined);
    expect(_typeof(e.stack)).toBe('string');
    validateStructuredStackTraceCreated(e);

    // $FlowFixMe
    var originalPrepareStackTrace = Error.prepareStackTrace;

    // Add customization and verify it works.
    var customizedStack = 'There is no spoon';
    // $FlowFixMe
    Error.prepareStackTrace = function (_, frames) {
      return customizedStack;
    };

    e = new Error();
    expect(e.stack).toBe(customizedStack);
    validateStructuredStackTraceCreated(e);

    // Revert the customization and verify it has been reverted.
    // $FlowFixMe
    Error.prepareStackTrace = originalPrepareStackTrace;
    e = new Error();
    // $FlowIssue
    expect(e.stackTrace).toBe(undefined);
    expect(e.stack !== customizedStack).toBe(true);
    validateStructuredStackTraceCreated(e);
  });
});
//# sourceMappingURL=stacktrace-spec.js.map