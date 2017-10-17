'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _observableToBuildTaskInfo = require('../observableToBuildTaskInfo');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _rxjs = require('rxjs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('observableToBuildTaskInfo', function () {

  it('subscribes when the function is called', function () {
    var events = _rxjs.Observable.never();
    spyOn(events, 'subscribe').andCallThrough();
    (0, _observableToBuildTaskInfo.observableToBuildTaskInfo)(events);
    expect(events.subscribe).toHaveBeenCalled();
  });

  it('unsubscribes when TaskInfo.cancel is called', function () {
    var events = _rxjs.Observable.never();
    var sub = new _rxjs.Subscription();
    spyOn(events, 'subscribe').andReturn(sub);
    spyOn(sub, 'unsubscribe').andCallThrough();
    var taskInfo = (0, _observableToBuildTaskInfo.observableToBuildTaskInfo)(events);
    expect(sub.unsubscribe).not.toHaveBeenCalled();
    taskInfo.cancel();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('relays progress events', function () {
    var events = new _rxjs.Subject();
    var taskInfo = (0, _observableToBuildTaskInfo.observableToBuildTaskInfo)(events);
    var spy = jasmine.createSpy();
    (0, _assert2.default)(taskInfo.observeProgress != null);
    taskInfo.observeProgress(spy);
    events.next({ kind: 'progress', progress: null });
    events.next({ kind: 'progress', progress: 0 });
    events.next({ kind: 'progress', progress: 0.5 });
    events.next({ kind: 'progress', progress: 1 });
    expect(spy.calls.map(function (call) {
      return call.args[0];
    })).toEqual([null, 0, 0.5, 1]);
  });
});
//# sourceMappingURL=observableToBuildTaskInfo-spec.js.map