'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _debounce = require('../debounce');

var _debounce2 = _interopRequireDefault(_debounce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('debounce()', function () {
  it('only calls function once after time advances', function () {
    var timerCallback = jasmine.createSpy('timerCallback');
    var debouncedFunc = (0, _debounce2.default)(timerCallback, 100, false);

    debouncedFunc();
    expect(timerCallback).not.toHaveBeenCalled();

    window.advanceClock(101);
    expect(timerCallback).toHaveBeenCalled();
  });
});
//# sourceMappingURL=debounce-spec.js.map