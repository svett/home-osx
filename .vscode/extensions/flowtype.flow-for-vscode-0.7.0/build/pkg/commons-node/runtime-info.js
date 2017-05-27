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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getRuntimeInformation = getRuntimeInformation;

var _systemInfo = require('./system-info');

var _userInfo = require('./userInfo');

var _userInfo2 = _interopRequireDefault(_userInfo);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cachedInformation = null;

function getCacheableRuntimeInformation() {
  if (cachedInformation !== null) {
    return cachedInformation;
  }

  cachedInformation = {
    sessionId: _uuid2.default.v4(),
    user: (0, _userInfo2.default)().username,
    osType: (0, _systemInfo.getOsType)(),
    timestamp: 0,
    isClient: (0, _systemInfo.isRunningInClient)(),
    isDevelopment: (0, _systemInfo.isDevelopment)(),
    atomVersion: (0, _systemInfo.isRunningInClient)() ? (0, _systemInfo.getAtomVersion)() : '',
    nuclideVersion: (0, _systemInfo.getNuclideVersion)(),
    installerPackageVersion: 0,
    uptime: 0,
    // TODO (chenshen) fill following information.
    serverVersion: 0
  };

  return cachedInformation;
}

function getRuntimeInformation() {
  var runtimeInformation = _extends({}, getCacheableRuntimeInformation(), {
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime() * 1000)
  });
  return runtimeInformation;
}
//# sourceMappingURL=runtime-info.js.map