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
var chokidar = require('chokidar');
var runtimeStart = require('./runtime-start');
var chalk = require('chalk');
var shell = require('shelljs');

var starting = true;

function startError(err) {
  if (!err) {
    return;
  }

  if (typeof err === 'string') {
    console.log(chalk.red('error: ' + err));
  } else {
    console.log(chalk.red('error: ' + err.stack));
  }
}

module.exports = function(args, cb) {
  runtimeStart(args, function(err) {
    starting = false;
    if (err) {
      startError(err);
    }
  });

  chokidar.watch(process.cwd(), {
    ignored: /[\/\\]\./,
    ignoreInitial:true
  }).on('all', function(event, path) {
    if (starting) {
      return;
    }

    starting = true;
    shell.echo(chalk.yellow(' --- updating --- '));

    if (global.SPAWNED_PROCESS) {
      global.SPAWNED_PROCESS.kill('SIGINT');
      global.SPAWNED_PROCESS = null;
    }

    runtimeStart(args, function(err) {
      starting = false;
      if (err) {
        startError(err);
      }
    });
  });
};
