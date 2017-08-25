/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ee = require("events");
class ProtocolClient extends ee.EventEmitter {
    constructor() {
        super();
        this.sequence = 1;
        this.contentLength = -1;
        this.pendingRequests = {};
        this.rawData = new Buffer(0);
    }
    connect(readable, writable) {
        this.outputStream = writable;
        readable.on('data', (data) => {
            this.rawData = Buffer.concat([this.rawData, data]);
            this.handleData();
        });
    }
    send(command, args) {
        return new Promise((completeDispatch, errorDispatch) => {
            this.doSend(command, args, (result) => {
                if (result.success) {
                    completeDispatch(result);
                }
                else {
                    errorDispatch(new Error(result.message));
                }
            });
        });
    }
    doSend(command, args, clb) {
        var request = {
            type: 'request',
            seq: this.sequence++,
            command: command
        };
        if (args && Object.keys(args).length > 0) {
            request.arguments = args;
        }
        // store callback for this request
        this.pendingRequests[request.seq] = clb;
        var json = JSON.stringify(request);
        var length = Buffer.byteLength(json, 'utf8');
        this.outputStream.write('Content-Length: ' + length.toString() + ProtocolClient.TWO_CRLF, 'utf8');
        this.outputStream.write(json, 'utf8');
    }
    handleData() {
        while (true) {
            if (this.contentLength >= 0) {
                if (this.rawData.length >= this.contentLength) {
                    var message = this.rawData.toString('utf8', 0, this.contentLength);
                    this.rawData = this.rawData.slice(this.contentLength);
                    this.contentLength = -1;
                    if (message.length > 0) {
                        this.dispatch(message);
                    }
                    continue; // there may be more complete messages to process
                }
            }
            else {
                var s = this.rawData.toString('utf8', 0, this.rawData.length);
                var idx = s.indexOf(ProtocolClient.TWO_CRLF);
                if (idx !== -1) {
                    var match = /Content-Length: (\d+)/.exec(s);
                    if (match && match[1]) {
                        this.contentLength = Number(match[1]);
                        this.rawData = this.rawData.slice(idx + ProtocolClient.TWO_CRLF.length);
                        continue; // try to handle a complete message
                    }
                }
            }
            break;
        }
    }
    dispatch(body) {
        var rawData = JSON.parse(body);
        if (typeof rawData.event !== 'undefined') {
            var event = rawData;
            this.emit(event.event, event);
        }
        else {
            var response = rawData;
            var clb = this.pendingRequests[response.request_seq];
            if (clb) {
                delete this.pendingRequests[response.request_seq];
                clb(response);
            }
        }
    }
}
ProtocolClient.TWO_CRLF = '\r\n\r\n';
exports.ProtocolClient = ProtocolClient;
//# sourceMappingURL=protocolClient.js.map