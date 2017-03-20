"use strict";

var split = require('event-stream').split;
var bubbleError = require('bubble-stream-error').bubble;
var through = require('through2');

module.exports = function(inputStream, write, end, splitText) {
  write = write || function(chunk, enc, cb) {
    this.push(chunk);
    cb();
  };

  var splitStream = split(splitText);
  var stream = through({
    encoding: 'utf8',
    decodeStrings: false,
    objectMode: true
  }, write, end);

  splitStream.pipe(stream);
  bubbleError(stream, [inputStream, splitStream]);
  inputStream.pipe(splitStream);

  // TODO: manually destroy streams at the end?

  return stream;
};
