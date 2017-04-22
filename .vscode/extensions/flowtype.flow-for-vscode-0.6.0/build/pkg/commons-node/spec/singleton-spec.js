'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _singleton = require('../singleton');

var _singleton2 = _interopRequireDefault(_singleton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('singleton', function () {
  var count = 0;
  var field = 'singleton-test-field';

  function get() {
    return _singleton2.default.get(field, function () {
      return count++;
    });
  }

  function clear() {
    _singleton2.default.clear(field);
  }

  function reset() {
    return _singleton2.default.reset(field, function () {
      return count++;
    });
  }

  it('get', function () {
    var id1 = get();
    var id2 = get();
    expect(id1).toEqual(id2);
  });

  it('clear', function () {
    var id1 = get();

    clear();

    var id2 = get();
    expect(id2 !== id1).toBe(true);
  });

  it('reset', function () {
    var id1 = get();

    var id2 = reset();
    expect(id2).not.toEqual(id1);

    var id3 = get();
    expect(id3).toEqual(id2);
  });
});
//# sourceMappingURL=singleton-spec.js.map