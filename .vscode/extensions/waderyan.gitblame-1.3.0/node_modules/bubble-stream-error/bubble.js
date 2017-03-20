function emitError(stream) {
  return function(err) {
    stream.emit('error', err);
  }
}

function bubbleError(topStream, childStreams) {
  var i, len, onError;

  onError = emitError(topStream);

  for (i = 0, len = childStreams.length; i < len; i++) {
    childStreams[i].on('error', onError);
  }
}

module.exports = {
  _emitError : emitError,
  bubble     : bubbleError
};
