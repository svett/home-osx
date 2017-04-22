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
exports.observableToBuildTaskInfo = observableToBuildTaskInfo;

var _stream = require('./stream');

/**
 * Subscribe to an observable and transform it into the TaskInfo interface. The TaskInfo interface
 * allows us to interop with other packages without forcing them to use Rx, but internally,
 * Observables are probably how we'll always build the functionality.
 */
function observableToBuildTaskInfo(observable) {
  var events = observable.share().publish();
  var subscription = events.connect();

  return {
    observeProgress: function observeProgress(callback) {
      return new _stream.DisposableSubscription(events.map(function (event) {
        return event.progress;
      }).subscribe({ next: callback, error: function error() {} }));
    },
    onDidComplete: function onDidComplete(callback) {
      return new _stream.DisposableSubscription(events.subscribe({ complete: callback, error: function error() {} }));
    },
    onDidError: function onDidError(callback) {
      return new _stream.DisposableSubscription(events.subscribe({ error: callback }));
    },
    cancel: function cancel() {
      subscription.unsubscribe();
    }
  };
}
//# sourceMappingURL=observableToBuildTaskInfo.js.map