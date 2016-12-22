function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 */

var _utilsFlatten = require('../../utils/flatten');

var _utilsFlatten2 = _interopRequireDefault(_utilsFlatten);

var _constantsMarkers = require('../../constants/markers');

var _constantsMarkers2 = _interopRequireDefault(_constantsMarkers);

function printClassDeclaration(print, node) {
  var parts = (0, _utilsFlatten2['default'])(['class', _constantsMarkers2['default'].noBreak, _constantsMarkers2['default'].space, print(node.id), node.typeParameters ? [_constantsMarkers2['default'].noBreak, print(node.typeParameters)] : _constantsMarkers2['default'].empty, _constantsMarkers2['default'].noBreak, _constantsMarkers2['default'].space]);

  if (node.superClass) {
    var superClass = node.superClass;
    parts = (0, _utilsFlatten2['default'])([parts, 'extends', _constantsMarkers2['default'].noBreak, _constantsMarkers2['default'].space, print(superClass), node.superTypeParameters ? [_constantsMarkers2['default'].noBreak, print(node.superTypeParameters)] : _constantsMarkers2['default'].empty, _constantsMarkers2['default'].noBreak, _constantsMarkers2['default'].space]);
  }

  return (0, _utilsFlatten2['default'])([parts, print(node.body), _constantsMarkers2['default'].hardBreak]);
}

module.exports = printClassDeclaration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9yZXByaW50LWpzL3ByaW50ZXJzL3NpbXBsZS9wcmludENsYXNzRGVjbGFyYXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OzRCQWFvQixxQkFBcUI7Ozs7Z0NBQ3JCLHlCQUF5Qjs7OztBQUU3QyxTQUFTLHFCQUFxQixDQUFDLEtBQVksRUFBRSxJQUFzQixFQUFTO0FBQzFFLE1BQUksS0FBSyxHQUFHLCtCQUFRLENBQ2xCLE9BQU8sRUFDUCw4QkFBUSxPQUFPLEVBQ2YsOEJBQVEsS0FBSyxFQUNiLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQ2QsSUFBSSxDQUFDLGNBQWMsR0FDZixDQUFDLDhCQUFRLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQzdDLDhCQUFRLEtBQUssRUFDakIsOEJBQVEsT0FBTyxFQUNmLDhCQUFRLEtBQUssQ0FDZCxDQUFDLENBQUM7O0FBRUgsTUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ25CLFFBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDbkMsU0FBSyxHQUFHLCtCQUFRLENBQ2QsS0FBSyxFQUNMLFNBQVMsRUFDVCw4QkFBUSxPQUFPLEVBQ2YsOEJBQVEsS0FBSyxFQUNiLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFDakIsSUFBSSxDQUFDLG1CQUFtQixHQUNwQixDQUFDLDhCQUFRLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsR0FDbEQsOEJBQVEsS0FBSyxFQUNqQiw4QkFBUSxPQUFPLEVBQ2YsOEJBQVEsS0FBSyxDQUNkLENBQUMsQ0FBQztHQUNKOztBQUVELFNBQU8sK0JBQVEsQ0FDYixLQUFLLEVBQ0wsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDaEIsOEJBQVEsU0FBUyxDQUNsQixDQUFDLENBQUM7Q0FDSjs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLHFCQUFxQixDQUFDIiwiZmlsZSI6InByaW50Q2xhc3NEZWNsYXJhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBAZmxvd1xuICovXG5cbmltcG9ydCB0eXBlIHtDbGFzc0RlY2xhcmF0aW9ufSBmcm9tICdhc3QtdHlwZXMtZmxvdyc7XG5pbXBvcnQgdHlwZSB7TGluZXMsIFByaW50fSBmcm9tICcuLi8uLi90eXBlcy9jb21tb24nO1xuXG5pbXBvcnQgZmxhdHRlbiBmcm9tICcuLi8uLi91dGlscy9mbGF0dGVuJztcbmltcG9ydCBtYXJrZXJzIGZyb20gJy4uLy4uL2NvbnN0YW50cy9tYXJrZXJzJztcblxuZnVuY3Rpb24gcHJpbnRDbGFzc0RlY2xhcmF0aW9uKHByaW50OiBQcmludCwgbm9kZTogQ2xhc3NEZWNsYXJhdGlvbik6IExpbmVzIHtcbiAgbGV0IHBhcnRzID0gZmxhdHRlbihbXG4gICAgJ2NsYXNzJyxcbiAgICBtYXJrZXJzLm5vQnJlYWssXG4gICAgbWFya2Vycy5zcGFjZSxcbiAgICBwcmludChub2RlLmlkKSxcbiAgICBub2RlLnR5cGVQYXJhbWV0ZXJzXG4gICAgICA/IFttYXJrZXJzLm5vQnJlYWssIHByaW50KG5vZGUudHlwZVBhcmFtZXRlcnMpXVxuICAgICAgOiBtYXJrZXJzLmVtcHR5LFxuICAgIG1hcmtlcnMubm9CcmVhayxcbiAgICBtYXJrZXJzLnNwYWNlLFxuICBdKTtcblxuICBpZiAobm9kZS5zdXBlckNsYXNzKSB7XG4gICAgY29uc3Qgc3VwZXJDbGFzcyA9IG5vZGUuc3VwZXJDbGFzcztcbiAgICBwYXJ0cyA9IGZsYXR0ZW4oW1xuICAgICAgcGFydHMsXG4gICAgICAnZXh0ZW5kcycsXG4gICAgICBtYXJrZXJzLm5vQnJlYWssXG4gICAgICBtYXJrZXJzLnNwYWNlLFxuICAgICAgcHJpbnQoc3VwZXJDbGFzcyksXG4gICAgICBub2RlLnN1cGVyVHlwZVBhcmFtZXRlcnNcbiAgICAgICAgPyBbbWFya2Vycy5ub0JyZWFrLCBwcmludChub2RlLnN1cGVyVHlwZVBhcmFtZXRlcnMpXVxuICAgICAgICA6IG1hcmtlcnMuZW1wdHksXG4gICAgICBtYXJrZXJzLm5vQnJlYWssXG4gICAgICBtYXJrZXJzLnNwYWNlLFxuICAgIF0pO1xuICB9XG5cbiAgcmV0dXJuIGZsYXR0ZW4oW1xuICAgIHBhcnRzLFxuICAgIHByaW50KG5vZGUuYm9keSksXG4gICAgbWFya2Vycy5oYXJkQnJlYWssXG4gIF0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByaW50Q2xhc3NEZWNsYXJhdGlvbjtcbiJdfQ==