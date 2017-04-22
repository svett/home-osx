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
exports.default = once;

function once(fn) {
  var ret = void 0;
  return function () {
    // The type gymnastics here are so `fn` can be
    // garbage collected once we've used it.
    if (!fn) {
      return ret;
    } else {
      ret = fn.apply(this, arguments);
      fn = null;
      return ret;
    }
  };
}
//# sourceMappingURL=once.js.map