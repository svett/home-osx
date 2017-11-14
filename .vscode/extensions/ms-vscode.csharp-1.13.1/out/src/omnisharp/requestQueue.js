"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const prioritization = require("./prioritization");
/**
 * This data structure manages a queue of requests that have been made and requests that have been
 * sent to the OmniSharp server and are waiting on a response.
 */
class RequestQueue {
    constructor(_name, _maxSize, _logger, _makeRequest) {
        this._name = _name;
        this._maxSize = _maxSize;
        this._logger = _logger;
        this._makeRequest = _makeRequest;
        this._pending = [];
        this._waiting = new Map();
    }
    /**
     * Enqueue a new request.
     */
    enqueue(request) {
        this._logger.appendLine(`Enqueue ${this._name} request for ${request.command}.`);
        this._pending.push(request);
    }
    /**
     * Dequeue a request that has completed.
     */
    dequeue(id) {
        const request = this._waiting.get(id);
        if (request) {
            this._waiting.delete(id);
            this._logger.appendLine(`Dequeue ${this._name} request for ${request.command} (${id}).`);
        }
        return request;
    }
    cancelRequest(request) {
        let index = this._pending.indexOf(request);
        if (index !== -1) {
            this._pending.splice(index, 1);
            // Note: This calls reject() on the promise returned by OmniSharpServer.makeRequest
            request.onError(new Error(`Pending request cancelled: ${request.command}`));
        }
        // TODO: Handle cancellation of a request already waiting on the OmniSharp server.
    }
    /**
     * Returns true if there are any requests pending to be sent to the OmniSharp server.
     */
    hasPending() {
        return this._pending.length > 0;
    }
    /**
     * Returns true if the maximum number of requests waiting on the OmniSharp server has been reached.
     */
    isFull() {
        return this._waiting.size >= this._maxSize;
    }
    /**
     * Process any pending requests and send them to the OmniSharp server.
     */
    processPending() {
        if (this._pending.length === 0) {
            return;
        }
        this._logger.appendLine(`Processing ${this._name} queue`);
        this._logger.increaseIndent();
        const slots = this._maxSize - this._waiting.size;
        for (let i = 0; i < slots && this._pending.length > 0; i++) {
            const item = this._pending.shift();
            item.startTime = Date.now();
            const id = this._makeRequest(item);
            this._waiting.set(id, item);
            if (this.isFull()) {
                break;
            }
        }
        this._logger.decreaseIndent();
    }
}
class RequestQueueCollection {
    constructor(logger, concurrency, makeRequest) {
        this._priorityQueue = new RequestQueue('Priority', 1, logger, makeRequest);
        this._normalQueue = new RequestQueue('Normal', concurrency, logger, makeRequest);
        this._deferredQueue = new RequestQueue('Deferred', Math.max(Math.floor(concurrency / 4), 2), logger, makeRequest);
    }
    getQueue(command) {
        if (prioritization.isPriorityCommand(command)) {
            return this._priorityQueue;
        }
        else if (prioritization.isNormalCommand(command)) {
            return this._normalQueue;
        }
        else {
            return this._deferredQueue;
        }
    }
    enqueue(request) {
        const queue = this.getQueue(request.command);
        queue.enqueue(request);
        this.drain();
    }
    dequeue(command, seq) {
        const queue = this.getQueue(command);
        return queue.dequeue(seq);
    }
    cancelRequest(request) {
        const queue = this.getQueue(request.command);
        queue.cancelRequest(request);
    }
    drain() {
        if (this._isProcessing) {
            return false;
        }
        if (this._priorityQueue.isFull()) {
            return false;
        }
        if (this._normalQueue.isFull() && this._deferredQueue.isFull()) {
            return false;
        }
        this._isProcessing = true;
        if (this._priorityQueue.hasPending()) {
            this._priorityQueue.processPending();
            this._isProcessing = false;
            return;
        }
        if (this._normalQueue.hasPending()) {
            this._normalQueue.processPending();
        }
        if (this._deferredQueue.hasPending()) {
            this._deferredQueue.processPending();
        }
        this._isProcessing = false;
    }
}
exports.RequestQueueCollection = RequestQueueCollection;
//# sourceMappingURL=requestQueue.js.map