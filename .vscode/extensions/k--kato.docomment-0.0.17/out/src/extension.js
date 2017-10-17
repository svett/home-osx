"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DocommentDomainCSharp_1 = require("./Domain/Lang/DocommentDomainCSharp");
const DocommentControllerCSharp_1 = require("./Controller/Lang/DocommentControllerCSharp");
function activate(context) {
    const domainCSharp = new DocommentDomainCSharp_1.DocommentDomainCSharp();
    const controllerCSharp = new DocommentControllerCSharp_1.DocommentControllerCSharp(domainCSharp);
    context.subscriptions.push(controllerCSharp);
    context.subscriptions.push(domainCSharp);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map