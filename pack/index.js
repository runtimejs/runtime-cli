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
var recursive = require('./recursive');
var initrdPack = require('./initrd-pack');
var pathUtils = require('path');
var fs = require('fs');
var dotFileRegex = /^\./;

function parseCoreConfig(path) {
  var fileData = null;
  try {
    fileData = JSON.parse(fs.readFileSync(path));
  } catch (e) {}
  return fileData;
}

/**
 * Package directory into initrd bundle
 *
 * @param {string} opts.dir Directory to package
 * @param {string} opts.output Output file name
 * @param {bool} opts.listFiles List files only
 * @param {array} opts.ignore Add extra ignore patterns
 * @param {function} cb Callback
 */
module.exports = function(opts, cb) {
  var output = opts.output || '.initrd';
  var coreConfig = null;
  var indexPath = '';
  var indexName = '';

  var files = [];
  try {
    files = recursive(opts.dir, opts.ignore);
  } catch (e) {
    return cb(e);
  }

  var filesError = null;

  var bundle = files.map(function(path) {
    var baseName = pathUtils.basename(path);
    if (dotFileRegex.test(baseName)) {
      return null;
    }

    if (baseName === 'runtimecorelib.json') {
      if (coreConfig) {
        filesError = 'directory contains multiple copies of the runtime.js library';
        return null;
      }

      coreConfig = parseCoreConfig(path);
      if (!coreConfig || !coreConfig.kernelVersion) {
        filesError = 'unable to read runtime.js library config';
        return null;
      }

      indexPath = pathUtils.resolve(pathUtils.dirname(path), '__loader.js');
      indexName = '/' + pathUtils.relative(opts.dir, indexPath);
    }

    var relativePath = pathUtils.relative(opts.dir, path);

    return {
      path: path,
      relativePath: relativePath,
      name: '/' + relativePath
    }
  }).filter(Boolean);

  if (filesError) {
    return cb(filesError);
  }

  if (opts.listFiles) {
    bundle.forEach(function(f) {
      console.log(f.relativePath);
    });
    return cb(null);
  }

  if (!coreConfig || !indexPath) {
    return cb('directory does not contain runtime.js library, please run "npm install runtimejs"');
  }

  var out = fs.createWriteStream(pathUtils.resolve(output));
  out.once('finish', cb);
  out.once('error', cb);
  initrdPack(out, bundle, coreConfig, indexName, '/index.js');
};
