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

  try {
    fs.statSync(dir);
  } catch (e) {
    return cb('directory "' + dir + '" does not exist');
  }

  var ignore = [];
  if (args.ignore) {
    ignore = Array.isArray(args.ignore) ? args.ignore : [args.ignore];
  }

  require('../pack')({
    dir: dir,
    listFiles: args['list-files'],
    ignore: ignore
  }, cb);
};
