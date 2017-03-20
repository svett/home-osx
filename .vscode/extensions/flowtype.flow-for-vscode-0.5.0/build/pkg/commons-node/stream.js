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
exports.CompositeSubscription = exports.DisposableSubscription = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.observeStream = observeStream;
exports.observeRawStream = observeRawStream;
exports.splitStream = splitStream;
exports.bufferUntil = bufferUntil;
exports.cacheWhileSubscribed = cacheWhileSubscribed;
exports.diffSets = diffSets;
exports.reconcileSetDiffs = reconcileSetDiffs;
exports.toggle = toggle;
exports.compact = compact;
exports.takeWhileInclusive = takeWhileInclusive;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _eventKit = require('event-kit');

var _rxjs = require('rxjs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Observe a stream like stdout or stderr.
 */
function observeStream(stream) {
  return observeRawStream(stream).map(function (data) {
    return data.toString();
  });
}

function observeRawStream(stream) {
  var error = _rxjs.Observable.fromEvent(stream, 'error').flatMap(_rxjs.Observable.throw);
  return _rxjs.Observable.fromEvent(stream, 'data').merge(error).takeUntil(_rxjs.Observable.fromEvent(stream, 'end'));
}

/**
 * Splits a stream of strings on newlines.
 * Includes the newlines in the resulting stream.
 * Sends any non-newline terminated data before closing.
 * Never sends an empty string.
 */
function splitStream(input) {
  return _rxjs.Observable.create(function (observer) {
    var current = '';

    function onEnd() {
      if (current !== '') {
        observer.next(current);
        current = '';
      }
    }

    return input.subscribe(function (value) {
      var lines = (current + value).split('\n');
      current = lines.pop();
      lines.forEach(function (line) {
        return observer.next(line + '\n');
      });
    }, function (error) {
      onEnd();observer.error(error);
    }, function () {
      onEnd();observer.complete();
    });
  });
}

var DisposableSubscription = exports.DisposableSubscription = function () {
  function DisposableSubscription(subscription) {
    _classCallCheck(this, DisposableSubscription);

    this._subscription = subscription;
  }

  _createClass(DisposableSubscription, [{
    key: 'dispose',
    value: function dispose() {
      this._subscription.unsubscribe();
    }
  }]);

  return DisposableSubscription;
}();

var CompositeSubscription = exports.CompositeSubscription = function () {
  function CompositeSubscription() {
    var _this = this;

    _classCallCheck(this, CompositeSubscription);

    this._subscription = new _rxjs.Subscription();

    for (var _len = arguments.length, subscriptions = Array(_len), _key = 0; _key < _len; _key++) {
      subscriptions[_key] = arguments[_key];
    }

    subscriptions.forEach(function (sub) {
      _this._subscription.add(sub);
    });
  }

  _createClass(CompositeSubscription, [{
    key: 'unsubscribe',
    value: function unsubscribe() {
      this._subscription.unsubscribe();
    }
  }]);

  return CompositeSubscription;
}();

// TODO: We used to use `stream.buffer(stream.filter(...))` for this but it doesn't work in RxJS 5.
//  See https://github.com/ReactiveX/rxjs/issues/1610


function bufferUntil(stream, condition) {
  return _rxjs.Observable.create(function (observer) {
    var buffer = null;
    var flush = function flush() {
      if (buffer != null) {
        observer.next(buffer);
        buffer = null;
      }
    };
    return stream.subscribe(function (x) {
      if (buffer == null) {
        buffer = [];
      }
      buffer.push(x);
      if (condition(x)) {
        flush();
      }
    }, function (err) {
      flush();
      observer.error(err);
    }, function () {
      flush();
      observer.complete();
    });
  });
}

/**
 * Like Observable.prototype.cache(1) except it forgets the cached value when there are no
 * subscribers. This is useful so that if consumers unsubscribe and then subscribe much later, they
 * do not get an ancient cached value.
 *
 * This is intended to be used with cold Observables. If you have a hot Observable, `cache(1)` will
 * be just fine because the hot Observable will continue producing values even when there are no
 * subscribers, so you can be assured that the cached values are up-to-date.
 */
function cacheWhileSubscribed(input) {
  return input.multicast(function () {
    return new _rxjs.ReplaySubject(1);
  }).refCount();
}

function subtractSet(a, b) {
  var result = new Set();
  a.forEach(function (value) {
    if (!b.has(value)) {
      result.add(value);
    }
  });
  return result;
}

/**
 * Shallowly compare two Sets.
 */
function setsAreEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = a[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _item = _step.value;

      if (!b.has(_item)) {
        return false;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return true;
}

/**
 * Given a stream of sets, return a stream of diffs.
 * **IMPORTANT:** These sets are assumed to be immutable by convention. Don't mutate them!
 */
function diffSets(stream) {
  return _rxjs.Observable.concat(_rxjs.Observable.of(new Set()), // Always start with no items with an empty set
  stream).distinctUntilChanged(setsAreEqual).pairwise().map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        previous = _ref2[0],
        next = _ref2[1];

    return {
      added: subtractSet(next, previous),
      removed: subtractSet(previous, next)
    };
  });
}

/**
 * Give a stream of diffs, perform an action for each added item and dispose of the returned
 * disposable when the item is removed.
 */
function reconcileSetDiffs(diffs, addAction) {
  var itemsToDisposables = new Map();
  var disposeItem = function disposeItem(item) {
    var disposable = itemsToDisposables.get(item);
    (0, _assert2.default)(disposable != null);
    disposable.dispose();
    itemsToDisposables.delete(item);
  };
  var disposeAll = function disposeAll() {
    itemsToDisposables.forEach(function (disposable) {
      disposable.dispose();
    });
    itemsToDisposables.clear();
  };

  return new _eventKit.CompositeDisposable(new DisposableSubscription(diffs.subscribe(function (diff) {
    // For every item that got added, perform the add action.
    diff.added.forEach(function (item) {
      itemsToDisposables.set(item, addAction(item));
    });

    // "Undo" the add action for each item that got removed.
    diff.removed.forEach(disposeItem);
  })), new _eventKit.Disposable(disposeAll));
}

function toggle(source, toggler) {
  return toggler.distinctUntilChanged().switchMap(function (enabled) {
    return enabled ? source : _rxjs.Observable.empty();
  });
}

function compact(source) {
  // Flow does not understand the semantics of `filter`
  return source.filter(function (x) {
    return x != null;
  });
}

/**
 * Like `takeWhile`, but includes the first item that doesn't match the predicate.
 */
function takeWhileInclusive(source, predicate) {
  return _rxjs.Observable.create(function (observer) {
    return source.subscribe(function (x) {
      observer.next(x);
      if (!predicate(x)) {
        observer.complete();
      }
    }, function (err) {
      observer.error(err);
    }, function () {
      observer.complete();
    });
  });
}
//# sourceMappingURL=stream.js.map