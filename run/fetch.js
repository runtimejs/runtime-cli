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
var request = require('request');
var gunzip = require('gunzip-maybe');
var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var progressStream = require('progress-stream');
var log = require('single-line-log').stdout;
var prettyBytes = require('pretty-bytes');

module.exports = function(kernelVersion, shouldBeLocal, cb) {
  var basePath = shouldBeLocal ? __dirname : process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
  var kernelsDir = path.resolve(basePath, '.runtime');
  if (!shell.test('-d', kernelsDir)) {
    shell.mkdir(kernelsDir);
  }

  var tmpName = 'runtime.' + kernelVersion + '.download';
  var tmpFile = path.resolve(kernelsDir, tmpName);
  var resultFile = path.resolve(kernelsDir, 'runtime.' + kernelVersion);

  if (shell.test('-f', resultFile)) {
    return cb(null, resultFile);
  }

  if (shell.test('-f', tmpFile)) {
    shell.rm('-f', tmpFile);
  }

  var displayName = 'runtime.gz.' + kernelVersion;
  var url = 'https://github.com/runtimejs/builds/raw/master/runtime.gz.' + kernelVersion;

  // Newer versions are stored as GitHub releases
  if (kernelVersion > 3) {
    var tag = ((kernelVersion >>> 20) & 0x3ff) + '.' + ((kernelVersion >>> 10) & 0x3ff) + '.' + (kernelVersion & 0x3ff);
    displayName = 'release v' + tag;
    url = 'https://github.com/runtimejs/runtime/releases/download/v' + tag + '/runtime.gz';
  }

  var req = request(url);

  req.on('response', function(res) {
    if (res.statusCode !== 200) {
      return cb('runtime binary "' + url + '" download error (http ' + res.statusCode + ')');
    }

    var totalLength = Number(res.headers['content-length']);

    var stream = res;

    if (totalLength) {
      var progress = progressStream({
        length: totalLength
      });

      progress.on('progress', function(p) {
        var value = p.percentage | 0;

        if (value <= 0) {
          return;
        }

        if (value === 100) {
          log('');
          return;
        }

        var left = (value / 2) | 0;
        var right = 50 - left;

        var progressBar = '[' + Array(left + 1).join('=') + '>' + Array(right).join(' ') + ']';
        log('Downloading ' + displayName + '...\n' + progressBar + ' ' + value + '% of ' + prettyBytes(totalLength) + '');
      });

      stream = stream.pipe(progress);
    }

    log('Downloading ' + displayName + '...');

    function complete(err) {
      if (err) {
        return cb(err);
      }

      shell.mv('-f', tmpFile, resultFile);
      cb(null, resultFile);
    }

    var out = fs.createWriteStream(tmpFile, { flags: 'w', defaultEncoding: 'binary' });
    out.on('error', complete);
    out.on('finish', complete);

    stream.pipe(gunzip()).pipe(out);
  });
};
