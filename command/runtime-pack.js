// Copyright 2015-present runtime.js project authors
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
var fs = require('fs');
var path = require('path');

module.exports = function(args, cb) {
  if (args._.length === 0) {
    return cb('no directory specified');
  }

  var dir = path.resolve(args._[0]);
  if (!dir) {
    return cb('invalid directory specified');
  }

  var output = '';
  if (args.output) {
    output = args.output;
  }

  var addDirs = [];
  if (args['add-dir']) {
    addDirs = Array.isArray(args['add-dir']) ? args['add-dir'] : [args['add-dir']];
  }

  var dirs = [{
    dir: dir,
    packagePath: ''
  }].concat(addDirs.map(function(d) {
    var parts = String(d).split(':');
    if (parts.length === 1) {
      return {
        dir: path.resolve(parts[0]),
        packagePath: '/' + path.basename(parts[0])
      };
    }

    return {
      dir: path.resolve(parts[0]),
      packagePath: parts[1]
    };
  }));

  dirs.forEach(function(d) {
    try {
      fs.statSync(d.dir);
    } catch (e) {
      return cb('directory "' + d.dir + '" does not exist');
    }

    // Add leading slash
    if (d.packagePath.slice(0, 1) !== '/') {
      d.packagePath = '/' + d.packagePath;
    }

    // Remove trailing slash
    if (d.packagePath.slice(-1) === '/') {
      d.packagePath = d.packagePath.slice(0, -1);
    }
  });

  var ignore = [];
  if (args.ignore) {
    ignore = Array.isArray(args.ignore) ? args.ignore : [args.ignore];
  }

  var verbose = !!args.verbose;

  require('../pack')({
    dir: dir,
    dirs: dirs,
    listFiles: args['list-files'],
    ignore: ignore,
    verbose: verbose,
    entry: args.entry,
    systemEntry: args['system-entry'],
    output: output
  }, cb);
};
