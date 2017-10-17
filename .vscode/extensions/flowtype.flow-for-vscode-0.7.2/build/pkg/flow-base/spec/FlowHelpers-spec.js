'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _FlowHelpers = require('../lib/FlowHelpers');

describe('FlowHelpers', function () {
  describe('groupParamNames', function () {
    it('should return a group for each argument', function () {
      var args = ['arg1', 'arg2'];
      expect((0, _FlowHelpers.groupParamNames)(args)).toEqual(args.map(function (arg) {
        return [arg];
      }));
    });

    it('should group optional params', function () {
      var args = ['arg1', 'arg2?'];
      expect((0, _FlowHelpers.groupParamNames)(args)).toEqual([args]);
    });

    it('should only group optional params at the end', function () {
      // I have no idea why you are even allowed to have optional params in the middle, but I guess
      // we have to deal with it.
      var args = ['arg1', 'arg2?', 'arg3', 'arg4?'];
      var expectedGrouping = [['arg1'], ['arg2?'], ['arg3', 'arg4?']];
      expect((0, _FlowHelpers.groupParamNames)(args)).toEqual(expectedGrouping);
    });

    it('should group all params if they are all optional', function () {
      var args = ['arg1?', 'arg2?'];
      expect((0, _FlowHelpers.groupParamNames)(args)).toEqual([args]);
    });

    it('should return an empty array for no arguments', function () {
      expect((0, _FlowHelpers.groupParamNames)([])).toEqual([]);
    });
  });
});
//# sourceMappingURL=FlowHelpers-spec.js.map