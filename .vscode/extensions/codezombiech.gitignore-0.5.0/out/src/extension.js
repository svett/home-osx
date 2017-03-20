"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode = require('vscode');
var cache_1 = require('./cache');
var GitHubApi = require('github');
var fs = require('fs');
var https = require('https');
var url = require('url');
var CancellationError = (function (_super) {
    __extends(CancellationError, _super);
    function CancellationError() {
        _super.apply(this, arguments);
    }
    return CancellationError;
}(Error));
var OperationType;
(function (OperationType) {
    OperationType[OperationType["Append"] = 0] = "Append";
    OperationType[OperationType["Overwrite"] = 1] = "Overwrite";
})(OperationType || (OperationType = {}));
var GitignoreRepository = (function () {
    function GitignoreRepository(client) {
        this.client = client;
        var config = vscode.workspace.getConfiguration('gitignore');
        this.cache = new cache_1.Cache(config.get('cacheExpirationInterval', 3600));
    }
    /**
     * Get all .gitignore files
     */
    GitignoreRepository.prototype.getFiles = function (path) {
        var _this = this;
        if (path === void 0) { path = ''; }
        return new Promise(function (resolve, reject) {
            // If cached, return cached content
            var item = _this.cache.get('gitignore/' + path);
            if (typeof item !== 'undefined') {
                resolve(item);
                return;
            }
            // Download .gitignore files from github
            _this.client.repos.getContent({
                owner: 'github',
                repo: 'gitignore',
                path: path
            }, function (err, response) {
                if (err) {
                    reject(err.code + ": " + err.message);
                    return;
                }
                console.log("vscode-gitignore: Github API ratelimit remaining: " + response.meta['x-ratelimit-remaining']);
                var files = response
                    .filter(function (file) {
                    return (file.type === 'file' && file.name.endsWith('.gitignore'));
                })
                    .map(function (file) {
                    return {
                        label: file.name.replace(/\.gitignore/, ''),
                        description: file.path,
                        url: file.download_url
                    };
                });
                // Cache the retrieved gitignore files
                _this.cache.add(new cache_1.CacheItem('gitignore/' + path, files));
                resolve(files);
            });
        });
    };
    /**
     * Downloads a .gitignore from the repository to the path passed
     */
    GitignoreRepository.prototype.download = function (operation) {
        return new Promise(function (resolve, reject) {
            var flags = operation.type === OperationType.Overwrite ? 'w' : 'a';
            var file = fs.createWriteStream(operation.path, { flags: flags });
            // If appending to the existing .gitignore file, write a NEWLINE as seperator
            if (flags === 'a')
                file.write('\n');
            var options = url.parse(operation.file.url);
            options.agent = getAgent(); // Proxy
            options.headers = {
                'User-Agent': userAgent
            };
            var request = https.get(options, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close(function () {
                        resolve(operation);
                    });
                });
            }).on('error', function (err) {
                // Delete the .gitignore file if we created it
                if (flags === 'w') {
                    fs.unlink(operation.path);
                }
                reject(err.message);
            });
        });
    };
    return GitignoreRepository;
}());
exports.GitignoreRepository = GitignoreRepository;
var userAgent = 'vscode-gitignore-extension';
// Read proxy configuration
var httpConfig = vscode.workspace.getConfiguration('http');
var proxy = httpConfig.get('proxy', undefined);
console.log("vscode-gitignore: using proxy " + proxy);
// Create a Github API client
var client = new GitHubApi({
    version: '3.0.0',
    protocol: 'https',
    host: 'api.github.com',
    //debug: true,
    pathPrefix: '',
    timeout: 5000,
    headers: {
        'User-Agent': userAgent
    },
    proxy: proxy
});
// Create gitignore repository
var gitignoreRepository = new GitignoreRepository(client);
var agent;
function getAgent() {
    if (agent)
        return agent;
    // Read proxy url in following order: vscode settings, environment variables
    proxy = proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxy) {
        var HttpsProxyAgent = require('https-proxy-agent');
        agent = new HttpsProxyAgent(proxy);
    }
    return agent;
}
function getGitignoreFiles() {
    // Get lists of .gitignore files from Github
    return Promise.all([
        gitignoreRepository.getFiles(),
        gitignoreRepository.getFiles('Global')
    ])
        .then(function (result) {
        var files = Array.prototype.concat.apply([], result)
            .sort(function (a, b) { return a.label.localeCompare(b.label); });
        return files;
    });
}
function promptForOperation() {
    return vscode.window.showQuickPick([
        {
            label: 'Append',
            description: 'Append to existing .gitignore file'
        },
        {
            label: 'Overwrite',
            description: 'Overwrite existing .gitignore file'
        }
    ]);
}
function showSuccessMessage(operation) {
    switch (operation.type) {
        case OperationType.Append:
            return vscode.window.showInformationMessage("Appended " + operation.file.description + " to the existing .gitignore in the project root");
        case OperationType.Overwrite:
            return vscode.window.showInformationMessage("Created .gitignore file in the project root based on " + operation.file.description);
        default:
            throw new Error('Unsupported operation');
    }
}
function activate(context) {
    console.log('vscode-gitignore: extension is now active!');
    var disposable = vscode.commands.registerCommand('addgitignore', function () {
        // Check if workspace open
        if (!vscode.workspace.rootPath) {
            vscode.window.showErrorMessage('No workspace directory open');
            return;
        }
        Promise.resolve()
            .then(function () {
            return vscode.window.showQuickPick(getGitignoreFiles());
        })
            .then(function (file) {
            if (!file) {
                // Cancel
                throw new CancellationError();
            }
            var path = vscode.workspace.rootPath + '/.gitignore';
            return new Promise(function (resolve, reject) {
                // Check if file exists
                fs.stat(path, function (err, stats) {
                    if (err) {
                        // File does not exists -> we are fine to create it
                        resolve({ path: path, file: file, type: OperationType.Overwrite });
                    }
                    else {
                        promptForOperation()
                            .then(function (operation) {
                            if (!operation) {
                                // Cancel
                                reject(new CancellationError());
                                return;
                            }
                            resolve({ path: path, file: file, type: OperationType[operation.label] });
                        });
                    }
                });
            });
        })
            .then(function (operation) {
            return gitignoreRepository.download(operation);
        })
            .then(function (operation) {
            return showSuccessMessage(operation);
        })
            .catch(function (reason) {
            if (reason instanceof CancellationError) {
                return;
            }
            vscode.window.showErrorMessage(reason);
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    console.log('vscode-gitignore: extension is now deactivated!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map