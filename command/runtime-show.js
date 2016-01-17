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
var rawExec = require('../run/raw-exec');
var shellExec = require('../run/shell-exec');
var logs = require('../run/logs');

function printNetdump(cb) {
  shellExec('tcpdump -ns 0 -X -vvv -r ' + logs.netdumpPath + ' > ' + logs.netdumpLogPath, function(code, output) {
    if (0 !== code) {
      return cb('tcpdump command failed');
    }

    return rawExec('less', [logs.netdumpLogPath], cb);
  });
}

function printLog(cb) {
  rawExec('less', [logs.logPath], function(code, output) {
    if (0 !== code) {
      return cb('log print command failed');
    }

    cb(null);
  });
}

module.exports = function(args, cb) {
  var type = 'log';
  if (args._.length > 0) {
    type = args._[0];
  }

  if (type === 'netdump') {
    return printNetdump(cb);
  }

  if (type === 'log') {
    return printLog(cb);
  }

  cb('unknown VM output type "' + type + '"');
};
