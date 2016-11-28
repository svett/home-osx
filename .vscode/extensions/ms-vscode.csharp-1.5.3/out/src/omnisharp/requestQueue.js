/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
"use strict";
var prioritization = require('./prioritization');
/**
 * This data structure manages a queue of requests that have been made and requests that have been
 * sent to the OmniSharp server and are waiting on a response.
 */
var RequestQueue = (function () {
    function RequestQueue(_name, _maxSize, _logger, _makeRequest) {
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
    RequestQueue.prototype.enqueue = function (request) {
        this._logger.appendLine("Enqueue " + this._name + " request for " + request.command + ".");
        this._pending.push(request);
    };
    /**
     * Dequeue a request that has completed.
     */
    RequestQueue.prototype.dequeue = function (id) {
        var request = this._waiting.get(id);
        if (request) {
            this._waiting.delete(id);
            this._logger.appendLine("Dequeue " + this._name + " request for " + request.command + " (" + id + ").");
        }
        return request;
    };
    RequestQueue.prototype.cancelRequest = function (request) {
        var index = this._pending.indexOf(request);
        if (index !== -1) {
            this._pending.splice(index, 1);
            // Note: This calls reject() on the promise returned by OmniSharpServer.makeRequest
            request.onError(new Error("Pending request cancelled: " + request.command));
        }
        // TODO: Handle cancellation of a request already waiting on the OmniSharp server.
    };
    /**
     * Returns true if there are any requests pending to be sent to the OmniSharp server.
     */
    RequestQueue.prototype.hasPending = function () {
        return this._pending.length > 0;
    };
    /**
     * Returns true if the maximum number of requests waiting on the OmniSharp server has been reached.
     */
    RequestQueue.prototype.isFull = function () {
        return this._waiting.size >= this._maxSize;
    };
    /**
     * Process any pending requests and send them to the OmniSharp server.
     */
    RequestQueue.prototype.processPending = function () {
        if (this._pending.length === 0) {
            return;
        }
        this._logger.appendLine("Processing " + this._name + " queue");
        this._logger.increaseIndent();
        var slots = this._maxSize - this._waiting.size;
        for (var i = 0; i < slots && this._pending.length > 0; i++) {
            var item = this._pending.shift();
            item.startTime = Date.now();
            var id = this._makeRequest(item);
            this._waiting.set(id, item);
            if (this.isFull()) {
                break;
            }
        }
        this._logger.decreaseIndent();
    };
    return RequestQueue;
}());
var RequestQueueCollection = (function () {
    function RequestQueueCollection(logger, concurrency, makeRequest) {
        this._priorityQueue = new RequestQueue('Priority', 1, logger, makeRequest);
        this._normalQueue = new RequestQueue('Normal', concurrency, logger, makeRequest);
        this._deferredQueue = new RequestQueue('Deferred', Math.max(Math.floor(concurrency / 4), 2), logger, makeRequest);
    }
    RequestQueueCollection.prototype.getQueue = function (command) {
        if (prioritization.isPriorityCommand(command)) {
            return this._priorityQueue;
        }
        else if (prioritization.isNormalCommand(command)) {
            return this._normalQueue;
        }
        else {
            return this._deferredQueue;
        }
    };
    RequestQueueCollection.prototype.enqueue = function (request) {
        var queue = this.getQueue(request.command);
        queue.enqueue(request);
        this.drain();
    };
    RequestQueueCollection.prototype.dequeue = function (command, seq) {
        var queue = this.getQueue(command);
        return queue.dequeue(seq);
    };
    RequestQueueCollection.prototype.cancelRequest = function (request) {
        var queue = this.getQueue(request.command);
        queue.cancelRequest(request);
    };
    RequestQueueCollection.prototype.drain = function () {
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
    };
    return RequestQueueCollection;
}());
exports.RequestQueueCollection = RequestQueueCollection;
//# sourceMappingURL=requestQueue.js.map