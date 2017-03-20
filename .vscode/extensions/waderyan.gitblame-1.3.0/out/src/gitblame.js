"use strict";
var GitBlame = (function () {
    function GitBlame(repoPath, gitBlameProcess) {
        this.repoPath = repoPath;
        this.gitBlameProcess = gitBlameProcess;
        this._blamed = {};
    }
    GitBlame.prototype.getBlameInfo = function (fileName) {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (self.needsBlame(fileName)) {
                self.blameFile(self.repoPath, fileName).then(function (blameInfo) {
                    self._blamed[fileName] = blameInfo;
                    resolve(blameInfo);
                }, function (err) {
                    reject();
                });
            }
            else {
                resolve(self._blamed[fileName]);
            }
        });
    };
    GitBlame.prototype.needsBlame = function (fileName) {
        return !(fileName in this._blamed);
    };
    GitBlame.prototype.blameFile = function (repo, fileName) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var blameInfo = {
                'lines': {},
                'commits': {}
            };
            self.gitBlameProcess(repo, {
                file: fileName
            }).on('data', function (type, data) {
                // outputs in Porcelain format.
                if (type === 'line') {
                    blameInfo['lines'][data.finalLine] = data;
                }
                else if (type === 'commit' && !(data.hash in blameInfo['commits'])) {
                    blameInfo['commits'][data.hash] = data;
                }
            }).on('error', function (err) {
                reject(err);
            }).on('end', function () {
                resolve(blameInfo);
            });
        });
    };
    GitBlame.prototype.dispose = function () {
        // Nothing to release.
    };
    return GitBlame;
}());
exports.GitBlame = GitBlame;
//# sourceMappingURL=gitblame.js.map