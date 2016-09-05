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

var exec = require('../run/shell-exec');
var path = require('path');
var os = require('os');
var fs = require('fs');

// Some code from generateGUID used from http://stackoverflow.com/a/2117523/6620880
// Courtesy of broofa on StackOverflow (http://stackoverflow.com/users/109538)
function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const multipliers = {
  'G': 1000,
  'T': 1000000,
  'P': 1000000000,
  'E': 1000000000000
};

function toMB(size) {
  var suffix = size.substr(size.length - 1);
  return parseInt(size, 10) * multipliers[suffix];
}

module.exports = function(opts, cb) {
  var guid = generateGUID();
  var vhdName = os.tmpdir() + path.sep + 'runtime-tmp-vhd-' + guid + '.vhd';
  var tmpScriptName = os.tmpdir() + path.sep + 'runtime-diskpart-' + guid + '.txt';
  fs.writeFile(tmpScriptName, [
    'create vdisk file="' + vhdName + '" maximum=' + toMB(opts.size),
    'attach vdisk',
    'create partition primary',
    'format fs=fat32 label="' + opts.label + '" quick',
    'detach vdisk'
  ].join('\n'), function(err) {
    if (err) return cb('could not write the disk formatting script');
    exec('diskpart /s ' + tmpScriptName, function(code, output) {
      fs.unlink(opts.filename, function(err) {
        if (err) return cb('could not unlink the old disk image');
        exec('qemu-img convert -f vpc -O raw ' + vhdName + ' ' + opts.filename, function(code, output) {
          fs.unlink(vhdName, function(err) {
            if (err) return cb('could not unlink the temporary vhd image');
            // try to cleanup:
            fs.unlink(tmpScriptName, function(err) {
              // if there's an error, ignore it, it's a temporary file anyway
              cb();
            });
          });
        });
      });
    });
  });
};
