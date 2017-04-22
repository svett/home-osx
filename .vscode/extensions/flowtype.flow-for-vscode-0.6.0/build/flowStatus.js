'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Status = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */

var _vscode = require('vscode');

var _util = require('./utils/util');

var _elegantSpinner = require('elegant-spinner');

var _elegantSpinner2 = _interopRequireDefault(_elegantSpinner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Status = exports.Status = function () {
  _createClass(Status, null, [{
    key: 'createStatusBarItem',
    value: function createStatusBarItem() {
      var statusBarItem = _vscode.window.createStatusBarItem(_vscode.StatusBarAlignment.Left);
      statusBarItem.tooltip = 'Flow is type checking';
      statusBarItem.command = 'flow.show-output';
      return statusBarItem;
    }
  }, {
    key: 'render',
    value: function render(status) {
      return status.render();
    }
  }]);

  function Status() {
    _classCallCheck(this, Status);

    this.statusBarItem = Status.createStatusBarItem();
  }

  _createClass(Status, [{
    key: 'isBusy',
    value: function isBusy() {
      return this.state != null;
    }
  }, {
    key: 'idle',
    value: function idle() {
      this.update(false);
    }
  }, {
    key: 'busy',
    value: function busy() {
      this.update((0, _util.isFlowStatusEnabled)());
    }
  }, {
    key: 'update',
    value: function update(busy) {
      var state = this.state;

      if (state && !busy) {
        clearInterval(state.id);
        this.state = null;
      }

      if (!state && busy) {
        this.state = { id: setInterval(Status.render, 100, this) };
      }

      if (state != this.state) {
        this.render();
      }
    }
  }, {
    key: 'render',
    value: function render() {
      if (this.isBusy()) {
        this.statusBarItem.show();
        this.statusBarItem.text = Status.spin();
      } else {
        this.statusBarItem.hide();
        this.statusBarItem.text = '';
      }
    }
  }]);

  return Status;
}();

Status.spin = (0, _elegantSpinner2.default)();
exports.default = Status;
//# sourceMappingURL=flowStatus.js.map