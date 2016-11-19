/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
var goOutline_1 = require('./goOutline');
var goInstallTools_1 = require('./goInstallTools');
var path = require('path');
function listPackages(excludeImportedPkgs) {
    if (excludeImportedPkgs === void 0) { excludeImportedPkgs = false; }
    var importsPromise = excludeImportedPkgs && vscode.window.activeTextEditor ? getImports(vscode.window.activeTextEditor.document.fileName) : Promise.resolve([]);
    var vendorSupportPromise = util_1.isVendorSupported();
    var goPkgsPromise = new Promise(function (resolve, reject) {
        cp.execFile(goPath_1.getBinPath('gopkgs'), [], function (err, stdout, stderr) {
            if (err && err.code === 'ENOENT') {
                goInstallTools_1.promptForMissingTool('gopkgs');
                return reject();
            }
            var lines = stdout.toString().split('\n');
            if (lines[lines.length - 1] === '') {
                // Drop the empty entry from the final '\n'
                lines.pop();
            }
            return resolve(lines);
        });
    });
    return vendorSupportPromise.then(function (vendorSupport) {
        return Promise.all([goPkgsPromise, importsPromise]).then(function (values) {
            var pkgs = values[0];
            var importedPkgs = values[1];
            if (!vendorSupport) {
                if (importedPkgs.length > 0) {
                    pkgs = pkgs.filter(function (element) {
                        return importedPkgs.indexOf(element) === -1;
                    });
                }
                return pkgs.sort();
            }
            var currentFileDirPath = path.dirname(vscode.window.activeTextEditor.document.fileName);
            var workspaces = process.env['GOPATH'].split(path.delimiter);
            var currentWorkspace = path.join(workspaces[0], 'src');
            // Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
            if (process.platform === 'win32') {
                currentFileDirPath = currentFileDirPath.substr(0, 1).toUpperCase() + currentFileDirPath.substr(1);
            }
            // In case of multiple workspaces, find current workspace by checking if current file is
            // under any of the workspaces in $GOPATH
            for (var i = 1; i < workspaces.length; i++) {
                var possibleCurrentWorkspace = path.join(workspaces[i], 'src');
                if (currentFileDirPath.startsWith(possibleCurrentWorkspace)) {
                    // In case of nested workspaces, (example: both /Users/me and /Users/me/src/a/b/c are in $GOPATH)
                    // both parent & child workspace in the nested workspaces pair can make it inside the above if block
                    // Therefore, the below check will take longer (more specific to current file) of the two
                    if (possibleCurrentWorkspace.length > currentWorkspace.length) {
                        currentWorkspace = possibleCurrentWorkspace;
                    }
                }
            }
            var pkgSet = new Set();
            pkgs.forEach(function (pkg) {
                if (!pkg || importedPkgs.indexOf(pkg) > -1) {
                    return;
                }
                var magicVendorString = '/vendor/';
                var vendorIndex = pkg.indexOf(magicVendorString);
                // Check if current file and the vendor pkg belong to the same root project
                // If yes, then vendor pkg can be replaced with its relative path to the "vendor" folder
                // If not, then the vendor pkg should not be allowed to be imported.
                if (vendorIndex > 0) {
                    var rootProjectForVendorPkg = path.join(currentWorkspace, pkg.substr(0, vendorIndex));
                    var relativePathForVendorPkg = pkg.substring(vendorIndex + magicVendorString.length);
                    if (relativePathForVendorPkg && currentFileDirPath.startsWith(rootProjectForVendorPkg)) {
                        pkgSet.add(relativePathForVendorPkg);
                    }
                    return;
                }
                // pkg is not a vendor project
                pkgSet.add(pkg);
            });
            return Array.from(pkgSet).sort();
        });
    });
}
exports.listPackages = listPackages;
/**
 * Returns the imported packages in the given file
 *
 * @param fileName File system path of the file whose imports need to be returned
 * @returns Array of imported package paths wrapped in a promise
 */
function getImports(fileName) {
    var options = { fileName: fileName, importsOnly: true };
    return goOutline_1.documentSymbols(options).then(function (symbols) {
        if (!symbols || !symbols[0] || !symbols[0].children) {
            return [];
        }
        // imports will be of the form { type: 'import', label: '"math"'}
        var imports = symbols[0].children.filter(function (x) { return x.type === 'import'; }).map(function (x) { return x.label.substr(1, x.label.length - 2); });
        return imports;
    });
}
function askUserForImport() {
    return listPackages(true).then(function (packages) {
        return vscode.window.showQuickPick(packages);
    });
}
function getTextEditForAddImport(arg) {
    // Import name wasn't provided
    if (arg === undefined) {
        return null;
    }
    var _a = util_1.parseFilePrelude(vscode.window.activeTextEditor.document.getText()), imports = _a.imports, pkg = _a.pkg;
    var multis = imports.filter(function (x) { return x.kind === 'multi'; });
    if (multis.length > 0) {
        // There is a multiple import declaration, add to the last one
        var closeParenLine = multis[multis.length - 1].end;
        return vscode.TextEdit.insert(new vscode.Position(closeParenLine, 0), '\t"' + arg + '"\n');
    }
    else if (imports.length > 0) {
        // There are only single import declarations, add after the last one
        var lastSingleImport = imports[imports.length - 1].end;
        return vscode.TextEdit.insert(new vscode.Position(lastSingleImport + 1, 0), 'import "' + arg + '"\n');
    }
    else if (pkg && pkg.start >= 0) {
        // There are no import declarations, but there is a package declaration
        return vscode.TextEdit.insert(new vscode.Position(pkg.start + 1, 0), '\nimport (\n\t"' + arg + '"\n)\n');
    }
    else {
        // There are no imports and no package declaration - give up
        return null;
    }
}
exports.getTextEditForAddImport = getTextEditForAddImport;
function addImport(arg) {
    var p = arg ? Promise.resolve(arg) : askUserForImport();
    p.then(function (imp) {
        var edit = getTextEditForAddImport(imp);
        if (edit) {
            vscode.window.activeTextEditor.edit(function (editBuilder) {
                editBuilder.insert(edit.range.start, edit.newText);
            });
        }
    });
}
exports.addImport = addImport;
//# sourceMappingURL=goImport.js.map