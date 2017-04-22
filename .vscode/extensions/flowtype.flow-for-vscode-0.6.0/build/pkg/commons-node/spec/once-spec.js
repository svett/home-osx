'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _once = require('../once');

var _once2 = _interopRequireDefault(_once);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('once', function () {
  it('correctly calls only once', function () {
    var num = 1;
    var onceFn = (0, _once2.default)(function (n) {
      return num += n;
    });
    expect(onceFn(2)).toEqual(3);
    expect(onceFn(2)).toEqual(3);
  });
});
//# sourceMappingURL=once-spec.js.map