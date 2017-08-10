'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _string = require('../string');

describe('relativeDate', function () {
  it('works', function () {
    var SECOND = 1000;
    var MINUTE = 60 * SECOND;
    var HOUR = 60 * MINUTE;
    var DAY = 24 * HOUR;
    var WEEK = 7 * DAY;
    var YEAR = DAY * 365;
    var MONTH = YEAR / 12;

    var reference = 157765000000; // 01.01.1975 00:00
    var now = new Date().getTime();

    expect((0, _string.relativeDate)(0)).toEqual(Math.round(now / YEAR) + ' years ago');
    expect((0, _string.relativeDate)(reference * SECOND, reference)).toEqual('just now');
    expect((0, _string.relativeDate)(reference - 41 * SECOND, reference)).toEqual('just now');
    expect((0, _string.relativeDate)(reference - 42 * SECOND, reference)).toEqual('a minute ago');
    expect((0, _string.relativeDate)(reference - MINUTE, reference)).toEqual('a minute ago');
    expect((0, _string.relativeDate)(reference - MINUTE * 1.5, reference)).toEqual('2 minutes ago');
    expect((0, _string.relativeDate)(reference - MINUTE * 59, reference)).toEqual('59 minutes ago');
    expect((0, _string.relativeDate)(reference - HOUR, reference)).toEqual('an hour ago');
    expect((0, _string.relativeDate)(reference - HOUR * 1.5, reference)).toEqual('2 hours ago');
    expect((0, _string.relativeDate)(reference - HOUR * 16, reference)).toEqual('16 hours ago');
    expect((0, _string.relativeDate)(reference - HOUR * 23, reference)).toEqual('23 hours ago');
    expect((0, _string.relativeDate)(reference - DAY * 1.8, reference)).toEqual('yesterday');
    expect((0, _string.relativeDate)(reference - DAY * 3, reference)).toEqual('3 days ago');
    expect((0, _string.relativeDate)(reference - DAY * 6, reference)).toEqual('6 days ago');
    expect((0, _string.relativeDate)(reference - WEEK, reference)).toEqual('a week ago');
    expect((0, _string.relativeDate)(reference - WEEK * 2, reference)).toEqual('2 weeks ago');
    expect((0, _string.relativeDate)(reference - WEEK * 4, reference)).toEqual('4 weeks ago');
    expect((0, _string.relativeDate)(reference - MONTH * 1.2, reference)).toEqual('a month ago');
    expect((0, _string.relativeDate)(reference - YEAR + HOUR, reference)).toEqual('12 months ago');
    expect((0, _string.relativeDate)(reference - YEAR, reference)).toEqual('a year ago');
    expect((0, _string.relativeDate)(reference - YEAR * 2, reference)).toEqual('2 years ago');
    expect((0, _string.relativeDate)(0, reference)).toEqual('5 years ago');
  });
});

describe('maybeToString', function () {
  it("returns 'undefined'", function () {
    expect((0, _string.maybeToString)(undefined)).toEqual('undefined');
  });

  it("returns 'null'", function () {
    expect((0, _string.maybeToString)(null)).toEqual('null');
  });

  it('returns an ordinary string', function () {
    expect((0, _string.maybeToString)('foo')).toEqual('foo');
  });
});
//# sourceMappingURL=string-spec.js.map