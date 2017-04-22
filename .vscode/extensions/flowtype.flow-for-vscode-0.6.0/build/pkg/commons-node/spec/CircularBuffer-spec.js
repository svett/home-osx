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

var _CircularBuffer = require('../CircularBuffer');

var _CircularBuffer2 = _interopRequireDefault(_CircularBuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('CircularBuffer', function () {

  describe('empty buffer', function () {
    it('verify ordinary API use for CircularBuffer with no elements added', function () {
      var buffer = new _CircularBuffer2.default(4);
      expect(buffer.capacity).toBe(4);

      // This verifies that CircularBuffer implements Iterable correctly by demonstrating that it
      // works with for/of.
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = buffer[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var element = _step.value;
          // eslint-disable-line no-unused-vars
          throw new Error('Should not iterate anything when empty.');
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
    });
  });

  describe('singleton buffer', function () {
    it('verify ordinary API use for CircularBuffer with one element', function () {
      var buffer = new _CircularBuffer2.default(1);
      expect(buffer.capacity).toBe(1);

      // This verifies that CircularBuffer implements Iterable correctly by demonstrating that it
      // works with for/of.
      buffer.push('foo');
      var elements1 = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = buffer[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var element = _step2.value;

          elements1.push(element);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      expect(elements1).toEqual(['foo']);

      // Because the buffer is of capacty 1, inserting one more element effectively
      // overwrites the entire contents.
      var elements2 = [];
      buffer.push('bar');
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = buffer[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _element = _step3.value;

          elements2.push(_element);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      expect(elements2).toEqual(['bar']);
    });
  });

  describe('that is not at capacity', function () {
    it('iterator works correctly when the buffer is half full', function () {
      var buffer = new _CircularBuffer2.default(4);
      expect(buffer.capacity).toBe(4);

      buffer.push('A');
      buffer.push('B');
      var elements = [];
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = buffer[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var element = _step4.value;

          elements.push(element);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      expect(elements).toEqual(['A', 'B']);
    });
  });

  describe('that is at capacity', function () {
    it('iterator works correctly when the buffer is exactly full', function () {
      var buffer = new _CircularBuffer2.default(4);
      expect(buffer.capacity).toBe(4);

      buffer.push('A');
      buffer.push('B');
      buffer.push('C');
      buffer.push('D');
      var elements = [];
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = buffer[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var element = _step5.value;

          elements.push(element);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      expect(elements).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('that is just over capacity', function () {
    it('iterator works correctly when the buffer has had to wrap around', function () {
      var buffer = new _CircularBuffer2.default(4);
      expect(buffer.capacity).toBe(4);

      buffer.push('A');
      buffer.push('B');
      buffer.push('C');
      buffer.push('D');
      buffer.push('E');
      var elements = [];
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = buffer[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var element = _step6.value;

          elements.push(element);
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      expect(elements).toEqual(['B', 'C', 'D', 'E']);
    });
  });

  describe('that has wrapped around more than once', function () {
    it('iterator works correctly when the buffer has had to wrap around', function () {
      var buffer = new _CircularBuffer2.default(4);
      expect(buffer.capacity).toBe(4);

      buffer.push('A');
      buffer.push('B');
      buffer.push('C');
      buffer.push('D');
      buffer.push('1');
      buffer.push('2');
      buffer.push('3');
      buffer.push('4');
      buffer.push('E');
      buffer.push('F');
      var elements = [];
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = buffer[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var element = _step7.value;

          elements.push(element);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }

      expect(elements).toEqual(['3', '4', 'E', 'F']);
    });
  });

  it('throws when modified during iteration', function () {
    expect(function () {
      var buffer = new _CircularBuffer2.default(4);
      buffer.push('A');
      buffer.push('B');
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = buffer[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var element = _step8.value;
          // eslint-disable-line no-unused-vars
          buffer.push('C');
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
    }).toThrow(new Error('CircularBuffer was modified during iteration.'));
  });

  describe('rejects bad constructor arguments', function () {
    it('rejects an empty buffer', function () {
      expect(function () {
        return new _CircularBuffer2.default(0);
      }).toThrow(new Error('capacity must be greater than zero, but was 0.'));
    });

    it('rejects a negative capacity', function () {
      expect(function () {
        return new _CircularBuffer2.default(-1);
      }).toThrow(new Error('capacity must be greater than zero, but was -1.'));
    });

    it('rejects a non-integer capacity', function () {
      expect(function () {
        return new _CircularBuffer2.default(1.5);
      }).toThrow(new Error('capacity must be an integer, but was 1.5.'));
    });
  });
});
//# sourceMappingURL=CircularBuffer-spec.js.map