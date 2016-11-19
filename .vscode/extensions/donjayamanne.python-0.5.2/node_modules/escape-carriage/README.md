# escape-carriage

[![Build Status](https://travis-ci.org/lgeiger/escape-carriage.svg?branch=master)](https://travis-ci.org/lgeiger/escape-carriage)

Escape `\r` the right way.

```
npm install --save escape-carriage
```

## Usage

```javascript
var escapeCarriageReturn = require('escape-carriage');

escapeCarriageReturn('This sentence\rThat\nwill make you pause.');
// That sentence
// will make you pause.
```
