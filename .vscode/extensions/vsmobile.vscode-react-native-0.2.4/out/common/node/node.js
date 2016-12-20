// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
var childProcess = require("./childProcess");
var file = require("./fileSystem");
var Node;
(function (Node) {
    Node.ChildProcess = childProcess.ChildProcess;
    Node.FileSystem = file.FileSystem;
})(Node = exports.Node || (exports.Node = {}));

//# sourceMappingURL=node.js.map
