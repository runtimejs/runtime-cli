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

function pathNameFormat(path) {
  // Convert Windows paths to Unix format
  if (process.platform === 'win32') {
    return path.replace(/\\/g, '/');
  }

  return path;
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
  var appIndexName = opts.entry || '/';
  var isRecursiveErrored = false;

  var files = [];

  opts.dirs.forEach(function(d) {
    if (isRecursiveErrored) {
      return;
    }

    var f = [];
    if (opts.verbose) {
      process.stdout.write('Adding directory "' + d.dir + '" (at "' + d.packagePath + '")... ');
    }

    try {
      f = recursive(d.dir, opts.ignore);
    } catch (e) {
      isRecursiveErrored = true;
      cb(e);
      return;
    }

    if (opts.verbose) {
      console.log(f.length + ' files')
    }

    files = files.concat(f.map(function(fl) {
      return {
        path: fl,
        dir: d.dir,
        packagePath: d.packagePath
      };
    }));
  });

  if (isRecursiveErrored) {
    return;
  }

  var filesError = null;
  var foundLibPath = '';

  var bundle = files.map(function(fileData) {
    var packagePath = fileData.packagePath;
    var path = fileData.path;
    var baseName = pathUtils.basename(path);
    if (dotFileRegex.test(baseName)) {
      return null;
    }

    if (baseName === 'runtimecorelib.json') {
      if (coreConfig) {
        filesError = 'found two copies of the runtime.js library at "' + foundLibPath + '" and "' + pathUtils.dirname(path) + '"';
        return null;
      }

      coreConfig = parseCoreConfig(path);
      if (!coreConfig || !coreConfig.kernelVersion) {
        filesError = 'unable to read runtime.js library config "' + path + '"';
        return null;
      }

      foundLibPath = pathUtils.dirname(path);
      if (opts.systemEntry) {
        indexPath = pathUtils.resolve(opts.systemEntry);
        indexName = opts.systemEntry;
      } else {
        indexPath = pathUtils.resolve(pathUtils.dirname(path), 'js', '__loader.js');
        indexName = packagePath + '/' + pathNameFormat(pathUtils.relative(fileData.dir, indexPath));
      }

      if (opts.verbose) {
        console.log('System entry point "' + indexName + '"');
      }
    }

    var relativePath = pathUtils.relative(fileData.dir, path);

    return {
      path: path,
      relativePath: relativePath,
      name: packagePath + '/' + pathNameFormat(relativePath)
    }
  }).filter(Boolean);

  if (filesError) {
    cb(filesError);
    return;
  }

  if (opts.listFiles) {
    bundle.forEach(function(f) {
      console.log(f.relativePath);
    });
    cb(null);
    return;
  }

  if (!coreConfig || !indexPath) {
    cb('directory does not contain runtime.js library, please run "npm install runtimejs"');
    return;
  }

  var out = fs.createWriteStream(pathUtils.resolve(output));
  out.once('finish', function() {
    cb(null, {
      bundle: bundle,
      indexName: indexName,
      appIndexName: appIndexName
    });
  });
  out.once('error', cb);
  initrdPack(out, bundle, coreConfig, indexName, appIndexName);
};
