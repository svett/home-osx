'use strict';
'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _ = require('..');

var _2 = _interopRequireDefault(_);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('nuclide-uri', function () {
  var localUri = '/usr/local/file';
  var badRemoteUriNoPath = 'nuclide://fb.com';
  var remoteUri = _2.default.createRemoteUri('fb.com', '/usr/local');
  var remoteUriWithSpaces = _2.default.createRemoteUri('fb.com', '/a b/c d');
  var remoteUriWithHashes = _2.default.createRemoteUri('fb.co.uk', '/ab/#c.d  #');

  it('isRemote', function () {
    expect(_2.default.isRemote('/')).toBe(false);
    expect(_2.default.isRemote(remoteUri)).toBe(true);
  });

  it('isLocal', function () {
    expect(_2.default.isLocal('/')).toBe(true);
    expect(_2.default.isLocal(remoteUri)).toBe(false);
  });

  it('createRemoteUri', function () {
    expect(remoteUri).toBe('nuclide://fb.com/usr/local');
    expect(remoteUriWithSpaces).toBe('nuclide://fb.com/a b/c d');
  });

  it('join', function () {
    expect(_2.default.join.bind(null, badRemoteUriNoPath, '../foo')).toThrow();
    expect(_2.default.join('/usr/local', 'bin')).toBe('/usr/local/bin');
    expect(_2.default.join(remoteUri, 'bin')).toBe('nuclide://fb.com/usr/local/bin');
    expect(_2.default.join('/usr/local', '..')).toBe('/usr');
    expect(_2.default.join(remoteUri, '..')).toBe('nuclide://fb.com/usr');
  });

  describe('parsing remote', function () {
    it('handles simple paths', function () {
      expect(_2.default.getHostname(remoteUri)).toBe('fb.com');
      expect(_2.default.getPath(remoteUri)).toBe('/usr/local');
    });

    it('does not encode space characters', function () {
      expect(_2.default.getHostname(remoteUriWithSpaces)).toBe('fb.com');
      expect(_2.default.getPath(remoteUriWithSpaces)).toBe('/a b/c d');
    });

    it('treats hash symbols as literals, part of the path', function () {
      var parsedUri = _2.default.parse(remoteUriWithHashes);
      expect(parsedUri.hostname).toBe('fb.co.uk');
      expect(parsedUri.pathname).toBe('/ab/#c.d  #');
    });
  });

  it('parsing local', function () {
    expect(function () {
      return _2.default.getHostname(localUri);
    }).toThrow();
    expect(_2.default.getPath(localUri)).toBe(localUri);
    expect(function () {
      return _2.default.parseRemoteUri(localUri);
    }).toThrow();
  });

  it('basename', function () {
    expect(_2.default.basename('/')).toBe('');
    expect(_2.default.basename('/abc')).toBe('abc');
    expect(_2.default.basename('/abc/')).toBe('abc');
    expect(_2.default.basename('/abc/def')).toBe('def');
    expect(_2.default.basename('/abc/def/')).toBe('def');

    expect(_2.default.basename('nuclide://host/')).toBe('');
    expect(_2.default.basename('nuclide://host/abc')).toBe('abc');
    expect(_2.default.basename('nuclide://host/abc/')).toBe('abc');
    expect(_2.default.basename('nuclide://host/abc/def')).toBe('def');
    expect(_2.default.basename('nuclide://host/abc/def/')).toBe('def');
    expect(_2.default.basename('nuclide://host/a c/d f')).toBe('d f');

    expect(_2.default.basename('C:\\')).toBe('');
    expect(_2.default.basename('C:\\abc')).toBe('abc');
    expect(_2.default.basename('C:\\abc\\')).toBe('abc');
    expect(_2.default.basename('C:\\abc\\def')).toBe('def');
    expect(_2.default.basename('C:\\abc\\def\\')).toBe('def');
    expect(_2.default.basename('\\abc\\def')).toBe('def');
    expect(_2.default.basename('\\abc\\def\\')).toBe('def');
  });

  it('dirname', function () {
    expect(_2.default.dirname('/')).toBe('/');
    expect(_2.default.dirname('/abc')).toBe('/');
    expect(_2.default.dirname('/abc/')).toBe('/');
    expect(_2.default.dirname('/abc/def')).toBe('/abc');
    expect(_2.default.dirname('/abc/def/')).toBe('/abc');

    expect(_2.default.dirname('nuclide://host/')).toBe('nuclide://host/');
    expect(_2.default.dirname('nuclide://host/abc')).toBe('nuclide://host/');
    expect(_2.default.dirname('nuclide://host/abc/')).toBe('nuclide://host/');
    expect(_2.default.dirname('nuclide://host/abc/def')).toBe('nuclide://host/abc');
    expect(_2.default.dirname('nuclide://host/abc/def/')).toBe('nuclide://host/abc');
    expect(_2.default.dirname('nuclide://host/a c/d f')).toBe('nuclide://host/a c');

    expect(_2.default.dirname('C:\\')).toBe('C:\\');
    expect(_2.default.dirname('C:\\abc')).toBe('C:\\');
    expect(_2.default.dirname('C:\\abc\\')).toBe('C:\\');
    expect(_2.default.dirname('C:\\abc\\def')).toBe('C:\\abc');
    expect(_2.default.dirname('C:\\abc\\def\\')).toBe('C:\\abc');
    expect(_2.default.dirname('\\abc\\def')).toBe('\\abc');
    expect(_2.default.dirname('\\abc\\def\\')).toBe('\\abc');
  });

  it('extname', function () {
    expect(_2.default.extname('/abc')).toBe('');
    expect(_2.default.extname('/abc.')).toBe('.');
    expect(_2.default.extname('/abc.txt')).toBe('.txt');
    expect(_2.default.extname('/abc/def.html')).toBe('.html');
    expect(_2.default.extname('/abc/def/')).toBe('');
    expect(_2.default.extname('/abc/def.dir/')).toBe('.dir');

    expect(_2.default.extname('nuclide://host/')).toBe('');
    expect(_2.default.extname('nuclide://host/abc')).toBe('');
    expect(_2.default.extname('nuclide://host/abc.txt')).toBe('.txt');
    expect(_2.default.extname('nuclide://host/abc.')).toBe('.');
    expect(_2.default.extname('nuclide://host/abc/')).toBe('');
    expect(_2.default.extname('nuclide://host/abc/def')).toBe('');
    expect(_2.default.extname('nuclide://host/abc/def.js')).toBe('.js');

    expect(_2.default.extname('C:\\')).toBe('');
    expect(_2.default.extname('C:\\abc')).toBe('');
    expect(_2.default.extname('C:\\abc\\')).toBe('');
    expect(_2.default.extname('C:\\abc.')).toBe('.');
    expect(_2.default.extname('C:\\abc.js')).toBe('.js');
    expect(_2.default.extname('C:\\abc\\def')).toBe('');
    expect(_2.default.extname('C:\\abc\\def\\')).toBe('');
    expect(_2.default.extname('C:\\abc\\def.')).toBe('.');
    expect(_2.default.extname('C:\\abc\\def.html')).toBe('.html');
    expect(_2.default.extname('\\abc\\def')).toBe('');
    expect(_2.default.extname('\\abc\\def.dir\\')).toBe('.dir');
    expect(_2.default.extname('\\abc\\def.')).toBe('.');
    expect(_2.default.extname('\\abc\\def.xml')).toBe('.xml');
  });

  it('getParent', function () {
    expect(_2.default.getParent(localUri)).toBe('/usr/local');
    expect(_2.default.getParent(remoteUri)).toBe('nuclide://fb.com/usr');
  });

  it('contains', function () {
    expect(_2.default.contains('/usr/local', localUri)).toBe(true);
    expect(_2.default.contains('nuclide://fb.com/usr', remoteUri)).toBe(true);
    expect(_2.default.contains('/foo/bar/', '/foo/bar/abc.txt')).toBe(true);
    expect(_2.default.contains('/foo/bar', '/foo/bar/')).toBe(true);
    expect(_2.default.contains('/foo/bar/', '/foo/bar/')).toBe(true);
    expect(_2.default.contains('/foo/bar/', '/foo/bar')).toBe(true);
  });

  it('collapse', function () {
    expect(_2.default.collapse(['/a', '/b'])).toEqual(['/a', '/b']);
    expect(_2.default.collapse(['/a/b/c/d', '/a', '/a/b'])).toEqual(['/a']);
    expect(_2.default.collapse(['/a/c', '/a/c/d', '/a/b', '/a/b/c/d/e'])).toEqual(['/a/c', '/a/b']);
    expect(_2.default.collapse(['/a/be', '/a/b'])).toEqual(['/a/be', '/a/b']);
    expect(_2.default.collapse(['nuclide://fb.com/usr/local', 'nuclide://fb.com/usr/local/test', 'nuclide://facebook.com/usr/local/test'])).toEqual(['nuclide://fb.com/usr/local', 'nuclide://facebook.com/usr/local/test']);
  });

  it('normalize', function () {
    expect(_2.default.normalize(localUri)).toBe(localUri);
    expect(_2.default.normalize(remoteUri)).toBe(remoteUri);
    expect(_2.default.normalize.bind(null, badRemoteUriNoPath)).toThrow();
    expect(_2.default.normalize('/usr/local/..')).toBe('/usr');
    expect(_2.default.normalize('nuclide://fb.com/usr/local/..')).toBe('nuclide://fb.com/usr');
    expect(_2.default.normalize('/a b/c d/..')).toBe('/a b');
  });

  it('relative', function () {
    expect(function () {
      return _2.default.relative(localUri, remoteUri);
    }).toThrow();
    expect(_2.default.relative(_2.default.dirname(remoteUri), remoteUri)).toBe('local');
    expect(_2.default.relative(remoteUri, _2.default.dirname(remoteUri))).toBe('..');
    expect(_2.default.relative(_2.default.dirname(remoteUriWithSpaces), remoteUriWithSpaces)).toBe('c d');
    expect(_2.default.relative(remoteUriWithSpaces, _2.default.dirname(remoteUriWithSpaces))).toBe('..');
    expect(_2.default.relative(_2.default.dirname(localUri), localUri)).toBe('file');
    expect(_2.default.relative(localUri, _2.default.dirname(localUri))).toBe('..');
  });

  it('nuclideUriToDisplayString', function () {
    expect(_2.default.nuclideUriToDisplayString(localUri)).toBe(localUri);
    expect(_2.default.nuclideUriToDisplayString(remoteUri)).toBe('fb.com//usr/local');
  });

  describe('isRoot', function () {
    it('plain posix root', function () {
      return expect(_2.default.isRoot('/')).toBe(true);
    });
    it('double root', function () {
      return expect(_2.default.isRoot('//')).toBe(false);
    });
    it('/abc', function () {
      return expect(_2.default.isRoot('/abc')).toBe(false);
    });
    it('abc', function () {
      return expect(_2.default.isRoot('abc')).toBe(false);
    });
    it('abc/def', function () {
      return expect(_2.default.isRoot('abc/def')).toBe(false);
    });
    it('remote root', function () {
      return expect(_2.default.isRoot('nuclide://host/')).toBe(true);
    });
    it('remote root with port', function () {
      return expect(_2.default.isRoot('nuclide://host/')).toBe(true);
    });
    it('remote non-root', function () {
      return expect(_2.default.isRoot('nuclide://host/abc')).toBe(false);
    });
    it('remote non-root no port', function () {
      expect(_2.default.isRoot('nuclide://host/abc')).toBe(false);
    });
    it('win diskless root', function () {
      return expect(_2.default.isRoot('\\')).toBe(true);
    });
    it('win diskless double root', function () {
      return expect(_2.default.isRoot('\\\\')).toBe(false);
    });
    it('win diskless non-root', function () {
      return expect(_2.default.isRoot('\\abc')).toBe(false);
    });
    it('win diskful root', function () {
      return expect(_2.default.isRoot('C:\\')).toBe(true);
    });
    it('win diskful double root', function () {
      return expect(_2.default.isRoot('C:\\\\')).toBe(false);
    });
    it('win diskful non-root', function () {
      return expect(_2.default.isRoot('C:\\abc')).toBe(false);
    });

    it('win relative', function () {
      return expect(_2.default.isRoot('abc\\def')).toBe(false);
    });
  });

  it('adds a proper suffix when needed', function () {
    expect(_2.default.ensureTrailingSeparator('/')).toBe('/');
    expect(_2.default.ensureTrailingSeparator('/abc')).toBe('/abc/');
    expect(_2.default.ensureTrailingSeparator('/abc/')).toBe('/abc/');
    expect(_2.default.ensureTrailingSeparator('/abc/def')).toBe('/abc/def/');
    expect(_2.default.ensureTrailingSeparator('/abc/def/')).toBe('/abc/def/');
    expect(_2.default.ensureTrailingSeparator('nuclide://host')).toBe('nuclide://host/');
    expect(_2.default.ensureTrailingSeparator('nuclide://host/')).toBe('nuclide://host/');
    expect(_2.default.ensureTrailingSeparator('nuclide://host/abc')).toBe('nuclide://host/abc/');
    expect(_2.default.ensureTrailingSeparator('nuclide://host/abc/def')).toBe('nuclide://host/abc/def/');
    expect(_2.default.ensureTrailingSeparator('nuclide://host/abc/def/')).toBe('nuclide://host/abc/def/');
    expect(_2.default.ensureTrailingSeparator('C:\\')).toBe('C:\\');
    expect(_2.default.ensureTrailingSeparator('C:\\abc')).toBe('C:\\abc\\');
    expect(_2.default.ensureTrailingSeparator('C:\\abc\\')).toBe('C:\\abc\\');
    expect(_2.default.ensureTrailingSeparator('C:\\abc\\def')).toBe('C:\\abc\\def\\');
    expect(_2.default.ensureTrailingSeparator('C:\\abc\\def\\')).toBe('C:\\abc\\def\\');
    expect(_2.default.ensureTrailingSeparator('\\abc\\def')).toBe('\\abc\\def\\');
    expect(_2.default.ensureTrailingSeparator('\\abc\\def\\')).toBe('\\abc\\def\\');
  });

  it('properly removes suffix when needed', function () {
    expect(_2.default.trimTrailingSeparator('/')).toBe('/');
    expect(_2.default.trimTrailingSeparator('//')).toBe('/');
    expect(_2.default.trimTrailingSeparator('/abc')).toBe('/abc');
    expect(_2.default.trimTrailingSeparator('/abc/')).toBe('/abc');
    expect(_2.default.trimTrailingSeparator('/abc/def')).toBe('/abc/def');
    expect(_2.default.trimTrailingSeparator('/abc/def/')).toBe('/abc/def');
    expect(_2.default.trimTrailingSeparator('nuclide://host/')).toBe('nuclide://host/');
    expect(_2.default.trimTrailingSeparator('nuclide://host//')).toBe('nuclide://host/');
    expect(_2.default.trimTrailingSeparator('nuclide://host/')).toBe('nuclide://host/');
    expect(_2.default.trimTrailingSeparator('nuclide://host//')).toBe('nuclide://host/');
    expect(_2.default.trimTrailingSeparator('nuclide://host/abc')).toBe('nuclide://host/abc');
    expect(_2.default.trimTrailingSeparator('nuclide://host/abc/')).toBe('nuclide://host/abc');
    expect(_2.default.trimTrailingSeparator('nuclide://host/abc/def')).toBe('nuclide://host/abc/def');
    expect(_2.default.trimTrailingSeparator('nuclide://host/abc/def/')).toBe('nuclide://host/abc/def');
    expect(_2.default.trimTrailingSeparator('C:\\')).toBe('C:\\');
    expect(_2.default.trimTrailingSeparator('C:\\\\')).toBe('C:\\');
    expect(_2.default.trimTrailingSeparator('C:\\abc')).toBe('C:\\abc');
    expect(_2.default.trimTrailingSeparator('C:\\abc\\')).toBe('C:\\abc');
    expect(_2.default.trimTrailingSeparator('C:\\abc\\def')).toBe('C:\\abc\\def');
    expect(_2.default.trimTrailingSeparator('C:\\abc\\def\\')).toBe('C:\\abc\\def');
    expect(_2.default.trimTrailingSeparator('\\')).toBe('\\');
    expect(_2.default.trimTrailingSeparator('\\\\')).toBe('\\');
    expect(_2.default.trimTrailingSeparator('\\abc\\def')).toBe('\\abc\\def');
    expect(_2.default.trimTrailingSeparator('\\abc\\def\\')).toBe('\\abc\\def');
  });

  it('isAbsolute', function () {
    expect(_2.default.isAbsolute('/abc')).toBe(true);
    expect(_2.default.isAbsolute('/abc/def')).toBe(true);
    expect(_2.default.isAbsolute('nuclide://host/')).toBe(true);
    expect(_2.default.isAbsolute('nuclide://host/abc')).toBe(true);
    expect(_2.default.isAbsolute('nuclide://host/abc/def')).toBe(true);

    expect(_2.default.isAbsolute('C:\\abc')).toBe(true);
    expect(_2.default.isAbsolute('C:\\abc\\def')).toBe(true);
    expect(_2.default.isAbsolute('\\abc')).toBe(true);
    expect(_2.default.isAbsolute('\\abc\\def')).toBe(true);

    expect(_2.default.isAbsolute('abc')).toBe(false);
    expect(_2.default.isAbsolute('abc/def')).toBe(false);

    expect(_2.default.isAbsolute('abc\\def')).toBe(false);
  });

  it('resolve', function () {
    expect(_2.default.resolve('/abc')).toBe('/abc');
    expect(_2.default.resolve('/abc', '..')).toBe('/');
    expect(_2.default.resolve('/abc', '..', '..')).toBe('/');
    expect(_2.default.resolve('/abc', '../..')).toBe('/');

    expect(_2.default.resolve('/abc/def')).toBe('/abc/def');
    expect(_2.default.resolve('/abc/def', 'ghi')).toBe('/abc/def/ghi');
    expect(_2.default.resolve('/abc/def', '..', 'ghi')).toBe('/abc/ghi');
    expect(_2.default.resolve('/abc/def', '../ghi')).toBe('/abc/ghi');
    expect(_2.default.resolve('/abc/def', '/ghi')).toBe('/ghi');

    expect(_2.default.resolve('nuclide://host/')).toBe('nuclide://host/');
    expect(_2.default.resolve('nuclide://host/', '..')).toBe('nuclide://host/');
    expect(_2.default.resolve('nuclide://host/abc')).toBe('nuclide://host/abc');
    expect(_2.default.resolve('nuclide://host/abc', '..')).toBe('nuclide://host/');
    expect(_2.default.resolve('nuclide://host/abc', '..', '..')).toBe('nuclide://host/');
    expect(_2.default.resolve('nuclide://host/abc', '../..')).toBe('nuclide://host/');
    expect(_2.default.resolve('nuclide://host/abc/def', 'ghi')).toBe('nuclide://host/abc/def/ghi');
    expect(_2.default.resolve('nuclide://host/abc/def', '../ghi')).toBe('nuclide://host/abc/ghi');
    expect(_2.default.resolve('nuclide://host/abc/def', '..', 'ghi')).toBe('nuclide://host/abc/ghi');
    expect(_2.default.resolve('nuclide://host/abc/def', '/ghi')).toBe('nuclide://host/ghi');

    expect(_2.default.resolve('C:\\abc')).toBe('C:\\abc');
    expect(_2.default.resolve('C:\\abc', '..')).toBe('C:\\');
    expect(_2.default.resolve('C:\\abc', '..', '..')).toBe('C:\\');
    expect(_2.default.resolve('C:\\abc', '..\\..')).toBe('C:\\');
    expect(_2.default.resolve('C:\\abc', 'def')).toBe('C:\\abc\\def');
    expect(_2.default.resolve('C:\\abc', '..\\def')).toBe('C:\\def');
    expect(_2.default.resolve('C:\\abc', '..', 'def')).toBe('C:\\def');

    expect(_2.default.resolve('\\abc', 'def')).toBe('\\abc\\def');
    expect(_2.default.resolve('\\abc', '..\\def')).toBe('\\def');
    expect(_2.default.resolve('\\abc', '..', 'def')).toBe('\\def');
  });

  describe('expandHomeDir()', function () {
    it('expands ~ to HOME', function () {
      expect(_2.default.expandHomeDir('~')).toBe(process.env.HOME);
    });

    it('expands ~/ to HOME', function () {
      var HOME = process.env.HOME;
      expect(HOME).not.toBeNull();
      expect(_2.default.expandHomeDir('~/abc')).toBe(_path2.default.posix.join(HOME, 'abc'));
    });

    it('keeps ~def to ~def', function () {
      expect(_2.default.expandHomeDir('~def')).toBe('~def');
    });
  });

  it('detects Windows and Posix paths properly', function () {
    var win32Path = _path2.default.win32;
    var posixPath = _path2.default.posix;

    expect(_2.default._pathModuleFor('/')).toBe(posixPath);
    expect(_2.default._pathModuleFor('/abc')).toBe(posixPath);
    expect(_2.default._pathModuleFor('/abc/def')).toBe(posixPath);
    expect(_2.default._pathModuleFor('/abc.txt')).toBe(posixPath);
    expect(_2.default._pathModuleFor('nuclide://host')).toBe(posixPath);
    expect(_2.default._pathModuleFor('nuclide://host/')).toBe(posixPath);
    expect(_2.default._pathModuleFor('nuclide://host/abc')).toBe(posixPath);
    expect(_2.default._pathModuleFor('nuclide://host/abc/def')).toBe(posixPath);
    expect(_2.default._pathModuleFor('nuclide://host/abc/def.txt')).toBe(posixPath);
    expect(_2.default._pathModuleFor('C:\\')).toBe(win32Path);
    expect(_2.default._pathModuleFor('C:\\abc')).toBe(win32Path);
    expect(_2.default._pathModuleFor('C:\\abc\\def')).toBe(win32Path);
    expect(_2.default._pathModuleFor('C:\\abc\\def.txt')).toBe(win32Path);
    expect(_2.default._pathModuleFor('D:\\abc\\aaa bbb')).toBe(win32Path);
    expect(_2.default._pathModuleFor('\\abc\\def')).toBe(win32Path);

    //Default to Posix
    expect(_2.default._pathModuleFor('abcdef')).toBe(posixPath);
  });

  it('properly handles backslash-containing remote URIs', function () {
    expect(_2.default.getPath('nuclide://host/aaa\\bbb.txt')).toBe('/aaa\\bbb.txt');
    expect(_2.default.getPath('nuclide://host/dir/aaa\\bbb.txt')).toBe('/dir/aaa\\bbb.txt');
    expect(_2.default.getPath('nuclide://host/one\\two\\file.txt')).toBe('/one\\two\\file.txt');
  });
});
// eslint-disable-next-line nuclide-internal/prefer-nuclide-uri
//# sourceMappingURL=remote-uri-spec.js.map