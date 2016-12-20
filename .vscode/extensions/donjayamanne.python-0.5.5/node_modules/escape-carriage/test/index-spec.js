var escapeCarriageReturn = require('../index');
var expect = require('chai').expect;

describe('Escape carrigage return', function() {
  it('can handle carrigage symbol', function() {
    var txt = escapeCarriageReturn('This sentence\rThat\nwill make you pause.');
    expect(txt).to.equal('That sentence\nwill make you pause.');
  });
});
