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

/* eslint-disable */

module.exports = {
  foo: 5,
  bar: function bar(arg) {
    return this.baz(arg);
  },

  baz: function baz(arg) {},
  asdf: function asdf(arg) {},
  jkl: function jkl(arg) {},
  asdfjkl: function asdfjkl(arg) {},

  thing: thing,
  stuff: stuff
};

// We should not render these
module.notexports = {};
notmodule.exports = {};
//# sourceMappingURL=exports.js.map