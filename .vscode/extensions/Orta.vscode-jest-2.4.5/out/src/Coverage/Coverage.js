"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const istanbul_lib_source_maps_1 = require("istanbul-lib-source-maps");
const istanbul_lib_coverage_1 = require("istanbul-lib-coverage");
class Coverage {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.sourceMapStore = istanbul_lib_source_maps_1.createSourceMapStore();
        this.transformedCoverageMap = istanbul_lib_coverage_1.createCoverageMap();
    }
    mapCoverage(data) {
        const cm = istanbul_lib_coverage_1.createCoverageMap(data);
        const transformed = this.sourceMapStore.transformCoverage(cm);
        this.transformedCoverageMap = transformed.map;
    }
    getCoverageForFile(file) {
        try {
            return this.transformedCoverageMap.fileCoverageFor(file);
        }
        catch (e) {
            return null;
        }
    }
}
exports.Coverage = Coverage;
//# sourceMappingURL=Coverage.js.map