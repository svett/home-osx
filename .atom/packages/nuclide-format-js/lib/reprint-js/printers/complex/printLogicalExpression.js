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

var _constantsMarkers = require('../../constants/markers');

var _constantsMarkers2 = _interopRequireDefault(_constantsMarkers);

var _wrappersSimpleWrapExpression = require('../../wrappers/simple/wrapExpression');

var _wrappersSimpleWrapExpression2 = _interopRequireDefault(_wrappersSimpleWrapExpression);

function printLogicalExpression(print, node, context) {
  var path = context.path;
  var needsScope = true;
  for (var i = path.size - 1; i >= 0; i--) {
    var curr = path.get(i);
    /**
     * Traverse the path until we see the first logical expression. If it has
     * the same kind of operator we do not need to open a new scope. If it has
     * a different kind of operator we force it into a new scope.
     */
    if (curr.type === 'LogicalExpression') {
      needsScope = curr.operator !== node.operator;
      break;
    }
  }

  var wrap = function wrap(x) {
    return (0, _wrappersSimpleWrapExpression2['default'])(print, node, x);
  };
  return wrap([needsScope ? [_constantsMarkers2['default'].openScope, _constantsMarkers2['default'].scopeIndent, _constantsMarkers2['default'].scopeBreak] : _constantsMarkers2['default'].empty, print(node.left), _constantsMarkers2['default'].noBreak, _constantsMarkers2['default'].space, node.operator, _constantsMarkers2['default'].scopeSpaceBreak, print(node.right), needsScope ? [_constantsMarkers2['default'].scopeBreak, _constantsMarkers2['default'].scopeDedent, _constantsMarkers2['default'].closeScope] : _constantsMarkers2['default'].empty]);
}

module.exports = printLogicalExpression;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9yZXByaW50LWpzL3ByaW50ZXJzL2NvbXBsZXgvcHJpbnRMb2dpY2FsRXhwcmVzc2lvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Z0NBYW9CLHlCQUF5Qjs7Ozs0Q0FDbEIsc0NBQXNDOzs7O0FBRWpFLFNBQVMsc0JBQXNCLENBQzdCLEtBQVksRUFDWixJQUF1QixFQUN2QixPQUFnQixFQUNUO0FBQ1AsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUMxQixNQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdEIsT0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3ZDLFFBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7OztBQU16QixRQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssbUJBQW1CLEVBQUU7QUFDckMsZ0JBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDN0MsWUFBTTtLQUNQO0dBQ0Y7O0FBRUQsTUFBTSxJQUFJLEdBQUcsU0FBUCxJQUFJLENBQUcsQ0FBQztXQUFJLCtDQUFlLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0dBQUEsQ0FBQztBQUNqRCxTQUFPLElBQUksQ0FBQyxDQUNWLFVBQVUsR0FDTixDQUFDLDhCQUFRLFNBQVMsRUFBRSw4QkFBUSxXQUFXLEVBQUUsOEJBQVEsVUFBVSxDQUFDLEdBQzVELDhCQUFRLEtBQUssRUFDakIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDaEIsOEJBQVEsT0FBTyxFQUNmLDhCQUFRLEtBQUssRUFDYixJQUFJLENBQUMsUUFBUSxFQUNiLDhCQUFRLGVBQWUsRUFDdkIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFDakIsVUFBVSxHQUNOLENBQUMsOEJBQVEsVUFBVSxFQUFFLDhCQUFRLFdBQVcsRUFBRSw4QkFBUSxVQUFVLENBQUMsR0FDN0QsOEJBQVEsS0FBSyxDQUNsQixDQUFDLENBQUM7Q0FDSjs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLHNCQUFzQixDQUFDIiwiZmlsZSI6InByaW50TG9naWNhbEV4cHJlc3Npb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQgdHlwZSB7Q29udGV4dCwgTGluZXMsIFByaW50fSBmcm9tICcuLi8uLi90eXBlcy9jb21tb24nO1xuaW1wb3J0IHR5cGUge0xvZ2ljYWxFeHByZXNzaW9ufSBmcm9tICdhc3QtdHlwZXMtZmxvdyc7XG5cbmltcG9ydCBtYXJrZXJzIGZyb20gJy4uLy4uL2NvbnN0YW50cy9tYXJrZXJzJztcbmltcG9ydCB3cmFwRXhwcmVzc2lvbiBmcm9tICcuLi8uLi93cmFwcGVycy9zaW1wbGUvd3JhcEV4cHJlc3Npb24nO1xuXG5mdW5jdGlvbiBwcmludExvZ2ljYWxFeHByZXNzaW9uKFxuICBwcmludDogUHJpbnQsXG4gIG5vZGU6IExvZ2ljYWxFeHByZXNzaW9uLFxuICBjb250ZXh0OiBDb250ZXh0LFxuKTogTGluZXMge1xuICBjb25zdCBwYXRoID0gY29udGV4dC5wYXRoO1xuICBsZXQgbmVlZHNTY29wZSA9IHRydWU7XG4gIGZvciAobGV0IGkgPSBwYXRoLnNpemUgLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IGN1cnIgPSBwYXRoLmdldChpKTtcbiAgICAvKipcbiAgICAgKiBUcmF2ZXJzZSB0aGUgcGF0aCB1bnRpbCB3ZSBzZWUgdGhlIGZpcnN0IGxvZ2ljYWwgZXhwcmVzc2lvbi4gSWYgaXQgaGFzXG4gICAgICogdGhlIHNhbWUga2luZCBvZiBvcGVyYXRvciB3ZSBkbyBub3QgbmVlZCB0byBvcGVuIGEgbmV3IHNjb3BlLiBJZiBpdCBoYXNcbiAgICAgKiBhIGRpZmZlcmVudCBraW5kIG9mIG9wZXJhdG9yIHdlIGZvcmNlIGl0IGludG8gYSBuZXcgc2NvcGUuXG4gICAgICovXG4gICAgaWYgKGN1cnIudHlwZSA9PT0gJ0xvZ2ljYWxFeHByZXNzaW9uJykge1xuICAgICAgbmVlZHNTY29wZSA9IGN1cnIub3BlcmF0b3IgIT09IG5vZGUub3BlcmF0b3I7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjb25zdCB3cmFwID0geCA9PiB3cmFwRXhwcmVzc2lvbihwcmludCwgbm9kZSwgeCk7XG4gIHJldHVybiB3cmFwKFtcbiAgICBuZWVkc1Njb3BlXG4gICAgICA/IFttYXJrZXJzLm9wZW5TY29wZSwgbWFya2Vycy5zY29wZUluZGVudCwgbWFya2Vycy5zY29wZUJyZWFrXVxuICAgICAgOiBtYXJrZXJzLmVtcHR5LFxuICAgIHByaW50KG5vZGUubGVmdCksXG4gICAgbWFya2Vycy5ub0JyZWFrLFxuICAgIG1hcmtlcnMuc3BhY2UsXG4gICAgbm9kZS5vcGVyYXRvcixcbiAgICBtYXJrZXJzLnNjb3BlU3BhY2VCcmVhayxcbiAgICBwcmludChub2RlLnJpZ2h0KSxcbiAgICBuZWVkc1Njb3BlXG4gICAgICA/IFttYXJrZXJzLnNjb3BlQnJlYWssIG1hcmtlcnMuc2NvcGVEZWRlbnQsIG1hcmtlcnMuY2xvc2VTY29wZV1cbiAgICAgIDogbWFya2Vycy5lbXB0eSxcbiAgXSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJpbnRMb2dpY2FsRXhwcmVzc2lvbjtcbiJdfQ==