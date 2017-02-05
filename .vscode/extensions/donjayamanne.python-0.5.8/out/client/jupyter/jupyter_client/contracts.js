"use strict";
(function (KernelCommand) {
    KernelCommand[KernelCommand["shutdown"] = 0] = "shutdown";
    KernelCommand[KernelCommand["restart"] = 1] = "restart";
    KernelCommand[KernelCommand["interrupt"] = 2] = "interrupt";
})(exports.KernelCommand || (exports.KernelCommand = {}));
var KernelCommand = exports.KernelCommand;
//# sourceMappingURL=contracts.js.map