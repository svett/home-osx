"use strict";
function serializeProtocolEvent(message) {
    var payload = JSON.stringify(message);
    var finalPayload = "Content-Length: " + payload.length + "\r\n\r\n" + payload;
    return finalPayload;
}
exports.serializeProtocolEvent = serializeProtocolEvent;
var InitializationErrorResponse = (function () {
    function InitializationErrorResponse(message) {
        this.message = message;
        this.request_seq = 1;
        this.seq = 1;
        this.type = "response";
        this.success = false;
        this.command = "initialize";
    }
    return InitializationErrorResponse;
}());
exports.InitializationErrorResponse = InitializationErrorResponse;
//# sourceMappingURL=debugProtocol.js.map