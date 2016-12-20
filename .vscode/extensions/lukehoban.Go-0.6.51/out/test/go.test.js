/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
"use strict";
var assert = require('assert');
var fs = require('fs-extra');
var path = require('path');
var vscode = require('vscode');
var goExtraInfo_1 = require('../src/goExtraInfo');
var goSuggest_1 = require('../src/goSuggest');
var goSignature_1 = require('../src/goSignature');
var goDeclaration_1 = require('../src/goDeclaration');
var goCheck_1 = require('../src/goCheck');
var cp = require('child_process');
var diffUtils_1 = require('../src/diffUtils');
var util_1 = require('../src/util');
var goOutline_1 = require('../src/goOutline');
var goImport_1 = require('../src/goImport');
var goGenerateTests_1 = require('../src/goGenerateTests');
var goPath_1 = require('../src/goPath');
suite('Go Extension Tests', function () {
    var gopath = process.env['GOPATH'];
    var repoPath = path.join(gopath, 'src', 'test');
    var fixturePath = path.join(repoPath, 'testfixture');
    var fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');
    var generateTestsSourcePath = path.join(repoPath, 'generatetests');
    var generateFunctionTestSourcePath = path.join(repoPath, 'generatefunctiontest');
    var generatePackageTestSourcePath = path.join(repoPath, 'generatePackagetest');
    suiteSetup(function () {
        assert.ok(gopath !== null, 'GOPATH is not defined');
        fs.removeSync(repoPath);
        fs.copySync(path.join(fixtureSourcePath, 'test.go'), path.join(fixturePath, 'test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'errorsTest', 'errors.go'), path.join(fixturePath, 'errorsTest', 'errors.go'));
        fs.copySync(path.join(fixtureSourcePath, 'sample_test.go'), path.join(fixturePath, 'sample_test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'gogetdocTestData', 'test.go'), path.join(fixturePath, 'gogetdocTestData', 'test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generateTestsSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generateFunctionTestSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generatePackageTestSourcePath, 'generatetests.go'));
    });
    suiteTeardown(function () {
        fs.removeSync(repoPath);
    });
    function testDefinitionProvider(tool) {
        var provider = new goDeclaration_1.GoDefinitionProvider(tool);
        var uri = vscode.Uri.file(path.join(fixturePath, 'test.go'));
        var position = new vscode.Position(10, 3);
        return vscode.workspace.openTextDocument(uri).then(function (textDocument) {
            return provider.provideDefinition(textDocument, position, null).then(function (definitionInfo) {
                assert.equal(definitionInfo.uri.path.toLowerCase(), uri.path.toLowerCase(), definitionInfo.uri.path + " is not the same as " + uri.path);
                assert.equal(definitionInfo.range.start.line, 6);
                assert.equal(definitionInfo.range.start.character, 5);
            });
        }, function (err) {
            assert.ok(false, "error in OpenTextDocument " + err);
            return Promise.reject(err);
        });
    }
    function testSignatureHelpProvider(tool, testCases) {
        var provider = new goSignature_1.GoSignatureHelpProvider(tool);
        var uri = vscode.Uri.file(path.join(fixturePath, 'gogetdocTestData', 'test.go'));
        return vscode.workspace.openTextDocument(uri).then(function (textDocument) {
            var promises = testCases.map(function (_a) {
                var position = _a[0], expected = _a[1], expectedDoc = _a[2], expectedParams = _a[3];
                return provider.provideSignatureHelp(textDocument, position, null).then(function (sigHelp) {
                    assert.equal(sigHelp.signatures.length, 1, 'unexpected number of overloads');
                    assert.equal(sigHelp.signatures[0].label, expected);
                    assert.equal(sigHelp.signatures[0].documentation, expectedDoc);
                    assert.equal(sigHelp.signatures[0].parameters.length, expectedParams.length);
                    for (var i = 0; i < expectedParams.length; i++) {
                        assert.equal(sigHelp.signatures[0].parameters[i].label, expectedParams[i]);
                    }
                });
            });
            return Promise.all(promises);
        }, function (err) {
            assert.ok(false, "error in OpenTextDocument " + err);
            return Promise.reject(err);
        });
    }
    function testHoverProvider(tool, testCases) {
        var provider = new goExtraInfo_1.GoHoverProvider(tool);
        var uri = vscode.Uri.file(path.join(fixturePath, 'gogetdocTestData', 'test.go'));
        return vscode.workspace.openTextDocument(uri).then(function (textDocument) {
            var promises = testCases.map(function (_a) {
                var position = _a[0], expectedSignature = _a[1], expectedDocumentation = _a[2];
                return provider.provideHover(textDocument, position, null).then(function (res) {
                    // TODO: Documentation appears to currently be broken on Go 1.7, so disabling these tests for now
                    // if (expectedDocumentation === null) {
                    //  assert.equal(res.contents.length, 1);
                    // } else {
                    // 	assert.equal(res.contents.length, 2);
                    // 	assert.equal(expectedDocumentation, <string>(res.contents[0]));
                    // }
                    assert.equal(expectedSignature, res.contents[0].value);
                });
            });
            return Promise.all(promises);
        }, function (err) {
            assert.ok(false, "error in OpenTextDocument " + err);
            return Promise.reject(err);
        });
    }
    test('Test Definition Provider using godoc', function (done) {
        testDefinitionProvider('godoc').then(function () { return done(); }, done);
    });
    test('Test Definition Provider using gogetdoc', function (done) {
        util_1.getGoVersion().then(function (version) {
            if (version.major > 1 || (version.major === 1 && version.minor > 5)) {
                return testDefinitionProvider('gogetdoc');
            }
            return Promise.resolve();
        }).then(function () { return done(); }, done);
    });
    test('Test SignatureHelp Provider using godoc', function (done) {
        var printlnDoc = "Println formats using the default formats for its operands and writes to\nstandard output. Spaces are always added between operands and a newline\nis appended. It returns the number of bytes written and any write error\nencountered.\n";
        var testCases = [
            [new vscode.Position(19, 13), 'Println(a ...interface{}) (n int, err error)', printlnDoc, ['a ...interface{}']],
            [new vscode.Position(23, 7), 'print(txt string)', null, ['txt string']],
            [new vscode.Position(41, 19), 'Hello(s string, exclaim bool) string', null, ['s string', 'exclaim bool']]
        ];
        testSignatureHelpProvider('godoc', testCases).then(function () { return done(); }, done);
    });
    test('Test SignatureHelp Provider using gogetdoc', function (done) {
        var printlnDoc = "Println formats using the default formats for its operands and writes to standard output.\nSpaces are always added between operands and a newline is appended.\nIt returns the number of bytes written and any write error encountered.\n";
        var testCases = [
            [new vscode.Position(19, 13), 'Println(a ...interface{}) (n int, err error)', printlnDoc, ['a ...interface{}']],
            [new vscode.Position(23, 7), 'print(txt string)', 'This is an unexported function so couldnt get this comment on hover :(\nNot anymore!! gogetdoc to the rescue\n', ['txt string']],
            [new vscode.Position(41, 19), 'Hello(s string, exclaim bool) string', 'Hello is a method on the struct ABC. Will signature help understand this correctly\n', ['s string', 'exclaim bool']]
        ];
        util_1.getGoVersion().then(function (version) {
            if (version.major > 1 || (version.major === 1 && version.minor > 5)) {
                return testSignatureHelpProvider('gogetdoc', testCases);
            }
            return Promise.resolve();
        }).then(function () { return done(); }, done);
    });
    test('Test Hover Provider using godoc', function (done) {
        var printlnDoc = "Println formats using the default formats for its operands and writes to\nstandard output. Spaces are always added between operands and a newline\nis appended. It returns the number of bytes written and any write error\nencountered.\n";
        var testCases = [
            // [new vscode.Position(3,3), '/usr/local/go/src/fmt'],
            [new vscode.Position(22, 5), 'main func()', null],
            [new vscode.Position(40, 23), 'import (math "math")', null],
            [new vscode.Position(19, 6), 'Println func(a ...interface{}) (n int, err error)', printlnDoc],
            [new vscode.Position(23, 4), 'print func(txt string)', null]
        ];
        testHoverProvider('godoc', testCases).then(function () { return done(); }, done);
    });
    test('Test Hover Provider using gogetdoc', function (done) {
        var printlnDoc = "Println formats using the default formats for its operands and writes to standard output.\nSpaces are always added between operands and a newline is appended.\nIt returns the number of bytes written and any write error encountered.\n";
        var testCases = [
            [new vscode.Position(22, 5), 'func main()', ''],
            [new vscode.Position(23, 4), 'func print(txt string)', 'This is an unexported function so couldnt get this comment on hover :(\nNot anymore!! gogetdoc to the rescue\n'],
            [new vscode.Position(40, 23), 'package math', 'Package math provides basic constants and mathematical functions.\n'],
            [new vscode.Position(19, 6), 'func Println(a ...interface{}) (n int, err error)', printlnDoc],
            [new vscode.Position(27, 14), 'type ABC struct {\n    a int\n    b int\n    c int\n}', 'ABC is a struct, you coudnt use Goto Definition or Hover info on this before\nNow you can due to gogetdoc\n'],
            [new vscode.Position(28, 6), 'func CIDRMask(ones, bits int) IPMask', 'CIDRMask returns an IPMask consisting of `ones\' 1 bits\nfollowed by 0s up to a total length of `bits\' bits.\nFor a mask of this form, CIDRMask is the inverse of IPMask.Size.\n']
        ];
        util_1.getGoVersion().then(function (version) {
            if (version.major > 1 || (version.major === 1 && version.minor > 5)) {
                return testHoverProvider('gogetdoc', testCases);
            }
            return Promise.resolve();
        }).then(function () { return done(); }, done);
    });
    test('Test Completion', function (done) {
        var provider = new goSuggest_1.GoCompletionItemProvider();
        var testCases = [
            [new vscode.Position(1, 0), []],
            [new vscode.Position(4, 1), ['main', 'print', 'fmt']],
            [new vscode.Position(7, 4), ['fmt']],
            [new vscode.Position(8, 0), ['main', 'print', 'fmt', 'txt']]
        ];
        var uri = vscode.Uri.file(path.join(fixturePath, 'test.go'));
        vscode.workspace.openTextDocument(uri).then(function (textDocument) {
            return vscode.window.showTextDocument(textDocument).then(function (editor) {
                var promises = testCases.map(function (_a) {
                    var position = _a[0], expected = _a[1];
                    return provider.provideCompletionItems(editor.document, position, null).then(function (items) {
                        var labels = items.map(function (x) { return x.label; });
                        for (var _i = 0, expected_1 = expected; _i < expected_1.length; _i++) {
                            var entry = expected_1[_i];
                            if (labels.indexOf(entry) < 0) {
                                assert.fail('', entry, 'missing expected item in competion list');
                            }
                        }
                    });
                });
                return Promise.all(promises);
            }).then(function () {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return Promise.resolve();
            });
        }, function (err) {
            assert.ok(false, "error in OpenTextDocument " + err);
        }).then(function () { return done(); }, done);
    });
    test('Test Completion on unimported packages', function (done) {
        var config = Object.create(vscode.workspace.getConfiguration('go'), {
            'autocompleteUnimportedPackages': { value: true }
        });
        var provider = new goSuggest_1.GoCompletionItemProvider();
        var testCases = [
            [new vscode.Position(11, 3), ['bytes']],
            [new vscode.Position(12, 5), ['Abs', 'Acos', 'Asin']]
        ];
        var uri = vscode.Uri.file(path.join(fixturePath, 'test.go'));
        vscode.workspace.openTextDocument(uri).then(function (textDocument) {
            return vscode.window.showTextDocument(textDocument).then(function (editor) {
                return editor.edit(function (editbuilder) {
                    editbuilder.insert(new vscode.Position(12, 1), 'by\n');
                    editbuilder.insert(new vscode.Position(13, 0), 'math.\n');
                }).then(function () {
                    var promises = testCases.map(function (_a) {
                        var position = _a[0], expected = _a[1];
                        return provider.provideCompletionItemsInternal(editor.document, position, null, config).then(function (items) {
                            var labels = items.map(function (x) { return x.label; });
                            for (var _i = 0, expected_2 = expected; _i < expected_2.length; _i++) {
                                var entry = expected_2[_i];
                                assert.equal(labels.indexOf(entry) > -1, true, "missing expected item in completion list: " + entry + " Actual: " + labels);
                            }
                        });
                    });
                    return Promise.all(promises);
                });
            }).then(function () {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return Promise.resolve();
            });
        }, function (err) {
            assert.ok(false, "error in OpenTextDocument " + err);
        }).then(function () { return done(); }, done);
    });
    test('Error checking', function (done) {
        var config = vscode.workspace.getConfiguration('go');
        var expected = [
            { line: 7, severity: 'warning', msg: 'exported function Print2 should have comment or be unexported' },
            // { line: 7, severity: 'warning', msg: 'no formatting directive in Printf call' },
            { line: 11, severity: 'error', msg: 'undefined: prin' },
        ];
        util_1.getGoVersion().then(function (version) {
            if (version.major === 1 && version.minor < 6) {
                // golint is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            return goCheck_1.check(path.join(fixturePath, 'errorsTest', 'errors.go'), config).then(function (diagnostics) {
                var sortedDiagnostics = diagnostics.sort(function (a, b) { return a.line - b.line; });
                for (var i in expected) {
                    assert.equal(sortedDiagnostics[i].line, expected[i].line);
                    assert.equal(sortedDiagnostics[i].severity, expected[i].severity);
                    assert.equal(sortedDiagnostics[i].msg, expected[i].msg);
                }
                assert.equal(sortedDiagnostics.length, expected.length, "too many errors " + JSON.stringify(sortedDiagnostics));
            });
        }).then(function () { return done(); }, done);
    });
    test('Test Generate unit tests squeleton for file', function (done) {
        util_1.getGoVersion().then(function (version) {
            if (version.major === 1 && version.minor < 6) {
                // gotests is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            var uri = vscode.Uri.file(path.join(generateTestsSourcePath, 'generatetests.go'));
            return vscode.workspace.openTextDocument(uri).then(function (document) {
                return vscode.window.showTextDocument(document).then(function (editor) {
                    return goGenerateTests_1.generateTestCurrentFile().then(function (result) {
                        assert.equal(result, true);
                        return Promise.resolve();
                    });
                });
            }).then(function () {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                    return Promise.resolve();
                }
                else {
                    return Promise.reject('generatetests_test.go not found');
                }
            });
        }).then(function () { return done(); }, done);
    });
    test('Test Generate unit tests squeleton for a function', function (done) {
        util_1.getGoVersion().then(function (version) {
            if (version.major === 1 && version.minor < 6) {
                // gotests is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            var uri = vscode.Uri.file(path.join(generateFunctionTestSourcePath, 'generatetests.go'));
            return vscode.workspace.openTextDocument(uri).then(function (document) {
                return vscode.window.showTextDocument(document).then(function (editor) {
                    assert(vscode.window.activeTextEditor, 'No active editor');
                    var selection = new vscode.Selection(5, 0, 6, 0);
                    editor.selection = selection;
                    return goGenerateTests_1.generateTestCurrentFunction().then(function (result) {
                        assert.equal(result, true);
                        return Promise.resolve();
                    });
                });
            }).then(function () {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                    return Promise.resolve();
                }
                else {
                    return Promise.reject('generatetests_test.go not found');
                }
            });
        }).then(function () { return done(); }, done);
    });
    test('Test Generate unit tests squeleton for package', function (done) {
        util_1.getGoVersion().then(function (version) {
            if (version.major === 1 && version.minor < 6) {
                // gotests is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            var uri = vscode.Uri.file(path.join(generatePackageTestSourcePath, 'generatetests.go'));
            return vscode.workspace.openTextDocument(uri).then(function (document) {
                return vscode.window.showTextDocument(document).then(function (editor) {
                    return goGenerateTests_1.generateTestCurrentPackage().then(function (result) {
                        assert.equal(result, true);
                        return Promise.resolve();
                    });
                });
            }).then(function () {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                    return Promise.resolve();
                }
                else {
                    return Promise.reject('generatetests_test.go not found');
                }
            });
        }).then(function () { return done(); }, done);
    });
    test('Gometalinter error checking', function (done) {
        util_1.getGoVersion().then(function (version) {
            if (version.major === 1 && version.minor < 6) {
                // golint in gometalinter is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            var config = Object.create(vscode.workspace.getConfiguration('go'), {
                'lintTool': { value: 'gometalinter' }
            });
            var expected = [
                { line: 7, severity: 'warning', msg: 'Print2 is unused (deadcode)' },
                { line: 11, severity: 'warning', msg: 'error return value not checked (undeclared name: prin) (errcheck)' },
                { line: 7, severity: 'warning', msg: 'exported function Print2 should have comment or be unexported (golint)' },
                { line: 10, severity: 'warning', msg: 'main2 is unused (deadcode)' },
                { line: 11, severity: 'warning', msg: 'undeclared name: prin (aligncheck)' },
                { line: 11, severity: 'warning', msg: 'undeclared name: prin (gotype)' },
                { line: 11, severity: 'warning', msg: 'undeclared name: prin (interfacer)' },
                { line: 11, severity: 'warning', msg: 'undeclared name: prin (unconvert)' },
                { line: 11, severity: 'error', msg: 'undefined: prin' },
                { line: 11, severity: 'warning', msg: 'unused global variable undeclared name: prin (varcheck)' },
                { line: 11, severity: 'warning', msg: 'unused struct field undeclared name: prin (structcheck)' },
            ];
            return goCheck_1.check(path.join(fixturePath, 'errorsTest', 'errors.go'), config).then(function (diagnostics) {
                var sortedDiagnostics = diagnostics.sort(function (a, b) {
                    if (a.msg < b.msg)
                        return -1;
                    if (a.msg > b.msg)
                        return 1;
                    return 0;
                });
                for (var i in expected) {
                    assert.equal(sortedDiagnostics[i].line, expected[i].line, "Failed to match expected error #" + i + ": " + JSON.stringify(sortedDiagnostics));
                    assert.equal(sortedDiagnostics[i].severity, expected[i].severity, "Failed to match expected error #" + i + ": " + JSON.stringify(sortedDiagnostics));
                    assert.equal(sortedDiagnostics[i].msg, expected[i].msg, "Failed to match expected error #" + i + ": " + JSON.stringify(sortedDiagnostics));
                }
                assert.equal(sortedDiagnostics.length, expected.length, "too many errors " + JSON.stringify(sortedDiagnostics));
                return Promise.resolve();
            });
        }).then(function () { return done(); }, done);
    });
    test('Test diffUtils.getEditsFromUnifiedDiffStr', function (done) {
        var file1path = path.join(fixtureSourcePath, 'diffTestData', 'file1.go');
        var file2path = path.join(fixtureSourcePath, 'diffTestData', 'file2.go');
        var file1uri = vscode.Uri.file(file1path);
        var file2contents = fs.readFileSync(file2path, 'utf8');
        var diffPromise = new Promise(function (resolve, reject) {
            cp.exec("diff -u " + file1path + " " + file2path, function (err, stdout, stderr) {
                var filePatches = diffUtils_1.getEditsFromUnifiedDiffStr(stdout);
                if (!filePatches && filePatches.length !== 1) {
                    assert.fail(null, null, 'Failed to get patches for the test file');
                    return reject();
                }
                if (!filePatches[0].fileName) {
                    assert.fail(null, null, 'Failed to parse the file path from the diff output');
                    return reject();
                }
                if (!filePatches[0].edits) {
                    assert.fail(null, null, 'Failed to parse edits from the diff output');
                    return reject();
                }
                resolve(filePatches);
            });
        });
        diffPromise.then(function (filePatches) {
            return vscode.workspace.openTextDocument(file1uri).then(function (textDocument) {
                return vscode.window.showTextDocument(textDocument).then(function (editor) {
                    return editor.edit(function (editBuilder) {
                        filePatches[0].edits.forEach(function (edit) {
                            edit.applyUsingTextEditorEdit(editBuilder);
                        });
                    }).then(function () {
                        assert.equal(editor.document.getText(), file2contents);
                        return vscode.commands.executeCommand('workbench.action.files.revert');
                    });
                });
            });
        }).then(function () { return done(); }, done);
    });
    test('Test diffUtils.getEdits', function (done) {
        var file1path = path.join(fixtureSourcePath, 'diffTestData', 'file1.go');
        var file2path = path.join(fixtureSourcePath, 'diffTestData', 'file2.go');
        var file1uri = vscode.Uri.file(file1path);
        var file1contents = fs.readFileSync(file1path, 'utf8');
        var file2contents = fs.readFileSync(file2path, 'utf8');
        var fileEdits = diffUtils_1.getEdits(file1path, file1contents, file2contents);
        if (!fileEdits) {
            assert.fail(null, null, 'Failed to get patches for the test file');
            done();
            return;
        }
        if (!fileEdits.fileName) {
            assert.fail(null, null, 'Failed to parse the file path from the diff output');
            done();
            return;
        }
        if (!fileEdits.edits) {
            assert.fail(null, null, 'Failed to parse edits from the diff output');
            done();
            return;
        }
        vscode.workspace.openTextDocument(file1uri).then(function (textDocument) {
            return vscode.window.showTextDocument(textDocument).then(function (editor) {
                return editor.edit(function (editBuilder) {
                    fileEdits.edits.forEach(function (edit) {
                        edit.applyUsingTextEditorEdit(editBuilder);
                    });
                }).then(function () {
                    assert.equal(editor.document.getText(), file2contents);
                    return vscode.commands.executeCommand('workbench.action.files.revert');
                });
            }).then(function () { return done(); }, done);
        });
    });
    // This test is failing in Travis for Mac OS X with Go 1.7.
    // Commenting this and created issue https://github.com/Microsoft/vscode-go/issues/609 to track the problem
    // test('Test Env Variables are passed to Tests', (done) => {
    // 	let config = Object.create(vscode.workspace.getConfiguration('go'), {
    // 		'testEnvVars': { value: { 'dummyEnvVar': 'dummyEnvValue' } }
    // 	});
    // 	let uri = vscode.Uri.file(path.join(fixturePath, 'sample_test.go'));
    // 	vscode.workspace.openTextDocument(uri).then(document => {
    // 		return vscode.window.showTextDocument(document).then(editor => {
    // 			return testCurrentFile(config).then((result: boolean) => {
    // 				assert.equal(result, true);
    // 				return Promise.resolve();
    // 			});
    // 		});
    // 	}).then(() => done(), done);
    // });
    test('Test Outline', function (done) {
        var filePath = path.join(fixturePath, 'test.go');
        var options = { fileName: filePath };
        goOutline_1.documentSymbols(options).then(function (outlines) {
            var packageOutline = outlines[0];
            var symbols = packageOutline.children;
            var imports = symbols.filter(function (x) { return x.type === 'import'; });
            var functions = symbols.filter(function (x) { return x.type === 'function'; });
            assert.equal(packageOutline.type, 'package');
            assert.equal(packageOutline.label, 'main');
            assert.equal(imports[0].label, '"fmt"');
            assert.equal(functions[0].label, 'print');
            assert.equal(functions[1].label, 'main');
            done();
        }, done);
    });
    test('Test Outline imports only', function (done) {
        var filePath = path.join(fixturePath, 'test.go');
        var options = { fileName: filePath, importsOnly: true };
        goOutline_1.documentSymbols(options).then(function (outlines) {
            var packageOutline = outlines[0];
            var symbols = packageOutline.children;
            var imports = symbols.filter(function (x) { return x.type === 'import'; });
            var functions = symbols.filter(function (x) { return x.type === 'function'; });
            assert.equal(packageOutline.type, 'package');
            assert.equal(packageOutline.label, 'main');
            assert.equal(imports[0].label, '"fmt"');
            assert.equal(functions.length, 0);
            assert.equal(imports.length, 1);
            done();
        }, done);
    });
    test('Test listPackages', function (done) {
        var uri = vscode.Uri.file(path.join(fixturePath, 'test.go'));
        vscode.workspace.openTextDocument(uri).then(function (document) {
            return vscode.window.showTextDocument(document).then(function (editor) {
                var includeImportedPkgs = goImport_1.listPackages(false);
                var excludeImportedPkgs = goImport_1.listPackages(true);
                includeImportedPkgs.then(function (pkgs) {
                    assert.equal(pkgs.indexOf('fmt') > -1, true);
                });
                excludeImportedPkgs.then(function (pkgs) {
                    assert.equal(pkgs.indexOf('fmt') > -1, false);
                });
                return Promise.all([includeImportedPkgs, excludeImportedPkgs]);
            });
        }).then(function () { return done(); }, done);
    });
    test('Replace vendor packages with relative path', function (done) {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        var vendorSupportPromise = util_1.isVendorSupported();
        var filePath = path.join(process.env['GOPATH'], 'src', 'github.com', 'rogpeppe', 'godef', 'go', 'ast', 'ast.go');
        var vendorPkgsFullPath = [
            'github.com/rogpeppe/godef/vendor/9fans.net/go/acme',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9/client'
        ];
        var vendorPkgsRelativePath = [
            '9fans.net/go/acme',
            '9fans.net/go/plan9',
            '9fans.net/go/plan9/client'
        ];
        vendorSupportPromise.then(function (vendorSupport) {
            var gopkgsPromise = new Promise(function (resolve, reject) {
                cp.execFile(goPath_1.getBinPath('gopkgs'), [], function (err, stdout, stderr) {
                    var pkgs = stdout.split('\n').sort().slice(1);
                    if (vendorSupport) {
                        vendorPkgsFullPath.forEach(function (pkg) {
                            assert.equal(pkgs.indexOf(pkg) > -1, true, "Package not found by goPkgs: " + pkg);
                        });
                        vendorPkgsRelativePath.forEach(function (pkg) {
                            assert.equal(pkgs.indexOf(pkg), -1, "Relative path to vendor package " + pkg + " should not be returned by gopkgs command");
                        });
                    }
                    return resolve(pkgs);
                });
            });
            var listPkgPromise = vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(function (document) {
                return vscode.window.showTextDocument(document).then(function (editor) {
                    return goImport_1.listPackages().then(function (pkgs) {
                        if (vendorSupport) {
                            vendorPkgsRelativePath.forEach(function (pkg) {
                                assert.equal(pkgs.indexOf(pkg) > -1, true, "Relative path for vendor package " + pkg + " not found");
                            });
                            vendorPkgsFullPath.forEach(function (pkg) {
                                assert.equal(pkgs.indexOf(pkg), -1, "Full path for vendor package " + pkg + " should be shown by listPackages method");
                            });
                        }
                        return Promise.resolve(pkgs);
                    });
                });
            });
            return Promise.all([gopkgsPromise, listPkgPromise]).then(function (values) {
                if (!vendorSupport) {
                    var originalPkgs = values[0];
                    var updatedPkgs = values[1];
                    assert.equal(originalPkgs.length, updatedPkgs.length);
                    for (var index = 0; index < originalPkgs.length; index++) {
                        assert.equal(updatedPkgs[index], originalPkgs[index]);
                    }
                }
            });
        }).then(function () { return done(); }, done);
    });
    test('Vendor pkgs from other projects should not be allowed to import', function (done) {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        var vendorSupportPromise = util_1.isVendorSupported();
        var filePath = path.join(process.env['GOPATH'], 'src', 'github.com', 'lukehoban', 'go-outline', 'main.go');
        var vendorPkgs = [
            'github.com/rogpeppe/godef/vendor/9fans.net/go/acme',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9/client'
        ];
        vendorSupportPromise.then(function (vendorSupport) {
            var gopkgsPromise = new Promise(function (resolve, reject) {
                cp.execFile(goPath_1.getBinPath('gopkgs'), [], function (err, stdout, stderr) {
                    var pkgs = stdout.split('\n').sort().slice(1);
                    if (vendorSupport) {
                        vendorPkgs.forEach(function (pkg) {
                            assert.equal(pkgs.indexOf(pkg) > -1, true, "Package not found by goPkgs: " + pkg);
                        });
                    }
                    return resolve();
                });
            });
            var listPkgPromise = vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(function (document) {
                return vscode.window.showTextDocument(document).then(function (editor) {
                    return goImport_1.listPackages().then(function (pkgs) {
                        if (vendorSupport) {
                            vendorPkgs.forEach(function (pkg) {
                                assert.equal(pkgs.indexOf(pkg), -1, "Vendor package " + pkg + " should not be shown by listPackages method");
                            });
                        }
                        return Promise.resolve();
                    });
                });
            });
            return Promise.all([gopkgsPromise, listPkgPromise]);
        }).then(function () { return done(); }, done);
    });
});
//# sourceMappingURL=go.test.js.map