"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupLogging = setupLogging;
/**
 * Adds a gloabl that is used inside consoleAppender.js to output console messages
 * to the user, instead of to the developer console.
 */
function setupLogging() {
  var channel = vscode.window.createOutputChannel("Flow");
  vscode.commands.registerCommand("flow.show-output", function () {
    return channel.show();
  });
  global.flowOutputChannel = channel;
}
//# sourceMappingURL=flowLogging.js.map