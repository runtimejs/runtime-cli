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
var childProcess = require('child_process');

function exec(cmd, args, cb) {
  cb = cb || function() {};
  var p = global.SPAWNED_PROCESS = childProcess.spawn(cmd, args, {
    stdio: 'inherit',
    customFds: [process.stdin, process.stdout, process.stderr]
  });

  process.stdin.setRawMode(true);
  p.on('exit', function(code) {
    process.stdin.setRawMode(false);
    global.SPAWNED_PROCESS = null;
    if ('function' === typeof cb) {
      return cb(code);
    }
  });
}

module.exports = exec;
