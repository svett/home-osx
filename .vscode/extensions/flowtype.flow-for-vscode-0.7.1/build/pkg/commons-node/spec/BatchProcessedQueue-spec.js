'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _BatchProcessedQueue = require('../BatchProcessedQueue');

var _BatchProcessedQueue2 = _interopRequireDefault(_BatchProcessedQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('analytics - BatchProcessedQueue', function () {

  it('regular operation', function () {
    var handler = jasmine.createSpy('handler');
    var queue = new _BatchProcessedQueue2.default(5000, handler);

    queue.add(1);
    queue.add(2);
    queue.add(3);
    queue.add(4);
    queue.add(5);
    expect(handler).not.toHaveBeenCalled();

    advanceClock(4999);
    expect(handler).not.toHaveBeenCalled();
    advanceClock(1);
    expect(handler).toHaveBeenCalledWith([1, 2, 3, 4, 5]);

    queue.add(42);
    advanceClock(10000);
    expect(handler).toHaveBeenCalledWith([42]);
  });
});
//# sourceMappingURL=BatchProcessedQueue-spec.js.map