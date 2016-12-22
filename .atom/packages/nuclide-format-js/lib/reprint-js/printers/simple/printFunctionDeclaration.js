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

var _commonPrintCommaSeparatedNodes = require('../common/printCommaSeparatedNodes');

var _commonPrintCommaSeparatedNodes2 = _interopRequireDefault(_commonPrintCommaSeparatedNodes);

function printFunctionDeclaration(print, node) {
  return (0, _utilsFlatten2['default'])([node.async ? ['async', _constantsMarkers2['default'].space, _constantsMarkers2['default'].noBreak] : _constantsMarkers2['default'].empty, 'function', node.generator ? '*' : _constantsMarkers2['default'].empty, _constantsMarkers2['default'].noBreak, _constantsMarkers2['default'].space, print(node.id), node.typeParameters ? [_constantsMarkers2['default'].noBreak, print(node.typeParameters)] : _constantsMarkers2['default'].empty, '(', (0, _commonPrintCommaSeparatedNodes2['default'])(print, node.params), ')', node.returnType ? print(node.returnType) : _constantsMarkers2['default'].empty, _constantsMarkers2['default'].space, print(node.body), _constantsMarkers2['default'].hardBreak]);
}

module.exports = printFunctionDeclaration;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9yZXByaW50LWpzL3ByaW50ZXJzL3NpbXBsZS9wcmludEZ1bmN0aW9uRGVjbGFyYXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OzRCQWFvQixxQkFBcUI7Ozs7Z0NBQ3JCLHlCQUF5Qjs7Ozs4Q0FDUixvQ0FBb0M7Ozs7QUFFekUsU0FBUyx3QkFBd0IsQ0FDL0IsS0FBWSxFQUNaLElBQXlCLEVBQ2xCO0FBQ1AsU0FBTywrQkFBUSxDQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxPQUFPLEVBQUUsOEJBQVEsS0FBSyxFQUFFLDhCQUFRLE9BQU8sQ0FBQyxHQUFHLDhCQUFRLEtBQUssRUFDdEUsVUFBVSxFQUNWLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLDhCQUFRLEtBQUssRUFDcEMsOEJBQVEsT0FBTyxFQUNmLDhCQUFRLEtBQUssRUFDYixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUNkLElBQUksQ0FBQyxjQUFjLEdBQ2YsQ0FBQyw4QkFBUSxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUM3Qyw4QkFBUSxLQUFLLEVBQ2pCLEdBQUcsRUFDSCxpREFBeUIsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDNUMsR0FBRyxFQUNILElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyw4QkFBUSxLQUFLLEVBQ3hELDhCQUFRLEtBQUssRUFDYixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNoQiw4QkFBUSxTQUFTLENBQ2xCLENBQUMsQ0FBQztDQUNKOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsd0JBQXdCLENBQUMiLCJmaWxlIjoicHJpbnRGdW5jdGlvbkRlY2xhcmF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IHR5cGUge0Z1bmN0aW9uRGVjbGFyYXRpb259IGZyb20gJ2FzdC10eXBlcy1mbG93JztcbmltcG9ydCB0eXBlIHtMaW5lcywgUHJpbnR9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1vbic7XG5cbmltcG9ydCBmbGF0dGVuIGZyb20gJy4uLy4uL3V0aWxzL2ZsYXR0ZW4nO1xuaW1wb3J0IG1hcmtlcnMgZnJvbSAnLi4vLi4vY29uc3RhbnRzL21hcmtlcnMnO1xuaW1wb3J0IHByaW50Q29tbWFTZXBhcmF0ZWROb2RlcyBmcm9tICcuLi9jb21tb24vcHJpbnRDb21tYVNlcGFyYXRlZE5vZGVzJztcblxuZnVuY3Rpb24gcHJpbnRGdW5jdGlvbkRlY2xhcmF0aW9uKFxuICBwcmludDogUHJpbnQsXG4gIG5vZGU6IEZ1bmN0aW9uRGVjbGFyYXRpb24sXG4pOiBMaW5lcyB7XG4gIHJldHVybiBmbGF0dGVuKFtcbiAgICBub2RlLmFzeW5jID8gWydhc3luYycsIG1hcmtlcnMuc3BhY2UsIG1hcmtlcnMubm9CcmVha10gOiBtYXJrZXJzLmVtcHR5LFxuICAgICdmdW5jdGlvbicsXG4gICAgbm9kZS5nZW5lcmF0b3IgPyAnKicgOiBtYXJrZXJzLmVtcHR5LFxuICAgIG1hcmtlcnMubm9CcmVhayxcbiAgICBtYXJrZXJzLnNwYWNlLFxuICAgIHByaW50KG5vZGUuaWQpLFxuICAgIG5vZGUudHlwZVBhcmFtZXRlcnNcbiAgICAgID8gW21hcmtlcnMubm9CcmVhaywgcHJpbnQobm9kZS50eXBlUGFyYW1ldGVycyldXG4gICAgICA6IG1hcmtlcnMuZW1wdHksXG4gICAgJygnLFxuICAgIHByaW50Q29tbWFTZXBhcmF0ZWROb2RlcyhwcmludCwgbm9kZS5wYXJhbXMpLFxuICAgICcpJyxcbiAgICBub2RlLnJldHVyblR5cGUgPyBwcmludChub2RlLnJldHVyblR5cGUpIDogbWFya2Vycy5lbXB0eSxcbiAgICBtYXJrZXJzLnNwYWNlLFxuICAgIHByaW50KG5vZGUuYm9keSksXG4gICAgbWFya2Vycy5oYXJkQnJlYWssXG4gIF0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByaW50RnVuY3Rpb25EZWNsYXJhdGlvbjtcbiJdfQ==