var test        = require('tap').test,
    bubbleError = require('../bubble').bubble,
    fs          = require('fs'),
    zlib        = require('zlib'),
    stream      = require('stream');

test('bubble error', function (assert) {
  var readStream, myStream;

  readStream = fs.createReadStream(__filename);
  // just a sample stream
  myStream        = stream.Writable();
  myStream._write = function(chunk, enc, next) { next(); };

  myStream.on('error', function(err) {
    assert.equal(err.message, 'error emitted on readStream');
    assert.end();
  });

  bubbleError(myStream, [readStream]);

  readStream.pipe(myStream);

  readStream.once('data', function() {
    this.emit('error', new Error('error emitted on readStream'));
  });
});
