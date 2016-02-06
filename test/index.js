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
var test = require('tape');
var path = require('path');
var runtimePack = require('../command/runtime-pack');
var runtimeStart = require('../command/runtime-start');

test('package ramdisk: ok', function(t) {
  runtimePack({
    _: [path.resolve(__dirname, 'project-ok')]
  }, function(err) {
    t.ok(!err);
    t.end();
  })
});

test('package ramdisk: ok, list files', function(t) {
  runtimePack({
    _: [path.resolve(__dirname, 'project-ok')],
    'list-files': true
  }, function(err) {
    t.ok(!err);
    t.end();
  })
});

test('package ramdisk: custom entry point', function(t) {
  runtimePack({
    _: [path.resolve(__dirname, 'project-ok')],
    entry: './custom'
  }, function(err) {
    t.ok(!err);
    t.end();
  })
});

test('package ramdisk: no runtime js', function(t) {
  runtimePack({
    _: [path.resolve(__dirname, 'project-no-runtimejs')]
  }, function(err) {
    t.equal(err, 'directory does not contain runtime.js library, please run "npm install runtimejs"');
    t.end();
  })
});

test('package ramdisk: multiple runtime js copies', function(t) {
  runtimePack({
    _: [path.resolve(__dirname, 'project-multiple-runtimejs')]
  }, function(err) {
    t.equal(err, 'directory contains multiple copies of the runtime.js library');
    t.end();
  })
});

test('start', function(t) {
  var cwd = process.cwd;
  process.cwd = function() {
    return path.resolve(__dirname, 'project-ok');
  };
  runtimeStart({
    _: [path.resolve(__dirname, 'project-ok')],
    verbose: true,
    'dry-run': true
  }, function(err) {
    t.ok(!err);
    process.cwd = cwd;
    t.end();
  })
});

test('runtime command', function(t) {
  require('../bin/runtime');
  t.end();
});
