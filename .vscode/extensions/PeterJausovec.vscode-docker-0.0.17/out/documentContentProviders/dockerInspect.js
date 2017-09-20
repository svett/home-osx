"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const docker_endpoint_1 = require("../commands/utils/docker-endpoint");
exports.IMAGE_DOMAIN = "image";
exports.SCHEME = "docker-inspect";
exports.URI_EXTENSION = ".json";
class DockerInspectDocumentContentProvider {
    static openImageInspectDocument(image) {
        return __awaiter(this, void 0, void 0, function* () {
            const imageName = image.RepoTags ? image.RepoTags[0] : image.Id;
            const uri = vscode_1.Uri.parse(`${exports.SCHEME}://${exports.IMAGE_DOMAIN}/${imageName}${exports.URI_EXTENSION}`);
            vscode_1.window.showTextDocument(yield vscode_1.workspace.openTextDocument(uri));
        });
    }
    provideTextDocumentContent({ path }) {
        return new Promise((resolve, reject) => {
            const imageName = path.substring(1).replace(exports.URI_EXTENSION, "");
            docker_endpoint_1.docker.getImage(imageName).inspect((error, imageMetadata) => {
                resolve(JSON.stringify(imageMetadata, null, "    "));
            });
        });
    }
}
exports.default = DockerInspectDocumentContentProvider;
//# sourceMappingURL=dockerInspect.js.map