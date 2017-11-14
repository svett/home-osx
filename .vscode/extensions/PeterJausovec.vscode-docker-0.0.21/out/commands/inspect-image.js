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
const dockerInspect_1 = require("../documentContentProviders/dockerInspect");
const quick_pick_image_1 = require("./utils/quick-pick-image");
const telemetry_1 = require("../telemetry/telemetry");
function inspectImage(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let imageToInspect;
        if (context && context.imageDesc) {
            imageToInspect = context.imageDesc;
        }
        else {
            const selectedImage = yield quick_pick_image_1.quickPickImage();
            if (selectedImage) {
                imageToInspect = selectedImage.imageDesc;
            }
        }
        if (imageToInspect) {
            yield dockerInspect_1.default.openImageInspectDocument(imageToInspect);
            telemetry_1.reporter && telemetry_1.reporter.sendTelemetryEvent("command", { command: "vscode-docker.image.inspect" });
        }
    });
}
exports.default = inspectImage;
;
//# sourceMappingURL=inspect-image.js.map