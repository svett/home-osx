function escapeCarriageReturn(txt) {
  txt = txt.replace(/\r+\n/gm, '\n'); // \r followed by \n --> newline
  while (txt.search(/\r/g) > -1) {
    var base = txt.match(/^.*\r+/m)[0].replace(/\r/, '');
    var insert = txt.match(/\r+.*$/m)[0].replace(/\r/, '');
    insert = insert + base.slice(insert.length, base.length);

    txt = txt.replace(/\r+.*$/m, '\r').replace(/^.*\r+/m, insert);
  }
  return txt;
}

module.exports = escapeCarriageReturn;
