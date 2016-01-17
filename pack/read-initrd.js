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

module.exports = function(filename) {
  var buf = new Buffer(16);

  try {
    var fd = fs.openSync(filename, 'r');
    var bytesRead = fs.readSync(fd, buf, 0, 16, 0);
    if (bytesRead !== 16) {
      return null;
    }
  } catch (e) {
    return null;
  }

  if (buf.readUInt32BE(0) !== 0xCAFECAFE) {
    return null;
  }

  if ((buf[4] !== 'P'.charCodeAt(0)) ||
      (buf[5] !== 'C'.charCodeAt(0)) ||
      (buf[6] !== 'K'.charCodeAt(0)) ||
      (buf[7] !== 'G'.charCodeAt(0))) {
    return null;
  }

  if (buf.readUInt32BE(8) !== 0) {
    return null;
  }

  var kernelVer = buf.readUInt32BE(12);

  return {
    kernelVer: kernelVer
  };
};
