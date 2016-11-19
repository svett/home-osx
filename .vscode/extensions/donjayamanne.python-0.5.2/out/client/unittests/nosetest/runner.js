'use strict';
const helpers_1 = require('../../common/helpers');
const testUtils_1 = require('../common/testUtils');
const xUnitParser_1 = require('../common/xUnitParser');
const runner_1 = require('../common/runner');
const configSettings_1 = require('../../common/configSettings');
const pythonSettings = configSettings_1.PythonSettings.getInstance();
function runTest(rootDirectory, tests, args, testsToRun, token, outChannel) {
    let testPaths = [];
    if (testsToRun && testsToRun.testFolder) {
        testPaths = testPaths.concat(testsToRun.testFolder.map(f => f.nameToRun));
    }
    if (testsToRun && testsToRun.testFile) {
        testPaths = testPaths.concat(testsToRun.testFile.map(f => f.nameToRun));
    }
    if (testsToRun && testsToRun.testSuite) {
        testPaths = testPaths.concat(testsToRun.testSuite.map(f => f.nameToRun));
    }
    if (testsToRun && testsToRun.testFunction) {
        testPaths = testPaths.concat(testsToRun.testFunction.map(f => f.nameToRun));
    }
    let xmlLogFile = '';
    let xmlLogFileCleanup = null;
    return helpers_1.createTemporaryFile('.xml').then(xmlLogResult => {
        xmlLogFile = xmlLogResult.filePath;
        xmlLogFileCleanup = xmlLogResult.cleanupCallback;
        return runner_1.run(pythonSettings.unitTest.nosetestPath, args.concat(['--with-xunit', `--xunit-file=${xmlLogFile}`]).concat(testPaths), rootDirectory, token, outChannel);
    }).then(() => {
        return updateResultsFromLogFiles(tests, xmlLogFile);
    }).then(result => {
        xmlLogFileCleanup();
        return result;
    }).catch(reason => {
        xmlLogFileCleanup();
        return Promise.reject(reason);
    });
}
exports.runTest = runTest;
function updateResultsFromLogFiles(tests, outputXmlFile) {
    return xUnitParser_1.updateResultsFromXmlLogFile(tests, outputXmlFile, xUnitParser_1.PassCalculationFormulae.nosetests).then(() => {
        testUtils_1.updateResults(tests);
        return tests;
    });
}
exports.updateResultsFromLogFiles = updateResultsFromLogFiles;
//# sourceMappingURL=runner.js.map