/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var path_1 = require('path');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
var goInstallTools_1 = require('./goInstallTools');
var goImport_1 = require('./goImport');
function vscodeKindFromGoCodeClass(kind) {
    switch (kind) {
        case 'const':
        case 'package':
        case 'type':
            return vscode.CompletionItemKind.Keyword;
        case 'func':
            return vscode.CompletionItemKind.Function;
        case 'var':
            return vscode.CompletionItemKind.Field;
        case 'import':
            return vscode.CompletionItemKind.Module;
    }
    return vscode.CompletionItemKind.Property; // TODO@EG additional mappings needed?
}
var GoCompletionItemProvider = (function () {
    function GoCompletionItemProvider() {
        this.gocodeConfigurationComplete = false;
        this.pkgsList = [];
    }
    GoCompletionItemProvider.prototype.provideCompletionItems = function (document, position, token) {
        return this.provideCompletionItemsInternal(document, position, token, vscode.workspace.getConfiguration('go'));
    };
    GoCompletionItemProvider.prototype.provideCompletionItemsInternal = function (document, position, token, config) {
        var _this = this;
        return this.ensureGoCodeConfigured().then(function () {
            return new Promise(function (resolve, reject) {
                var filename = document.fileName;
                var lineText = document.lineAt(position.line).text;
                var lineTillCurrentPosition = lineText.substr(0, position.character);
                var autocompleteUnimportedPackages = config['autocompleteUnimportedPackages'] === true;
                if (lineText.match(/^\s*\/\//)) {
                    return resolve([]);
                }
                // Count the number of double quotes in the line till current position. Ignore escaped double quotes
                var doubleQuotesCnt = (lineTillCurrentPosition.match(/[^\\]\"/g) || []).length;
                doubleQuotesCnt += lineTillCurrentPosition.startsWith('\"') ? 1 : 0;
                var inString = (doubleQuotesCnt % 2 === 1);
                if (!inString && lineTillCurrentPosition.endsWith('\"')) {
                    return resolve([]);
                }
                // get current word
                var wordAtPosition = document.getWordRangeAtPosition(position);
                var currentWord = '';
                if (wordAtPosition && wordAtPosition.start.character < position.character) {
                    var word = document.getText(wordAtPosition);
                    currentWord = word.substr(0, position.character - wordAtPosition.start.character);
                }
                if (currentWord.match(/^\d+$/)) {
                    return resolve([]);
                }
                var offset = document.offsetAt(position);
                var inputText = document.getText();
                var includeUnimportedPkgs = autocompleteUnimportedPackages && !inString;
                return _this.runGoCode(filename, inputText, offset, inString, position, lineText, currentWord, includeUnimportedPkgs).then(function (suggestions) {
                    // If no suggestions and cursor is at a dot, then check if preceeding word is a package name
                    // If yes, then import the package in the inputText and run gocode again to get suggestions
                    if (suggestions.length === 0 && lineTillCurrentPosition.endsWith('.')) {
                        var pkgPath_1 = _this.getPackagePathFromLine(lineTillCurrentPosition);
                        if (pkgPath_1) {
                            // Now that we have the package path, import it right after the "package" statement
                            var _a = util_1.parseFilePrelude(vscode.window.activeTextEditor.document.getText()), imports = _a.imports, pkg = _a.pkg;
                            var posToAddImport = document.offsetAt(new vscode.Position(pkg.start + 1, 0));
                            var textToAdd = "import \"" + pkgPath_1 + "\"\n";
                            inputText = inputText.substr(0, posToAddImport) + textToAdd + inputText.substr(posToAddImport);
                            offset += textToAdd.length;
                            // Now that we have the package imported in the inputText, run gocode again
                            return _this.runGoCode(filename, inputText, offset, inString, position, lineText, currentWord, false).then(function (newsuggestions) {
                                // Since the new suggestions are due to the package that we imported,
                                // add additionalTextEdits to do the same in the actual document in the editor
                                // We use additionalTextEdits instead of command so that 'useCodeSnippetsOnFunctionSuggest' feature continues to work
                                newsuggestions.forEach(function (item) {
                                    item.additionalTextEdits = [goImport_1.getTextEditForAddImport(pkgPath_1)];
                                });
                                resolve(newsuggestions);
                            });
                        }
                    }
                    resolve(suggestions);
                });
            });
        });
    };
    GoCompletionItemProvider.prototype.runGoCode = function (filename, inputText, offset, inString, position, lineText, currentWord, includeUnimportedPkgs) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var gocode = goPath_1.getBinPath('gocode');
            // Unset GOOS and GOARCH for the `gocode` process to ensure that GOHOSTOS and GOHOSTARCH
            // are used as the target operating system and architecture. `gocode` is unable to provide
            // autocompletion when the Go environment is configured for cross compilation.
            var env = Object.assign({}, process.env, { GOOS: '', GOARCH: '' });
            // Spawn `gocode` process
            var p = cp.execFile(gocode, ['-f=json', 'autocomplete', filename, 'c' + offset], { env: env }, function (err, stdout, stderr) {
                try {
                    if (err && err.code === 'ENOENT') {
                        goInstallTools_1.promptForMissingTool('gocode');
                    }
                    if (err)
                        return reject(err);
                    var results = JSON.parse(stdout.toString());
                    var suggestions = [];
                    var suggestionSet = new Set();
                    // 'Smart Snippet' for package clause
                    // TODO: Factor this out into a general mechanism
                    if (!inputText.match(/package\s+(\w+)/)) {
                        var defaultPackageName = path_1.basename(filename) === 'main.go'
                            ? 'main'
                            : path_1.basename(path_1.dirname(filename));
                        var packageItem = new vscode.CompletionItem('package ' + defaultPackageName);
                        packageItem.kind = vscode.CompletionItemKind.Snippet;
                        packageItem.insertText = 'package ' + defaultPackageName + '\r\n\r\n';
                        suggestions.push(packageItem);
                    }
                    if (results[1]) {
                        for (var _i = 0, _a = results[1]; _i < _a.length; _i++) {
                            var suggest = _a[_i];
                            if (inString && suggest.class !== 'import')
                                continue;
                            var item = new vscode.CompletionItem(suggest.name);
                            item.kind = vscodeKindFromGoCodeClass(suggest.class);
                            item.detail = suggest.type;
                            if (inString && suggest.class === 'import') {
                                item.textEdit = new vscode.TextEdit(new vscode.Range(position.line, lineText.substring(0, position.character).lastIndexOf('"') + 1, position.line, position.character), suggest.name);
                            }
                            var conf = vscode.workspace.getConfiguration('go');
                            if (conf.get('useCodeSnippetsOnFunctionSuggest') && suggest.class === 'func') {
                                var params = util_1.parameters(suggest.type.substring(4));
                                var paramSnippets = [];
                                for (var i in params) {
                                    var param = params[i].trim();
                                    if (param) {
                                        param = param.replace('{', '\\{').replace('}', '\\}');
                                        paramSnippets.push('{{' + param + '}}');
                                    }
                                }
                                item.insertText = suggest.name + '(' + paramSnippets.join(', ') + ') {{}}';
                            }
                            // Add same sortText to all suggestions from gocode so that they appear before the unimported packages
                            item.sortText = 'a';
                            suggestions.push(item);
                            suggestionSet.add(item.label);
                        }
                        ;
                    }
                    // Add importable packages matching currentword to suggestions
                    var importablePkgs = includeUnimportedPkgs ? _this.getMatchingPackages(currentWord, suggestionSet) : [];
                    suggestions = suggestions.concat(importablePkgs);
                    resolve(suggestions);
                }
                catch (e) {
                    reject(e);
                }
            });
            p.stdin.end(inputText);
        });
    };
    // TODO: Shouldn't lib-path also be set?
    GoCompletionItemProvider.prototype.ensureGoCodeConfigured = function () {
        var _this = this;
        var pkgPromise = goImport_1.listPackages(true).then(function (pkgs) {
            _this.pkgsList = pkgs.map(function (pkg) {
                var index = pkg.lastIndexOf('/');
                return {
                    name: index === -1 ? pkg : pkg.substr(index + 1),
                    path: pkg
                };
            });
        });
        var configPromise = new Promise(function (resolve, reject) {
            // TODO: Since the gocode daemon is shared amongst clients, shouldn't settings be
            // adjusted per-invocation to avoid conflicts from other gocode-using programs?
            if (_this.gocodeConfigurationComplete) {
                return resolve();
            }
            var gocode = goPath_1.getBinPath('gocode');
            var autobuild = vscode.workspace.getConfiguration('go')['gocodeAutoBuild'];
            cp.execFile(gocode, ['set', 'propose-builtins', 'true'], {}, function (err, stdout, stderr) {
                cp.execFile(gocode, ['set', 'autobuild', autobuild], {}, function (err, stdout, stderr) {
                    resolve();
                });
            });
        });
        return Promise.all([pkgPromise, configPromise]).then(function () {
            return Promise.resolve();
        });
        ;
    };
    // Return importable packages that match given word as Completion Items
    GoCompletionItemProvider.prototype.getMatchingPackages = function (word, suggestionSet) {
        if (!word)
            return [];
        var completionItems = this.pkgsList.filter(function (pkgInfo) {
            return pkgInfo.name.startsWith(word) && !suggestionSet.has(pkgInfo.name);
        }).map(function (pkgInfo) {
            var item = new vscode.CompletionItem(pkgInfo.name, vscode.CompletionItemKind.Keyword);
            item.detail = pkgInfo.path;
            item.documentation = 'Imports the package';
            item.insertText = pkgInfo.name;
            item.command = {
                title: 'Import Package',
                command: 'go.import.add',
                arguments: [pkgInfo.path]
            };
            // Add same sortText to the unimported packages so that they appear after the suggestions from gocode
            item.sortText = 'z';
            return item;
        });
        return completionItems;
    };
    // Given a line ending with dot, return the word preceeding the dot if it is a package name that can be imported
    GoCompletionItemProvider.prototype.getPackagePathFromLine = function (line) {
        var pattern = /(\w+)\.$/g;
        var wordmatches = pattern.exec(line);
        if (!wordmatches) {
            return;
        }
        var _ = wordmatches[0], pkgName = wordmatches[1];
        // Word is isolated. Now check pkgsList for a match
        var matchingPackages = this.pkgsList.filter(function (pkgInfo) {
            return pkgInfo.name === pkgName;
        });
        if (matchingPackages && matchingPackages.length === 1) {
            return matchingPackages[0].path;
        }
    };
    return GoCompletionItemProvider;
}());
exports.GoCompletionItemProvider = GoCompletionItemProvider;
//# sourceMappingURL=goSuggest.js.map