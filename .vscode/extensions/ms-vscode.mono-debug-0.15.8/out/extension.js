/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var nls = require("vscode-nls");
var localize = nls.config(process.env.VSCODE_NLS_CONFIG)();
var configuration = vscode.workspace.getConfiguration('mono-debug');
function activate(context) {
    // register a configuration provider
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('mono', new MonoConfigurationProvider()));
    context.subscriptions.push(vscode.commands.registerCommand('extension.mono-debug.configureExceptions', function () { return configureExceptions(); }));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
// if the user has not configured anything, we populate the exception configurationwith these defaults
var DEFAULT_EXCEPTIONS = {
    "System.Exception": "never",
    "System.SystemException": "never",
    "System.ArithmeticException": "never",
    "System.ArrayTypeMismatchException": "never",
    "System.DivideByZeroException": "never",
    "System.IndexOutOfRangeException": "never",
    "System.InvalidCastException": "never",
    "System.NullReferenceException": "never",
    "System.OutOfMemoryException": "never",
    "System.OverflowException": "never",
    "System.StackOverflowException": "never",
    "System.TypeInitializationException": "never"
};
var BreakOptionItem = /** @class */ (function () {
    function BreakOptionItem() {
    }
    return BreakOptionItem;
}());
// the possible exception options converted into QuickPickItem
var OPTIONS = ['never', 'always', 'unhandled'].map(function (bm) {
    return {
        label: translate(bm),
        description: '',
        breakMode: bm
    };
});
var ExceptionItem = /** @class */ (function () {
    function ExceptionItem() {
    }
    return ExceptionItem;
}());
function translate(mode) {
    switch (mode) {
        case 'never':
            return localize('breakmode.never', "Never break");
        case 'always':
            return localize('breakmode.always', "Always break");
        case 'unhandled':
            return localize('breakmode.unhandled', "Break when unhandled");
        default:
            return mode;
    }
}
function getModel() {
    var model = DEFAULT_EXCEPTIONS;
    if (configuration) {
        var exceptionOptions = configuration.get('exceptionOptions');
        if (exceptionOptions) {
            model = exceptionOptions;
        }
    }
    return model;
}
function configureExceptions() {
    var options = {
        placeHolder: localize('select.exception', "First Select Exception"),
        matchOnDescription: true,
        matchOnDetail: true
    };
    var exceptionItems = [];
    var model = getModel();
    for (var exception in model) {
        exceptionItems.push({
            label: exception,
            description: model[exception] !== 'never' ? "\u26A1 " + translate(model[exception]) : ''
        });
    }
    vscode.window.showQuickPick(exceptionItems, options).then(function (exceptionItem) {
        if (exceptionItem) {
            var options_1 = {
                placeHolder: localize('select.break.option', "Then Select Break Option"),
                matchOnDescription: true,
                matchOnDetail: true
            };
            vscode.window.showQuickPick(OPTIONS, options_1).then(function (item) {
                if (item) {
                    model[exceptionItem.label] = item.breakMode;
                    if (configuration) {
                        configuration.update('exceptionOptions', model);
                    }
                    setExceptionBreakpoints(model);
                }
            });
        }
    });
}
function setExceptionBreakpoints(model) {
    var args = {
        filters: [],
        exceptionOptions: convertToExceptionOptions(model)
    };
    return vscode.commands.executeCommand('workbench.customDebugRequest', 'setExceptionBreakpoints', args);
}
function convertToExceptionOptions(model) {
    var exceptionItems = [];
    for (var exception in model) {
        exceptionItems.push({
            path: [{ names: [exception] }],
            breakMode: model[exception]
        });
    }
    return exceptionItems;
}
var MonoConfigurationProvider = /** @class */ (function () {
    function MonoConfigurationProvider() {
    }
    MonoConfigurationProvider.prototype.resolveDebugConfiguration = function (folder, config, token) {
        if (config && !config.__exceptionOptions) {
            config.__exceptionOptions = convertToExceptionOptions(getModel());
        }
        return config;
    };
    return MonoConfigurationProvider;
}());
exports.MonoConfigurationProvider = MonoConfigurationProvider;
//# sourceMappingURL=extension.js.map