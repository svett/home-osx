# mathml-tag-names [![Build Status][build-badge]][build-page] [![Coverage Status][coverage-badge]][coverage-page]

List of known MathML tag-names.  Includes the elements from
[MathML 1][mathml1], [MathML 2][mathml2], and
[MathML 3][mathml3].

The repo contains a script to crawl specs to include newly introduced
tag-names.

## Installation

[npm][]:

```bash
npm install mathml-tag-names
```

**mathml-tag-names** is also available as an AMD, CommonJS, and globals
module, [uncompressed and compressed][releases].

## Usage

```javascript
var mathMLTagNames = require('mathml-tag-names');

mathMLTagNames.length; //=> 205

console.log(mathMLTagNames.slice(0, 20));
```

Yields:

```js
[ 'abs',
  'and',
  'annotation',
  'annotation-xml',
  'apply',
  'approx',
  'arccos',
  'arccosh',
  'arccot',
  'arccoth',
  'arccsc',
  'arccsch',
  'arcsec',
  'arcsech',
  'arcsin',
  'arcsinh',
  'arctan',
  'arctanh',
  'arg',
  'bind' ]
```

## API

### `mathMLTagNames`

`Array.<string>` — List of lower-case tag-names.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://img.shields.io/travis/wooorm/mathml-tag-names.svg

[build-page]: https://travis-ci.org/wooorm/mathml-tag-names

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/mathml-tag-names.svg

[coverage-page]: https://codecov.io/github/wooorm/mathml-tag-names?branch=master

[npm]: https://docs.npmjs.com/cli/install

[releases]: https://github.com/wooorm/mathml-tag-names/releases

[license]: LICENSE

[author]: http://wooorm.com

[mathml1]: https://www.w3.org/TR/1998/REC-MathML-19980407/appendixF.html

[mathml2]: https://www.w3.org/TR/MathML2/appendixl.html

[mathml3]: https://www.w3.org/TR/MathML3/appendixi.html
