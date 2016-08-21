// Copyright 2016-present runtime.js project authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
var test = require('tape');
var mock = require('mock-fs');
var fs = require('fs');
var createPackage = require('../pack');
var readInitrd = require('../pack/read-initrd');

test('package directory', function(t) {
  mock({
    '/home/user/mydir': {
      'index.js': 'console.log("OK")',
      'other-file.js': '1 + 2',
      'node_modules': {
        'module1': {
          'index.js': 'module.exports = 1',
          'package.json': '{"name":"module1"}'
        },
        'runtimejs': {
          'runtimecorelib.json': '{"kernelVersion":1}'
        }
      }
    }
  });

  t.throws(function() {
    fs.statSync('/home/user/.initrd');
  }, /no such file or directory/, 'initrd does not exist');

  createPackage({
    dir: '/home/user/mydir',
    dirs: [{
      dir: '/home/user/mydir',
      packagePath: ''
    }],
    output: '/home/user/.initrd'
  }, function(err, data) {
    t.error(err, 'no error');
    t.doesNotThrow(function() {
      fs.statSync('/home/user/.initrd');
    }, 'initrd has been created');

    var initrdData = readInitrd('/home/user/.initrd');
    t.same(initrdData, { kernelVer: 1 }, 'initrd has valid format')

    t.same(data.bundle, [
      { path: '/home/user/mydir/index.js',
        relativePath: 'index.js',
        name: '/index.js' },
      { path: '/home/user/mydir/node_modules/module1/index.js',
        relativePath: 'node_modules/module1/index.js',
        name: '/node_modules/module1/index.js' },
      { path: '/home/user/mydir/node_modules/module1/package.json',
        relativePath: 'node_modules/module1/package.json',
        name: '/node_modules/module1/package.json' },
      { path: '/home/user/mydir/node_modules/runtimejs/runtimecorelib.json',
        relativePath: 'node_modules/runtimejs/runtimecorelib.json',
        name: '/node_modules/runtimejs/runtimecorelib.json' },
      { path: '/home/user/mydir/other-file.js',
        relativePath: 'other-file.js',
        name: '/other-file.js' }
    ], 'bundle files');

    t.is(data.indexName, '/node_modules/runtimejs/js/__loader.js');
    t.is(data.appIndexName, '/');

    mock.restore();
    t.end();
  });
});

test('package two directories', function(t) {
  mock({
    '/home/user/mydir': {
      'index.js': 'console.log("OK")',
      'other-file.js': '1 + 2',
      'node_modules': {
        'module1': {
          'index.js': 'module.exports = 1',
          'package.json': '{"name":"module1"}'
        },
        'runtimejs': {
          'runtimecorelib.json': '{"kernelVersion":1}'
        }
      }
    },
    '/other-dir': {
      'entry.js': 'console.log("other file")',
      'subdir': {
        'other-subdir': {
          'f.js': 'abc()'
        }
      }
    }
  });

  t.throws(function() {
    fs.statSync('/home/user/.initrd');
  }, /no such file or directory/, 'initrd does not exist');

  createPackage({
    dir: '/home/user/mydir',
    dirs: [{
      dir: '/home/user/mydir',
      packagePath: ''
    }, {
      dir: '/other-dir',
      packagePath: '/abc'
    }],
    output: '/home/user/.initrd'
  }, function(err, data) {
    t.error(err, 'no error');
    t.doesNotThrow(function() {
      fs.statSync('/home/user/.initrd');
    }, 'initrd has been created');

    var initrdData = readInitrd('/home/user/.initrd');
    t.same(initrdData, { kernelVer: 1 }, 'initrd has valid format')

    t.same(data.bundle, [
      { path: '/home/user/mydir/index.js',
        relativePath: 'index.js',
        name: '/index.js' },
      { path: '/home/user/mydir/node_modules/module1/index.js',
        relativePath: 'node_modules/module1/index.js',
        name: '/node_modules/module1/index.js' },
      { path: '/home/user/mydir/node_modules/module1/package.json',
        relativePath: 'node_modules/module1/package.json',
        name: '/node_modules/module1/package.json' },
      { path: '/home/user/mydir/node_modules/runtimejs/runtimecorelib.json',
        relativePath: 'node_modules/runtimejs/runtimecorelib.json',
        name: '/node_modules/runtimejs/runtimecorelib.json' },
      { path: '/home/user/mydir/other-file.js',
        relativePath: 'other-file.js',
        name: '/other-file.js' },
      { path: '/other-dir/entry.js',
        relativePath: 'entry.js',
        name: '/abc/entry.js' },
      { path: '/other-dir/subdir/other-subdir/f.js',
        relativePath: 'subdir/other-subdir/f.js',
        name: '/abc/subdir/other-subdir/f.js' }
    ], 'bundle files');

    t.is(data.indexName, '/node_modules/runtimejs/js/__loader.js');
    t.is(data.appIndexName, '/');

    mock.restore();
    t.end();
  });
});

test('package multiple directories', function(t) {
  mock({
    '/home/user/mydir': {
      'index.js': 'console.log("OK")',
      'other-file.js': '1 + 2',
      'node_modules': {
        'module1': {
          'index.js': 'module.exports = 1',
          'package.json': '{"name":"module1"}'
        },
        'runtimejs': {
          'runtimecorelib.json': '{"kernelVersion":1}'
        }
      }
    },
    '/other-dir': {
      'entry.js': 'console.log("other file")',
      'subdir': {
        'other-subdir': {
          'f.js': 'abc()'
        }
      }
    },
    '/other-dir2': {
      'entry.js': 'console.log("other file")',
      'subdir': {
        'other-subdir': {
          'f.js': 'abc()'
        }
      }
    },
    '/other-dir3': {
      'entry.js': 'console.log("other file")',
      'subdir': {
        'other-subdir': {
          'f.js': 'abc()'
        }
      }
    }
  });

  createPackage({
    dir: '/home/user/mydir',
    dirs: [{
      dir: '/home/user/mydir',
      packagePath: ''
    }, {
      dir: '/other-dir',
      packagePath: '/abc'
    }, {
      dir: '/other-dir2',
      packagePath: '/abc/inner'
    }, {
      dir: '/other-dir3',
      packagePath: '/def'
    }],
    output: '/home/user/.initrd'
  }, function(err, data) {
    t.error(err, 'no error');
    t.same(data.bundle, [
      { path: '/home/user/mydir/index.js',
        relativePath: 'index.js',
        name: '/index.js' },
      { path: '/home/user/mydir/node_modules/module1/index.js',
        relativePath: 'node_modules/module1/index.js',
        name: '/node_modules/module1/index.js' },
      { path: '/home/user/mydir/node_modules/module1/package.json',
        relativePath: 'node_modules/module1/package.json',
        name: '/node_modules/module1/package.json' },
      { path: '/home/user/mydir/node_modules/runtimejs/runtimecorelib.json',
        relativePath: 'node_modules/runtimejs/runtimecorelib.json',
        name: '/node_modules/runtimejs/runtimecorelib.json' },
      { path: '/home/user/mydir/other-file.js',
        relativePath: 'other-file.js',
        name: '/other-file.js' },
      { path: '/other-dir/entry.js',
        relativePath: 'entry.js',
        name: '/abc/entry.js' },
      { path: '/other-dir/subdir/other-subdir/f.js',
        relativePath: 'subdir/other-subdir/f.js',
        name: '/abc/subdir/other-subdir/f.js' },
      { path: '/other-dir2/entry.js',
        relativePath: 'entry.js',
        name: '/abc/inner/entry.js' },
      { path: '/other-dir2/subdir/other-subdir/f.js',
        relativePath: 'subdir/other-subdir/f.js',
        name: '/abc/inner/subdir/other-subdir/f.js' },
      { path: '/other-dir3/entry.js',
        relativePath: 'entry.js',
        name: '/def/entry.js' },
      { path: '/other-dir3/subdir/other-subdir/f.js',
        relativePath: 'subdir/other-subdir/f.js',
        name: '/def/subdir/other-subdir/f.js' }
    ], 'bundle files');
    mock.restore();
    t.end();
  });
});

test('package and set custom entry points', function(t) {
  mock({
    '/home/user/mydir': {
      'index.js': 'console.log("OK")',
      'other-file.js': '1 + 2',
      'node_modules': {
        'module1': {
          'index.js': 'module.exports = 1',
          'package.json': '{"name":"module1"}'
        },
        'runtimejs': {
          'runtimecorelib.json': '{"kernelVersion":1}'
        }
      }
    }
  });

  createPackage({
    dir: '/home/user/mydir',
    dirs: [{
      dir: '/home/user/mydir',
      packagePath: ''
    }],
    entry: '/z/index.js',
    systemEntry: '/abc/js.js',
    output: '/home/user/.initrd'
  }, function(err, data) {
    t.error(err, 'no error');

    t.is(data.indexName, '/abc/js.js');
    t.is(data.appIndexName, '/z/index.js');

    mock.restore();
    t.end();
  });
});

test('fs loop', function(t) {
  mock({
    '/home/user/mydir': {
      'index.js': 'console.log("OK")',
      'other-file.js': '1 + 2',
      'node_modules': {
        'module1': {
          'index.js': 'module.exports = 1',
          'package.json': '{"name":"module1"}'
        },
        'runtimejs': {
          'runtimecorelib.json': '{"kernelVersion":1}'
        },
        'other': mock.symlink({ path: './runtimejs' })
      }
    }
  });

  createPackage({
    dir: '/home/user/mydir',
    dirs: [{
      dir: '/home/user/mydir',
      packagePath: ''
    }],
    output: '/home/user/.initrd'
  }, function(err, data) {
    t.is(err, 'file system loop detected, path "/home/user/mydir/node_modules/runtimejs"');
    mock.restore();
    t.end();
  });
});

test('directory no runtime.js', function(t) {
  mock({
    '/home/user/mydir': {
      'index.js': 'console.log("OK")',
      'other-file.js': '1 + 2',
      'node_modules': {
        'module1': {
          'index.js': 'module.exports = 1',
          'package.json': '{"name":"module1"}'
        }
      }
    }
  });

  createPackage({
    dir: '/home/user/mydir',
    dirs: [{
      dir: '/home/user/mydir',
      packagePath: ''
    }],
    output: '/home/user/.initrd'
  }, function(err, data) {
    t.is(err, 'directory does not contain runtime.js library, please run "npm install runtimejs"');
    mock.restore();
    t.end();
  });
});

test('directory multiple runtime.js copies', function(t) {
  mock({
    '/home/user/mydir': {
      'index.js': 'console.log("OK")',
      'other-file.js': '1 + 2',
      'node_modules': {
        'module1': {
          'index.js': 'module.exports = 1',
          'package.json': '{"name":"module1"}'
        },
        'runtimejs': {
          'runtimecorelib.json': '{"kernelVersion":1}'
        },
        'other-runtimejs': {
          'runtimecorelib.json': '{"kernelVersion":1}'
        }
      }
    }
  });

  createPackage({
    dir: '/home/user/mydir',
    dirs: [{
      dir: '/home/user/mydir',
      packagePath: ''
    }],
    output: '/home/user/.initrd'
  }, function(err, data) {
    t.is(err, 'found two copies of the runtime.js library at "/home/user/mydir/node_modules/other-runtimejs" and "/home/user/mydir/node_modules/runtimejs"');
    mock.restore();
    t.end();
  });
});
