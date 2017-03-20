var bubbleError = require('../bubble').bubble,
    fs          = require('fs'),
    zlib        = require('zlib'),
    stream      = require('stream'),
    readStream, compressStream, myStream;

readStream     = fs.createReadStream(__filename);
compressStream = zlib.createGzip();

// just a sample stream
myStream        = stream.Writable();
myStream._write = function(chunk, enc, next) { next(); };

myStream.on('error', function(err) {
  console.log('myStream error:', err.message);
});

bubbleError(myStream, [readStream, compressStream]);

readStream.pipe(compressStream).pipe(myStream);

compressStream.once('data', function() {
  this.emit('error', new Error('error emitted on compressStream'));
});

// you can test also on the readStream by uncommenting below
/*
readStream.once('data', function() {
  this.emit('error', new Error('error emitted on readStream'));
});
*/
