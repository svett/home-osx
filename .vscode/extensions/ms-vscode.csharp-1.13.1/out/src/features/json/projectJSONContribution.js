/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const request_light_1 = require("request-light");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const FEED_INDEX_URL = 'https://api.nuget.org/v3/index.json';
const LIMIT = 30;
class ProjectJSONContribution {
    constructor(requestService) {
        this.requestService = requestService;
    }
    getDocumentSelector() {
        return [{ language: 'json', pattern: '**/project.json' }];
    }
    getNugetIndex() {
        if (!this.nugetIndexPromise) {
            this.nugetIndexPromise = this.makeJSONRequest(FEED_INDEX_URL).then(indexContent => {
                let services = {};
                if (indexContent && Array.isArray(indexContent.resources)) {
                    let resources = indexContent.resources;
                    for (let i = resources.length - 1; i >= 0; i--) {
                        let type = resources[i]['@type'];
                        let id = resources[i]['@id'];
                        if (type && id) {
                            services[type] = id;
                        }
                    }
                }
                return services;
            });
        }
        return this.nugetIndexPromise;
    }
    getNugetService(serviceType) {
        return this.getNugetIndex().then(services => {
            let serviceURL = services[serviceType];
            if (!serviceURL) {
                return Promise.reject(localize('json.nugget.error.missingservice', 'NuGet index document is missing service {0}', serviceType));
            }
            return serviceURL;
        });
    }
    makeJSONRequest(url) {
        return this.requestService({
            url: url
        }).then(success => {
            if (success.status === 200) {
                try {
                    return JSON.parse(success.responseText);
                }
                catch (e) {
                    return Promise.reject(localize('json.nugget.error.invalidformat', '{0} is not a valid JSON document', url));
                }
            }
            return Promise.reject(localize('json.nugget.error.indexaccess', 'Request to {0} failed: {1}', url, success.responseText));
        }, (error) => {
            return Promise.reject(localize('json.nugget.error.access', 'Request to {0} failed: {1}', url, request_light_1.getErrorStatusDescription(error.status)));
        });
    }
    collectPropertySuggestions(resource, location, currentWord, addValue, isLast, result) {
        if ((location.matches(['dependencies']) || location.matches(['frameworks', '*', 'dependencies']) || location.matches(['frameworks', '*', 'frameworkAssemblies']))) {
            return this.getNugetService('SearchAutocompleteService').then(service => {
                let queryUrl;
                if (currentWord.length > 0) {
                    queryUrl = service + '?q=' + encodeURIComponent(currentWord) + '&take=' + LIMIT;
                }
                else {
                    queryUrl = service + '?take=' + LIMIT;
                }
                return this.makeJSONRequest(queryUrl).then(resultObj => {
                    if (Array.isArray(resultObj.data)) {
                        let results = resultObj.data;
                        for (let i = 0; i < results.length; i++) {
                            let name = results[i];
                            let insertText = JSON.stringify(name);
                            if (addValue) {
                                insertText += ': "{{}}"';
                                if (!isLast) {
                                    insertText += ',';
                                }
                            }
                            let proposal = new vscode_1.CompletionItem(name);
                            proposal.kind = vscode_1.CompletionItemKind.Property;
                            proposal.insertText = insertText;
                            proposal.filterText = JSON.stringify(name);
                            result.add(proposal);
                        }
                        if (results.length === LIMIT) {
                            result.setAsIncomplete();
                        }
                    }
                }, error => {
                    result.error(error);
                });
            }, error => {
                result.error(error);
            });
        }
        ;
        return null;
    }
    collectValueSuggestions(resource, location, result) {
        if ((location.matches(['dependencies', '*']) || location.matches(['frameworks', '*', 'dependencies', '*']) || location.matches(['frameworks', '*', 'frameworkAssemblies', '*']))) {
            return this.getNugetService('PackageBaseAddress/3.0.0').then(service => {
                let currentKey = location.path[location.path.length - 1];
                if (typeof currentKey === 'string') {
                    let queryUrl = service + currentKey + '/index.json';
                    return this.makeJSONRequest(queryUrl).then(obj => {
                        if (Array.isArray(obj.versions)) {
                            let results = obj.versions;
                            for (let i = 0; i < results.length; i++) {
                                let curr = results[i];
                                let name = JSON.stringify(curr);
                                let proposal = new vscode_1.CompletionItem(name);
                                proposal.kind = vscode_1.CompletionItemKind.Class;
                                proposal.insertText = name;
                                proposal.documentation = '';
                                result.add(proposal);
                            }
                            if (results.length === LIMIT) {
                                result.setAsIncomplete();
                            }
                        }
                    }, error => {
                        result.error(error);
                    });
                }
            }, error => {
                result.error(error);
            });
        }
        return null;
    }
    collectDefaultSuggestions(resource, result) {
        let defaultValue = {
            'version': '{{1.0.0-*}}',
            'dependencies': {},
            'frameworks': {
                'dnx451': {},
                'dnxcore50': {}
            }
        };
        let proposal = new vscode_1.CompletionItem(localize('json.project.default', 'Default project.json'));
        proposal.kind = vscode_1.CompletionItemKind.Module;
        proposal.insertText = JSON.stringify(defaultValue, null, '\t');
        result.add(proposal);
        return null;
    }
    resolveSuggestion(item) {
        if (item.kind === vscode_1.CompletionItemKind.Property) {
            let pack = item.label;
            return this.getInfo(pack).then(info => {
                if (info.description) {
                    item.documentation = info.description;
                }
                if (info.version) {
                    item.detail = info.version;
                    item.insertText = item.insertText.replace(/\{\{\}\}/, '{{' + info.version + '}}');
                }
                return item;
            });
        }
        return null;
    }
    getInfo(pack) {
        return this.getNugetService('SearchQueryService').then(service => {
            let queryUrl = service + '?q=' + encodeURIComponent(pack) + '&take=' + 5;
            return this.makeJSONRequest(queryUrl).then(resultObj => {
                if (Array.isArray(resultObj.data)) {
                    let results = resultObj.data;
                    let info = {};
                    for (let i = 0; i < results.length; i++) {
                        let res = results[i];
                        if (res.id === pack) {
                            info.description = res.description;
                            info.version = localize('json.nugget.version.hover', 'Latest version: {0}', res.version);
                        }
                    }
                    return info;
                }
                return null;
            }, (error) => {
                return null;
            });
        }, (error) => {
            return null;
        });
    }
    getInfoContribution(resource, location) {
        if ((location.matches(['dependencies', '*']) || location.matches(['frameworks', '*', 'dependencies', '*']) || location.matches(['frameworks', '*', 'frameworkAssemblies', '*']))) {
            let pack = location.path[location.path.length - 1];
            if (typeof pack === 'string') {
                return this.getInfo(pack).then(info => {
                    let htmlContent = [];
                    htmlContent.push(localize('json.nugget.package.hover', '{0}', pack));
                    if (info.description) {
                        htmlContent.push(info.description);
                    }
                    if (info.version) {
                        htmlContent.push(info.version);
                    }
                    return htmlContent;
                });
            }
        }
        return null;
    }
}
exports.ProjectJSONContribution = ProjectJSONContribution;
//# sourceMappingURL=projectJSONContribution.js.map