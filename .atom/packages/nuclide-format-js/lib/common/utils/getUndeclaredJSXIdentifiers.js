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

var _getDeclaredIdentifiers = require('./getDeclaredIdentifiers');

var _getDeclaredIdentifiers2 = _interopRequireDefault(_getDeclaredIdentifiers);

var _getJSXIdentifiers = require('./getJSXIdentifiers');

var _getJSXIdentifiers2 = _interopRequireDefault(_getJSXIdentifiers);

function getUndeclaredJSXIdentifiers(root, options) {
  var declaredIdentifiers = (0, _getDeclaredIdentifiers2['default'])(root, options);
  var jsxIdentifiers = (0, _getJSXIdentifiers2['default'])(root);
  var undeclared = new Set();
  for (var id of jsxIdentifiers) {
    if (!declaredIdentifiers.has(id)) {
      undeclared.add(id);
    }
  }
  return undeclared;
}

module.exports = getUndeclaredJSXIdentifiers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vdXRpbHMvZ2V0VW5kZWNsYXJlZEpTWElkZW50aWZpZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztzQ0FhbUMsMEJBQTBCOzs7O2lDQUMvQixxQkFBcUI7Ozs7QUFFbkQsU0FBUywyQkFBMkIsQ0FDbEMsSUFBZ0IsRUFDaEIsT0FBc0IsRUFDVDtBQUNiLE1BQU0sbUJBQW1CLEdBQUcseUNBQXVCLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsRSxNQUFNLGNBQWMsR0FBRyxvQ0FBa0IsSUFBSSxDQUFDLENBQUM7QUFDL0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUM3QixPQUFLLElBQU0sRUFBRSxJQUFJLGNBQWMsRUFBRTtBQUMvQixRQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ2hDLGdCQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ3BCO0dBQ0Y7QUFDRCxTQUFPLFVBQVUsQ0FBQztDQUNuQjs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLDJCQUEyQixDQUFDIiwiZmlsZSI6ImdldFVuZGVjbGFyZWRKU1hJZGVudGlmaWVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBAZmxvd1xuICovXG5cbmltcG9ydCB0eXBlIHtDb2xsZWN0aW9ufSBmcm9tICcuLi90eXBlcy9hc3QnO1xuaW1wb3J0IHR5cGUge1NvdXJjZU9wdGlvbnN9IGZyb20gJy4uL29wdGlvbnMvU291cmNlT3B0aW9ucyc7XG5cbmltcG9ydCBnZXREZWNsYXJlZElkZW50aWZpZXJzIGZyb20gJy4vZ2V0RGVjbGFyZWRJZGVudGlmaWVycyc7XG5pbXBvcnQgZ2V0SlNYSWRlbnRpZmllcnMgZnJvbSAnLi9nZXRKU1hJZGVudGlmaWVycyc7XG5cbmZ1bmN0aW9uIGdldFVuZGVjbGFyZWRKU1hJZGVudGlmaWVycyhcbiAgcm9vdDogQ29sbGVjdGlvbixcbiAgb3B0aW9uczogU291cmNlT3B0aW9ucyxcbik6IFNldDxzdHJpbmc+IHtcbiAgY29uc3QgZGVjbGFyZWRJZGVudGlmaWVycyA9IGdldERlY2xhcmVkSWRlbnRpZmllcnMocm9vdCwgb3B0aW9ucyk7XG4gIGNvbnN0IGpzeElkZW50aWZpZXJzID0gZ2V0SlNYSWRlbnRpZmllcnMocm9vdCk7XG4gIGNvbnN0IHVuZGVjbGFyZWQgPSBuZXcgU2V0KCk7XG4gIGZvciAoY29uc3QgaWQgb2YganN4SWRlbnRpZmllcnMpIHtcbiAgICBpZiAoIWRlY2xhcmVkSWRlbnRpZmllcnMuaGFzKGlkKSkge1xuICAgICAgdW5kZWNsYXJlZC5hZGQoaWQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWNsYXJlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRVbmRlY2xhcmVkSlNYSWRlbnRpZmllcnM7XG4iXX0=