var escapeCarriageReturn = require('../index');
var expect = require('chai').expect;

describe('Escape carrigage return', function() {
  it('can handle carrigage symbol', function() {
    var txt = escapeCarriageReturn('This sentence\rThat\nwill make you pause.');
    expect(txt).to.equal('That sentence\nwill make you pause.');
  });

  it('can handle carrigage symbol without new line', function() {
    var txt = escapeCarriageReturn('1\r2\r3');
    expect(txt).to.equal('3');
  });

  it('can handle complicated carrigage symbol', function() {
    var input = [
      'hasrn\r\n',
      'hasn\n',
      '\n',
      'abcdef\r',
      'hello\n',
      'ab3\r',
      'x2\r\r',
      '1\r',
    ].join('');

    var output = [
      'hasrn\n',
      'hasn\n',
      '\n',
      'hellof\n',
      '123\r'
    ].join('');

    expect(escapeCarriageReturn(input)).to.equal(output);
  })
});
