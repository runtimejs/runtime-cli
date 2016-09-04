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

var mkimg = require('../mkimg');

module.exports = function(args, cb) {
  if (args._.length === 0) {
    return cb('no filename specified');
  }

  var filename = String(args._[0]);

  var size = String(args.size);
  var suffix = size.substr(size.length - 1);
  if (suffix !== 'G' && suffix !== 'T' && suffix !== 'P' && suffix !== 'E') {
    return cb('valid sizes are only >= gigabytes (G, T, etc.). see `qemu-img --help` for more sizes');
  }

  var label = String(args.label).toUpperCase(); // valid names for FAT volumes are upper case

  mkimg({
    size: size,
    filename: filename,
    label: label
  }, cb);
};
