'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.checkFlow = undefined;

var checkFlow = exports.checkFlow = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
		var path, _buildSearchFlowComma, command, args, check, flowOutput, flowOutputError;

		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.next = 2;
						return (0, _FlowHelpers.getPathToFlow)();

					case 2:
						path = _context.sent;

						try {
							_buildSearchFlowComma = (0, _FlowHelpers.buildSearchFlowCommand)(path), command = _buildSearchFlowComma.command, args = _buildSearchFlowComma.args;
							check = (0, _crossSpawn2.default)(command, args);
							flowOutput = "", flowOutputError = "";

							check.stdout.on('data', function (data) {
								flowOutput += data.toString();
							});
							check.stderr.on('data', function (data) {
								flowOutputError += data.toString();
							});
							check.on('exit', function (code) {
								if (code != 0) {
									_vscode.window.showErrorMessage(FLOW_NOT_FOUND);
								}
							});
						} catch (e) {
							_vscode.window.showErrorMessage(FLOW_NOT_FOUND);
						}

					case 4:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function checkFlow() {
		return _ref.apply(this, arguments);
	};
}();

exports.isFlowEnabled = isFlowEnabled;
exports.checkNode = checkNode;

var _crossSpawn = require('cross-spawn');

var _crossSpawn2 = _interopRequireDefault(_crossSpawn);

var _vscode = require('vscode');

var _FlowHelpers = require('../pkg/flow-base/lib/FlowHelpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var NODE_NOT_FOUND = '[Flow] Cannot find node in PATH. The simpliest way to resolve it is install node globally';
var FLOW_NOT_FOUND = '[Flow] Cannot find flow in PATH. Try to install it by npm install flow-bin -g';

function isFlowEnabled() {
	return _vscode.workspace.getConfiguration('flow').get('enabled');
}

function checkNode() {
	try {
		var check = (0, _crossSpawn2.default)(process.platform === 'win32' ? 'where' : 'which', ['node']);
		var flowOutput = "",
		    flowOutputError = "";
		check.stdout.on('data', function (data) {
			flowOutput += data.toString();
		});
		check.stderr.on('data', function (data) {
			flowOutputError += data.toString();
		});
		check.on('exit', function (code) {
			if (code != 0) {
				_vscode.window.showErrorMessage(NODE_NOT_FOUND);
			}
		});
	} catch (e) {
		_vscode.window.showErrorMessage(NODE_NOT_FOUND);
	}
}
//# sourceMappingURL=util.js.map