'use strict';
'use babel';
/* @noflow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

describe('foo', function () {
  var x = 5;
  it('should work', function () {
    describe('not displaying this', function () {
      return x;
    });
  });
});

describe('bar', function () {
  it('should work with a normal function', function () {});
});

it('should not display this', function () {});
//# sourceMappingURL=jasmine.js.map