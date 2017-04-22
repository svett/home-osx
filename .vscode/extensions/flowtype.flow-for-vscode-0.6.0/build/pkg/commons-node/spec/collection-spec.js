'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _collection = require('../collection');

describe('arrayRemove', function () {
  var a = void 0;
  var empty = void 0;
  var single = void 0;

  beforeEach(function () {
    a = ['a', 'b', 'c'];
    empty = [];
    single = ['x'];
  });

  it('removes an element properly', function () {
    (0, _collection.arrayRemove)(a, 'b');
    expect(a).toEqual(['a', 'c']);
  });

  it('removes the first element properly', function () {
    (0, _collection.arrayRemove)(a, 'a');
    expect(a).toEqual(['b', 'c']);
  });

  it('removes the last element properly', function () {
    (0, _collection.arrayRemove)(a, 'c');
    expect(a).toEqual(['a', 'b']);
  });

  it('does nothing if the element is not found', function () {
    (0, _collection.arrayRemove)(a, 'd');
    expect(a).toEqual(['a', 'b', 'c']);
  });

  it('does nothing to an empty array', function () {
    (0, _collection.arrayRemove)(empty, 'a');
    expect(empty).toEqual([]);
  });

  it('works when there is a single element', function () {
    (0, _collection.arrayRemove)(single, 'x');
    expect(single).toEqual([]);
  });
});

describe('arrayEqual', function () {
  it('checks boolean elements', function () {
    expect((0, _collection.arrayEqual)([true, false, true], [true, false, true])).toBe(true);
    expect((0, _collection.arrayEqual)([true], [false])).toBe(false);
  });

  it('checks number elements', function () {
    expect((0, _collection.arrayEqual)([1, 2, 3], [1, 2, 3])).toBe(true);
    expect((0, _collection.arrayEqual)([1, 5, 3], [1, 2, 3])).toBe(false);
  });

  it('checks object elements', function () {
    expect((0, _collection.arrayEqual)([{}], [{}])).toBe(false);
    expect((0, _collection.arrayEqual)([{ x: 1 }, { x: 2 }], [{ x: 1 }, { x: 2 }], function (a, b) {
      return a.x === b.x;
    })).toBe(true);
  });

  it('works with arrays of different lengths', function () {
    expect((0, _collection.arrayEqual)([1, 2], [1, 2, 3])).toBe(false);
    expect((0, _collection.arrayEqual)([1, 2, 3], [1, 2])).toBe(false);
  });
});

describe('arrayCompact', function () {
  it('filters out null and undefined elements', function () {
    expect((0, _collection.arrayCompact)([0, false, '', [], null, undefined])).toEqual([0, false, '', []]);
  });
});

describe('mapUnion', function () {
  it('merges two unique maps', function () {
    var map1 = new Map([['key1', 'value1'], ['key2', 'value2']]);
    var map2 = new Map([['key3', 'value3'], ['key4', 'value4']]);
    var result = (0, _collection.mapUnion)(map1, map2);

    expect(result.size).toBe(4);
    expect(result.get('key1')).toBe('value1');
    expect(result.get('key2')).toBe('value2');
    expect(result.get('key3')).toBe('value3');
    expect(result.get('key4')).toBe('value4');
  });

  it('overrodes with the values of the latest maps', function () {
    var map1 = new Map([['commonKey', 'value1'], ['key2', 'value2']]);
    var map2 = new Map([['commonKey', 'value3'], ['key4', 'value4']]);
    var result = _collection.mapUnion.apply(undefined, [map1, map2]);

    expect(result.size).toBe(3);
    expect(result.get('commonKey')).toBe('value3');
    expect(result.get('key2')).toBe('value2');
    expect(result.get('key4')).toBe('value4');
  });
});

describe('isEmpty', function () {
  it('correctly identifies empty Objects', function () {
    expect((0, _collection.isEmpty)({})).toEqual(true);
  });

  it('correctly identifies non-empty Objects', function () {
    var proto = { a: 1, b: 2, c: 3 };
    var objWithOwnProperties = Object.create(proto, { foo: { value: 'bar' } });
    var objWithoutOwnProperties = Object.create(proto);

    expect((0, _collection.isEmpty)({ a: 1 })).toEqual(false);
    expect((0, _collection.isEmpty)(objWithOwnProperties)).toEqual(false);
    expect((0, _collection.isEmpty)(objWithoutOwnProperties)).toEqual(false);
  });
});

describe('keyMirror', function () {
  it('correctly mirrors objects', function () {
    expect((0, _collection.keyMirror)({ a: null, b: null })).toEqual({ a: 'a', b: 'b' });
  });
});

describe('setIntersect', function () {
  it('intersects', function () {
    var set1 = new Set(['foo', 'bar', 'baz']);
    var set2 = new Set(['fool', 'bar', 'bazl']);
    var result = (0, _collection.setIntersect)(set1, set2);

    expect(result.size).toBe(1);
    expect(result.has('bar')).toBe(true);
  });
});

describe('collect', function () {
  it('collects key-value pairs into a Map of arrays', function () {
    var pairs = [['neither', 1], ['neither', 2], ['fizz', 3], ['neither', 4], ['buzz', 5], ['fizz', 6], ['neither', 7], ['neither', 8], ['fizz', 9]];
    var result = (0, _collection.collect)(pairs);

    expect(result.size).toBe(3);
    expect(result.get('fizz')).toEqual([3, 6, 9]);
    expect(result.get('buzz')).toEqual([5]);
    expect(result.get('neither')).toEqual([1, 2, 4, 7, 8]);
  });
});

describe('MultiMap', function () {
  var multimap = null;

  beforeEach(function () {
    multimap = new _collection.MultiMap();
  });

  afterEach(function () {
    // check representation invariants
    var size = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = multimap._map[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2);

        var set = _step$value[1];

        expect(set.size).toBeGreaterThan(0);
        size += set.size;
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

    expect(multimap.size).toEqual(size);
  });

  it("returns an empty set when a binding doesn't exist", function () {
    expect(multimap.get(4)).toEqual(new Set());
  });

  it('returns itself from add', function () {
    expect(multimap.add(1, 2)).toBe(multimap);
  });

  it('properly adds a single binding', function () {
    multimap.add(1, 2);
    expect(multimap.size).toEqual(1);
    expect(multimap.get(1)).toEqual(new Set([2]));
  });

  it('properly adds multiple bindings', function () {
    multimap.add(1, 2).add(1, 3).add(10, 11);
    expect(multimap.size).toEqual(3);
    expect(multimap.get(1)).toEqual(new Set([2, 3]));
    expect(multimap.get(10)).toEqual(new Set([11]));
  });

  it('returns false from delete when nothing was deleted', function () {
    multimap.add(1, 2);
    expect(multimap.delete(1, 3)).toBe(false);
    expect(multimap.delete(2, 3)).toBe(false);
  });

  it('properly deletes a single binding', function () {
    multimap.add(1, 2).add(1, 3).add(10, 11);
    expect(multimap.delete(1, 2)).toBe(true);
    expect(multimap.get(1)).toEqual(new Set([3]));
    expect(multimap.get(10)).toEqual(new Set([11]));
    expect(multimap.size).toEqual(2);
  });

  it('returns false from deleteAll when nothing was deleted', function () {
    expect(multimap.deleteAll(5)).toBe(false);
  });

  it('properly deletes all bindings for a given key', function () {
    multimap.add(1, 2).add(1, 3);
    expect(multimap.deleteAll(1)).toBe(true);
    expect(multimap.size).toEqual(0);
    expect(multimap.get(1)).toEqual(new Set());
  });

  it('properly clears', function () {
    multimap.add(1, 2).add(1, 3).add(10, 11);
    multimap.clear();
    expect(multimap.size).toEqual(0);
    expect(multimap.get(1)).toEqual(new Set());
    expect(multimap.get(10)).toEqual(new Set());
  });

  it('checks membership with has', function () {
    multimap.add(1, 2);
    expect(multimap.has(5, 6)).toBe(false);
    expect(multimap.has(1, 2)).toBe(true);
    expect(multimap.has(1, 3)).toBe(false);
  });

  it('checks membership with hasAny', function () {
    multimap.add(1, 2);
    expect(multimap.hasAny(1)).toBe(true);
    expect(multimap.hasAny(2)).toBe(false);
  });
});
//# sourceMappingURL=collection-spec.js.map