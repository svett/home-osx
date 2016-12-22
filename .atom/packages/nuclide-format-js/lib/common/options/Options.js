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

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

/**
 * Valides the options used to construct a module map.
 */
function validateModuleMapOptions(options) {
  (0, _assert2['default'])(options, 'Invalid (undefined) ModuleMapOptions given.');

  // Validate presence of correct fields.
  (0, _assert2['default'])(options.paths, '`paths` must be provided.');
  (0, _assert2['default'])(options.pathsToRelativize, '`pathsToRelativze` must be provided.');
  (0, _assert2['default'])(options.aliases, '`aliases` must be provided.');
  (0, _assert2['default'])(options.aliasesToRelativize, '`aliasesToRelativze` must be provided.');
  (0, _assert2['default'])(options.builtIns, '`builtIns` must be provided.');
  (0, _assert2['default'])(options.builtInTypes, '`builtInTypes` must be provided.');

  // TODO: Use let.
  var filePath = undefined;
  for (filePath of options.paths) {
    (0, _assert2['default'])(isAbsolute(filePath), 'All paths must be absolute.');
  }
  for (filePath of options.pathsToRelativize) {
    (0, _assert2['default'])(isAbsolute(filePath), 'All paths must be absolute.');
  }
}

/**
 * Valides the options used to get requires out of a module map.
 */
function validateRequireOptions(options) {
  (0, _assert2['default'])(options, 'Invalid (undefined) RequireOptions given.');
}

/**
 * Validates the options given as input to transform.
 */
function validateSourceOptions(options) {
  (0, _assert2['default'])(options, 'Invalid (undefined) SourceOptions given.');
  if (options.sourcePath != null) {
    (0, _assert2['default'])(isAbsolute(options.sourcePath), 'If a "sourcePath" is given it must be an absolute path.');
  }
  (0, _assert2['default'])(options.moduleMap, 'A "moduleMap" must be provided in order to transform the source.');
}

/**
 * Small helper function to validate that a path is absolute. We also need to
 * allow remote nuclide files.
 */
function isAbsolute(sourcePath) {
  if (sourcePath.startsWith('nuclide:/')) {
    var parsedUri = _url2['default'].parse(sourcePath);
    (0, _assert2['default'])(parsedUri.path != null, 'uri path missing');
    return _path2['default'].isAbsolute(parsedUri.path);
  } else {
    return _path2['default'].isAbsolute(sourcePath);
  }
}

var Options = {
  validateModuleMapOptions: validateModuleMapOptions,
  validateRequireOptions: validateRequireOptions,
  validateSourceOptions: validateSourceOptions
};

module.exports = Options;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vb3B0aW9ucy9PcHRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztzQkFjc0IsUUFBUTs7OztvQkFDYixNQUFNOzs7O21CQUNQLEtBQUs7Ozs7Ozs7QUFLckIsU0FBUyx3QkFBd0IsQ0FBQyxPQUF5QixFQUFRO0FBQ2pFLDJCQUFVLE9BQU8sRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDOzs7QUFHbEUsMkJBQVUsT0FBTyxDQUFDLEtBQUssRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0FBQ3RELDJCQUFVLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO0FBQzdFLDJCQUFVLE9BQU8sQ0FBQyxPQUFPLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztBQUMxRCwyQkFDRSxPQUFPLENBQUMsbUJBQW1CLEVBQzNCLHdDQUF3QyxDQUN6QyxDQUFDO0FBQ0YsMkJBQVUsT0FBTyxDQUFDLFFBQVEsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0FBQzVELDJCQUFVLE9BQU8sQ0FBQyxZQUFZLEVBQUUsa0NBQWtDLENBQUMsQ0FBQzs7O0FBR3BFLE1BQUksUUFBUSxZQUFBLENBQUM7QUFDYixPQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO0FBQzlCLDZCQUFVLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0dBQ2hFO0FBQ0QsT0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFO0FBQzFDLDZCQUFVLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0dBQ2hFO0NBQ0Y7Ozs7O0FBS0QsU0FBUyxzQkFBc0IsQ0FBQyxPQUF1QixFQUFRO0FBQzdELDJCQUFVLE9BQU8sRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO0NBQ2pFOzs7OztBQUtELFNBQVMscUJBQXFCLENBQUMsT0FBc0IsRUFBUTtBQUMzRCwyQkFBVSxPQUFPLEVBQUUsMENBQTBDLENBQUMsQ0FBQztBQUMvRCxNQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksSUFBSSxFQUFFO0FBQzlCLDZCQUNFLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQzlCLHlEQUF5RCxDQUMxRCxDQUFDO0dBQ0g7QUFDRCwyQkFDRSxPQUFPLENBQUMsU0FBUyxFQUNqQixrRUFBa0UsQ0FDbkUsQ0FBQztDQUNIOzs7Ozs7QUFNRCxTQUFTLFVBQVUsQ0FBQyxVQUFrQixFQUFXO0FBQy9DLE1BQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtBQUN0QyxRQUFNLFNBQVMsR0FBRyxpQkFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDeEMsNkJBQVUsU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUN0RCxXQUFPLGtCQUFLLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDeEMsTUFBTTtBQUNMLFdBQU8sa0JBQUssVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0dBQ3BDO0NBQ0Y7O0FBRUQsSUFBTSxPQUFPLEdBQUc7QUFDZCwwQkFBd0IsRUFBeEIsd0JBQXdCO0FBQ3hCLHdCQUFzQixFQUF0QixzQkFBc0I7QUFDdEIsdUJBQXFCLEVBQXJCLHFCQUFxQjtDQUN0QixDQUFDOztBQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIiwiZmlsZSI6Ik9wdGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQgdHlwZSB7TW9kdWxlTWFwT3B0aW9uc30gZnJvbSAnLi9Nb2R1bGVNYXBPcHRpb25zJztcbmltcG9ydCB0eXBlIHtSZXF1aXJlT3B0aW9uc30gZnJvbSAnLi9SZXF1aXJlT3B0aW9ucyc7XG5pbXBvcnQgdHlwZSB7U291cmNlT3B0aW9uc30gZnJvbSAnLi9Tb3VyY2VPcHRpb25zJztcblxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5cbi8qKlxuICogVmFsaWRlcyB0aGUgb3B0aW9ucyB1c2VkIHRvIGNvbnN0cnVjdCBhIG1vZHVsZSBtYXAuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlTW9kdWxlTWFwT3B0aW9ucyhvcHRpb25zOiBNb2R1bGVNYXBPcHRpb25zKTogdm9pZCB7XG4gIGludmFyaWFudChvcHRpb25zLCAnSW52YWxpZCAodW5kZWZpbmVkKSBNb2R1bGVNYXBPcHRpb25zIGdpdmVuLicpO1xuXG4gIC8vIFZhbGlkYXRlIHByZXNlbmNlIG9mIGNvcnJlY3QgZmllbGRzLlxuICBpbnZhcmlhbnQob3B0aW9ucy5wYXRocywgJ2BwYXRoc2AgbXVzdCBiZSBwcm92aWRlZC4nKTtcbiAgaW52YXJpYW50KG9wdGlvbnMucGF0aHNUb1JlbGF0aXZpemUsICdgcGF0aHNUb1JlbGF0aXZ6ZWAgbXVzdCBiZSBwcm92aWRlZC4nKTtcbiAgaW52YXJpYW50KG9wdGlvbnMuYWxpYXNlcywgJ2BhbGlhc2VzYCBtdXN0IGJlIHByb3ZpZGVkLicpO1xuICBpbnZhcmlhbnQoXG4gICAgb3B0aW9ucy5hbGlhc2VzVG9SZWxhdGl2aXplLFxuICAgICdgYWxpYXNlc1RvUmVsYXRpdnplYCBtdXN0IGJlIHByb3ZpZGVkLicsXG4gICk7XG4gIGludmFyaWFudChvcHRpb25zLmJ1aWx0SW5zLCAnYGJ1aWx0SW5zYCBtdXN0IGJlIHByb3ZpZGVkLicpO1xuICBpbnZhcmlhbnQob3B0aW9ucy5idWlsdEluVHlwZXMsICdgYnVpbHRJblR5cGVzYCBtdXN0IGJlIHByb3ZpZGVkLicpO1xuXG4gIC8vIFRPRE86IFVzZSBsZXQuXG4gIGxldCBmaWxlUGF0aDtcbiAgZm9yIChmaWxlUGF0aCBvZiBvcHRpb25zLnBhdGhzKSB7XG4gICAgaW52YXJpYW50KGlzQWJzb2x1dGUoZmlsZVBhdGgpLCAnQWxsIHBhdGhzIG11c3QgYmUgYWJzb2x1dGUuJyk7XG4gIH1cbiAgZm9yIChmaWxlUGF0aCBvZiBvcHRpb25zLnBhdGhzVG9SZWxhdGl2aXplKSB7XG4gICAgaW52YXJpYW50KGlzQWJzb2x1dGUoZmlsZVBhdGgpLCAnQWxsIHBhdGhzIG11c3QgYmUgYWJzb2x1dGUuJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGVzIHRoZSBvcHRpb25zIHVzZWQgdG8gZ2V0IHJlcXVpcmVzIG91dCBvZiBhIG1vZHVsZSBtYXAuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlUmVxdWlyZU9wdGlvbnMob3B0aW9uczogUmVxdWlyZU9wdGlvbnMpOiB2b2lkIHtcbiAgaW52YXJpYW50KG9wdGlvbnMsICdJbnZhbGlkICh1bmRlZmluZWQpIFJlcXVpcmVPcHRpb25zIGdpdmVuLicpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGUgb3B0aW9ucyBnaXZlbiBhcyBpbnB1dCB0byB0cmFuc2Zvcm0uXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlU291cmNlT3B0aW9ucyhvcHRpb25zOiBTb3VyY2VPcHRpb25zKTogdm9pZCB7XG4gIGludmFyaWFudChvcHRpb25zLCAnSW52YWxpZCAodW5kZWZpbmVkKSBTb3VyY2VPcHRpb25zIGdpdmVuLicpO1xuICBpZiAob3B0aW9ucy5zb3VyY2VQYXRoICE9IG51bGwpIHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICBpc0Fic29sdXRlKG9wdGlvbnMuc291cmNlUGF0aCksXG4gICAgICAnSWYgYSBcInNvdXJjZVBhdGhcIiBpcyBnaXZlbiBpdCBtdXN0IGJlIGFuIGFic29sdXRlIHBhdGguJyxcbiAgICApO1xuICB9XG4gIGludmFyaWFudChcbiAgICBvcHRpb25zLm1vZHVsZU1hcCxcbiAgICAnQSBcIm1vZHVsZU1hcFwiIG11c3QgYmUgcHJvdmlkZWQgaW4gb3JkZXIgdG8gdHJhbnNmb3JtIHRoZSBzb3VyY2UuJyxcbiAgKTtcbn1cblxuLyoqXG4gKiBTbWFsbCBoZWxwZXIgZnVuY3Rpb24gdG8gdmFsaWRhdGUgdGhhdCBhIHBhdGggaXMgYWJzb2x1dGUuIFdlIGFsc28gbmVlZCB0b1xuICogYWxsb3cgcmVtb3RlIG51Y2xpZGUgZmlsZXMuXG4gKi9cbmZ1bmN0aW9uIGlzQWJzb2x1dGUoc291cmNlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmIChzb3VyY2VQYXRoLnN0YXJ0c1dpdGgoJ251Y2xpZGU6LycpKSB7XG4gICAgY29uc3QgcGFyc2VkVXJpID0gdXJsLnBhcnNlKHNvdXJjZVBhdGgpO1xuICAgIGludmFyaWFudChwYXJzZWRVcmkucGF0aCAhPSBudWxsLCAndXJpIHBhdGggbWlzc2luZycpO1xuICAgIHJldHVybiBwYXRoLmlzQWJzb2x1dGUocGFyc2VkVXJpLnBhdGgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBwYXRoLmlzQWJzb2x1dGUoc291cmNlUGF0aCk7XG4gIH1cbn1cblxuY29uc3QgT3B0aW9ucyA9IHtcbiAgdmFsaWRhdGVNb2R1bGVNYXBPcHRpb25zLFxuICB2YWxpZGF0ZVJlcXVpcmVPcHRpb25zLFxuICB2YWxpZGF0ZVNvdXJjZU9wdGlvbnMsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9wdGlvbnM7XG4iXX0=