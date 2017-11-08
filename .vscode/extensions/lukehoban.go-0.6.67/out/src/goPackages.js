"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const goPath_1 = require("./goPath");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
let allPkgsCache;
let allPkgsLastHit;
let gopkgsRunning = false;
let gopkgsSubscriptions = [];
function gopkgs() {
    let t0 = Date.now();
    return new Promise((resolve, reject) => {
        const cmd = cp.spawn(util_1.getBinPath('gopkgs'), ['-format', '{{.Name}};{{.ImportPath}}'], { env: util_1.getToolsEnvVars() });
        const chunks = [];
        const errchunks = [];
        let err;
        cmd.stdout.on('data', d => chunks.push(d));
        cmd.stderr.on('data', d => errchunks.push(d));
        cmd.on('error', e => err = e);
        cmd.on('close', () => {
            let pkgs = new Map();
            if (err && err.code === 'ENOENT') {
                return goInstallTools_1.promptForMissingTool('gopkgs');
            }
            if (err || errchunks.length > 0)
                return resolve(pkgs);
            const output = chunks.join('');
            if (output.indexOf(';') === -1) {
                // User might be using the old gopkgs tool, prompt to update
                goInstallTools_1.promptForUpdatingTool('gopkgs');
                output.split('\n').forEach(pkgPath => {
                    if (!pkgPath || !pkgPath.trim()) {
                        return;
                    }
                    let index = pkgPath.lastIndexOf('/');
                    let pkgName = index === -1 ? pkgPath : pkgPath.substr(index + 1);
                    pkgs.set(pkgPath, pkgName);
                });
                return resolve(pkgs);
            }
            output.split('\n').forEach((pkgDetail) => {
                if (!pkgDetail || !pkgDetail.trim() || pkgDetail.indexOf(';') === -1)
                    return;
                let [pkgName, pkgPath] = pkgDetail.trim().split(';');
                pkgs.set(pkgPath, pkgName);
            });
            let timeTaken = Date.now() - t0;
            /* __GDPR__
                "gopkgs" : {
                    "tool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "timeTaken": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                }
            */
            util_1.sendTelemetryEvent('gopkgs', {}, { timeTaken });
            return resolve(pkgs);
        });
    });
}
function getAllPackagesNoCache() {
    return new Promise((resolve, reject) => {
        // Use subscription style to guard costly/long running invocation
        let callback = function (pkgMap) {
            resolve(pkgMap);
        };
        gopkgsSubscriptions.push(callback);
        // Ensure only single gokpgs running
        if (!gopkgsRunning) {
            gopkgsRunning = true;
            gopkgs().then((pkgMap) => {
                gopkgsRunning = false;
                let subs = gopkgsSubscriptions;
                gopkgsSubscriptions = [];
                subs.forEach((callback) => callback(pkgMap));
            });
        }
    });
}
/**
 * Runs gopkgs
 * @returns Map<string, string> mapping between package import path and package name
 */
function getAllPackages() {
    let useCache = allPkgsCache && allPkgsLastHit && (new Date().getTime() - allPkgsLastHit) < 5000;
    if (useCache) {
        allPkgsLastHit = new Date().getTime();
        return Promise.resolve(allPkgsCache);
    }
    return getAllPackagesNoCache().then((pkgs) => {
        allPkgsLastHit = new Date().getTime();
        return allPkgsCache = pkgs;
    });
}
exports.getAllPackages = getAllPackages;
/**
 * Returns mapping of import path and package name for packages that can be imported
 * Possible to return empty if useCache options is used.
 * @param filePath. Used to determine the right relative path for vendor pkgs
 * @param useCache. Force to use cache
 * @returns Map<string, string> mapping between package import path and package name
 */
function getImportablePackages(filePath, useCache = false) {
    let getAllPackagesPromise;
    if (useCache) {
        // forced to use cache
        getAllPackagesPromise = Promise.race([getAllPackages(), allPkgsCache]);
    }
    else {
        getAllPackagesPromise = getAllPackages();
    }
    // Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
    if (process.platform === 'win32' && filePath) {
        filePath = filePath.substr(0, 1).toUpperCase() + filePath.substr(1);
    }
    return Promise.all([util_1.isVendorSupported(), getAllPackagesPromise]).then(([vendorSupported, pkgs]) => {
        let currentFileDirPath = path.dirname(filePath);
        let currentWorkspace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), currentFileDirPath);
        let pkgMap = new Map();
        pkgs.forEach((pkgName, pkgPath) => {
            if (pkgName === 'main') {
                return;
            }
            if (!vendorSupported || !currentWorkspace) {
                pkgMap.set(pkgPath, pkgName);
                return;
            }
            let relativePkgPath = getRelativePackagePath(currentFileDirPath, currentWorkspace, pkgPath);
            if (!relativePkgPath) {
                return;
            }
            let allowToImport = isAllowToImportPackage(currentFileDirPath, currentWorkspace, relativePkgPath);
            if (allowToImport) {
                pkgMap.set(relativePkgPath, pkgName);
            }
        });
        return pkgMap;
    });
}
exports.getImportablePackages = getImportablePackages;
/**
 * If given pkgPath is not vendor pkg, then the same pkgPath is returned
 * Else, the import path for the vendor pkg relative to given filePath is returned.
 */
function getRelativePackagePath(currentFileDirPath, currentWorkspace, pkgPath) {
    let magicVendorString = '/vendor/';
    let vendorIndex = pkgPath.indexOf(magicVendorString);
    if (vendorIndex === -1) {
        magicVendorString = 'vendor/';
        if (pkgPath.startsWith(magicVendorString)) {
            vendorIndex = 0;
        }
    }
    // Check if current file and the vendor pkg belong to the same root project and not sub vendor
    // If yes, then vendor pkg can be replaced with its relative path to the "vendor" folder
    // If not, then the vendor pkg should not be allowed to be imported.
    if (vendorIndex > -1) {
        let rootProjectForVendorPkg = path.join(currentWorkspace, pkgPath.substr(0, vendorIndex));
        let relativePathForVendorPkg = pkgPath.substring(vendorIndex + magicVendorString.length);
        let subVendor = relativePathForVendorPkg.indexOf('/vendor/') !== -1;
        if (relativePathForVendorPkg && currentFileDirPath.startsWith(rootProjectForVendorPkg) && !subVendor) {
            return relativePathForVendorPkg;
        }
        return '';
    }
    return pkgPath;
}
/**
 * Returns import paths for all packages under given folder (vendor will be excluded)
 */
function getNonVendorPackages(folderPath) {
    let goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
        let childProcess = cp.spawn(goRuntimePath, ['list', './...'], { cwd: folderPath, env: util_1.getToolsEnvVars() });
        let chunks = [];
        childProcess.stdout.on('data', (stdout) => {
            chunks.push(stdout);
        });
        childProcess.on('close', (status) => {
            let pkgs = chunks.join('').toString().split('\n');
            util_1.getGoVersion().then((ver) => {
                if (ver && (ver.major > 1 || (ver.major === 1 && ver.minor >= 9))) {
                    resolve(pkgs);
                }
                else {
                    resolve(pkgs.filter(pkgPath => pkgPath && !pkgPath.includes('/vendor/')));
                }
            });
        });
    });
}
exports.getNonVendorPackages = getNonVendorPackages;
// This will check whether it's regular package or internal package
// Regular package will always allowed
// Internal package only allowed if the package doing the import is within the tree rooted at the parent of "internal" directory
// see: https://golang.org/doc/go1.4#internalpackages
// see: https://golang.org/s/go14internal
function isAllowToImportPackage(toDirPath, currentWorkspace, pkgPath) {
    let internalPkgFound = pkgPath.match(/\/internal\/|\/internal$/);
    if (internalPkgFound) {
        let rootProjectForInternalPkg = path.join(currentWorkspace, pkgPath.substr(0, internalPkgFound.index));
        return toDirPath.startsWith(rootProjectForInternalPkg);
    }
    return true;
}
exports.isAllowToImportPackage = isAllowToImportPackage;
//# sourceMappingURL=goPackages.js.map