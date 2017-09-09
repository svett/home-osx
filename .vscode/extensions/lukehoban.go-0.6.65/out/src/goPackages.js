"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const goPath_1 = require("./goPath");
const util_1 = require("./util");
let allPkgs = new Map();
let goListAllCompleted = false;
let goListAllPromise;
function isGoListComplete() {
    return goListAllCompleted;
}
exports.isGoListComplete = isGoListComplete;
/**
 * Runs go list all
 * @returns Map<string, string> mapping between package import path and package name
 */
function goListAll() {
    let goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    if (goListAllPromise) {
        return goListAllPromise;
    }
    goListAllPromise = new Promise((resolve, reject) => {
        // Use `{env: {}}` to make the execution faster. Include GOPATH to account if custom work space exists.
        const env = util_1.getToolsEnvVars();
        const cmd = cp.spawn(goRuntimePath, ['list', '-f', '{{.Name}};{{.ImportPath}}', 'all'], { env: env, stdio: ['pipe', 'pipe', 'ignore'] });
        const chunks = [];
        cmd.stdout.on('data', (d) => {
            chunks.push(d);
        });
        cmd.on('close', (status) => {
            chunks.join('').split('\n').forEach(pkgDetail => {
                if (!pkgDetail || !pkgDetail.trim() || pkgDetail.indexOf(';') === -1)
                    return;
                let [pkgName, pkgPath] = pkgDetail.trim().split(';');
                allPkgs.set(pkgPath, pkgName);
            });
            goListAllCompleted = true;
            return resolve(allPkgs);
        });
    });
    return goListAllPromise;
}
exports.goListAll = goListAll;
/**
 * Returns mapping of import path and package name for packages that can be imported
 * @param filePath. Used to determine the right relative path for vendor pkgs
 * @returns Map<string, string> mapping between package import path and package name
 */
function getImportablePackages(filePath) {
    return Promise.all([util_1.isVendorSupported(), goListAll()]).then(values => {
        let isVendorSupported = values[0];
        let currentFileDirPath = path.dirname(filePath);
        let currentWorkspace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), currentFileDirPath);
        let pkgMap = new Map();
        allPkgs.forEach((pkgName, pkgPath) => {
            if (pkgName === 'main') {
                return;
            }
            if (!isVendorSupported || !currentWorkspace) {
                pkgMap.set(pkgPath, pkgName);
                return;
            }
            let relativePkgPath = getRelativePackagePath(currentFileDirPath, currentWorkspace, pkgPath);
            if (relativePkgPath) {
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
    // Check if current file and the vendor pkg belong to the same root project
    // If yes, then vendor pkg can be replaced with its relative path to the "vendor" folder
    // If not, then the vendor pkg should not be allowed to be imported.
    if (vendorIndex > -1) {
        let rootProjectForVendorPkg = path.join(currentWorkspace, pkgPath.substr(0, vendorIndex));
        let relativePathForVendorPkg = pkgPath.substring(vendorIndex + magicVendorString.length);
        if (relativePathForVendorPkg && currentFileDirPath.startsWith(rootProjectForVendorPkg)) {
            return relativePathForVendorPkg;
        }
        return '';
    }
    return pkgPath;
}
exports.getRelativePackagePath = getRelativePackagePath;
/**
 * Returns import paths for all non vendor packages under given folder
 */
function getNonVendorPackages(folderPath) {
    let goRuntimePath = goPath_1.getGoRuntimePath();
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
        const childProcess = cp.spawn(goRuntimePath, ['list', './...'], { cwd: folderPath, env: util_1.getToolsEnvVars() });
        const chunks = [];
        childProcess.stdout.on('data', (stdout) => {
            chunks.push(stdout);
        });
        childProcess.on('close', (status) => {
            const pkgs = chunks.join('').toString().split('\n').filter(pkgPath => pkgPath && !pkgPath.includes('/vendor/'));
            return resolve(pkgs);
        });
    });
}
exports.getNonVendorPackages = getNonVendorPackages;
//# sourceMappingURL=goPackages.js.map