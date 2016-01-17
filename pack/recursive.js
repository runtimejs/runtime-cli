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
var pathUtils = require('path');
var ignore = require('ignore');
var dotFileRegex = /^\./;
var ignoreFilename = '.runtimeignore';

function recursiveWalk(basedir, ignoreList) {
  var visited = {};
  var depth = 0;
  var files = [];
  var ignoreRules = [];

  if (ignoreList && ignoreList.length > 0) {
    ignoreRules.push({
      base: basedir,
      filter: ignore().addPattern(ignoreList).createFilter()
    });
  }

  function walk(path, accessPath) {
    var stats = fs.lstatSync(path);
    var baseName = pathUtils.basename(path);

    if (dotFileRegex.test(baseName)) {
      return;
    }

    if (stats.isFile()) {
      if (!visited[path]) {
        visited[path] = true;
        walkFile(path, accessPath);
      }
      return;
    }

    if (stats.isDirectory()) {
      if (visited[path]) {
        throw 'file system loop detected';
      }

      visited[path] = true;
      walkDir(path, accessPath);
      return;
    }

    if (stats.isSymbolicLink()) {
      walkLink(path, accessPath);
      return;
    }
  }

  function walkFile(path, accessPath) {
    files.push(accessPath);
  }

  function walkDir(path, accessPath) {
    var entries = fs.readdirSync(path);
    if (++depth > 128) {
      return;
    }

    if (entries.indexOf(ignoreFilename) >= 0) {
      var entryPath = pathUtils.join(path, ignoreFilename);
      var rules = fs.readFileSync(entryPath, 'utf8');
      ignoreRules.push({
        base: accessPath,
        filter: ignore().addPattern(rules.split('\n')).createFilter()
      });
    } else {
      ignoreRules.push(null);
    }

    for (var i = 0; i < entries.length; ++i) {
      var entryPath = pathUtils.join(path, entries[i]);
      var entryAccessPath = pathUtils.join(accessPath, entries[i]);

      var ignored = false;
      if (ignoreRules.length > 0) {
        for (var j = 0; j < ignoreRules.length; ++j) {
          var rule = ignoreRules[j];
          if (!rule) {
            continue;
          }

          var relativePath = pathUtils.relative(rule.base, entryAccessPath);
          if (!rule.filter(relativePath)) {
            ignored = true;
            break;
          }
        }
      }

      if (ignored) {
        continue;
      }

      walk(entryPath, entryAccessPath);
    }

    ignoreRules.pop();
    --depth;
  }

  function walkLink(path, accessPath) {
    var linkPath = fs.readlinkSync(path);
    var realPath = pathUtils.resolve(pathUtils.dirname(path), linkPath);
    walk(realPath, pathUtils.join(pathUtils.dirname(accessPath), pathUtils.basename(path)));
  }

  walk(basedir, basedir);
  return files;
}

module.exports = function(basedir, ignoreList) {
  return recursiveWalk(basedir, ignoreList);
};
