'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _config = require('../lib/config');

describe('nuclide-logging/lib/config.js', function () {
  describe('getPathToLogFileForDate', function () {
    var getPathToLogFileForDate = _config.__test__.getPathToLogFileForDate;

    it('returns the file path to the log file for today.', function () {
      var YEAR = 2015;
      var MONTH = 0; // January
      var DATE = 2;
      var targetDate = new Date(YEAR, MONTH, DATE);
      var expectedString = _config.LOG_FILE_PATH + '-2015-01-02';
      expect(getPathToLogFileForDate(targetDate)).toEqual(expectedString);
    });
  });
});
//# sourceMappingURL=config-spec.js.map