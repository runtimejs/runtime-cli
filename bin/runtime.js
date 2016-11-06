#!/usr/bin/env node
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
var parseArgs = require('minimist');
var pad = require('pad');
var chalk = require('chalk');
var tabtab = require('tabtab');
var version = require('../package.json').version;

var packArgs = [
  { name: 'list-files', type: 'boolean', default: false,
    description: 'List packaged files only' },
  { name: 'ignore', type: 'string', default: '',
    description: 'Add file ignore pattern' },
  { name: 'entry', type: 'string', default: '/',
    description: 'Set entry point import/require string (defaults to "/")' },
  { name: 'add-dir', type: 'string', default: '',
    description: 'Add a directory into the package (format: <path> or <path>:<package-path>)' },
  { name: 'output', type: 'string', default: '',
    description: 'Initrd output file (defaults to .initrd)\nformat: --output <initrd name> or --output <directory/initrd name>'}
];

var runArgs = [
  { name: 'net', type: 'string', default: 'user',
    description: 'Enable network (value can be "none", "user", "tap" or\n"bridge", defaults to "user")' },
  { name: 'netdump', type: 'boolean', default: false,
    description: 'Save network activity to a file' },
  { name: 'kvm', type: 'boolean', default: false,
    description: 'Enable Linux KVM (much faster virtualization)' },
  { name: 'curses', type: 'boolean', default: false,
    description: 'Use text-mode graphics' },
  { name: 'port', type: 'number', default: 0,
    description: 'Redirect TCP/UDP connections on the host port to the runtime.js' },
  { name: 'append', type: 'string', default: '',
    description: 'Append string to runtime.js command line' },
  { name: 'dry-run', type: 'boolean', default: false,
    description: 'Test input but do not launch the VM' },
  { name: 'verbose', type: 'boolean', default: false,
    description: 'Output extra info like VM command line' },
  { name: 'virtio-rng', type: 'boolean', default: false,
    description: 'Enable VIRTIO-RNG entropy source for the runtime.js' },
  { name: 'nographic', type: 'boolean', default: false,
    description: 'Disable graphics, run in command line mode' },
  { name: 'kernel', type: 'string', default: '',
    description: 'Specify custom kernel binary file to use' },
  { name: 'append-qemu', type: 'string', default: '',
    description: 'Append qemu command line arguments' },
  { name: 'local', type: 'boolean', default: false,
    description: 'Download the kernel locally (i.e. in the module\'s directory)' },
  { name: 'drive', type: 'string', default: '',
    description: 'A file to attach as a virtio block device' }
];

var mkimgArgs = [
  { name: 'size', type: 'string', default: '1G',
    description: 'Size of the new image, defaults to 1 gigabyte. See `qemu-img --help` for sizes.\nMust be >= 33792 kb (33 mb)' },
  { name: 'label', type: 'string', default: 'RUNTIMEJS',
    description: 'Label of the new image, defaults to "RUNTIMEJS"' }
];

var cmds = [{
  name: 'start',
  description: 'Quickly start runtime.js VM using current directory',
  args: runArgs.concat(packArgs)
}, {
  name: 'watch',
  description: 'Watch current directory and automatically restart runtime.js VM',
  args: runArgs.concat(packArgs)
}, {
  name: 'pack',
  description: 'Package specified directory into ramdisk bundle',
  args: packArgs,
  mainArg: { name: 'directory', description: 'Directory to package' }
}, {
  name: 'run',
  description: 'Run runtime.js VM using specified ramdisk bundle',
  args: runArgs,
  mainArg: { name: 'ramdisk', description: 'Ramdisk/initrd bundle file to use' }
}, {
  name: 'show',
  description: 'Print VM output or log',
  mainArg: { name: 'type', description: 'VM output file to print, can be "log" or "netdump",\ndefaults to "log"' }
}, {
  name: 'mkimg',
  description: 'Easily create a disk image for use with runtime.js',
  args: mkimgArgs,
  mainArg: { name: 'filename', description: 'The filename for the newly created disk image including the extension,\ndefaults to "disk.img"' }
}, {
  name: 'help',
  description: 'Print this usage help'
}];

function help() {
  console.log('USAGE: runtime <command> [<args>]');
  console.log('');
  console.log('Commands:');

  for (var i = 0; i < cmds.length; ++i) {
    var cmd = cmds[i];
    console.log('  ' + pad(cmd.name, 14) + padDescription(cmd.description));
  }
}

function padDescription(t) {
  return String(t).split('\n').join(pad('\n', 17));
}

function commandHelp(command) {
  console.log('USAGE: runtime ' + command.name +
      (command.args ? ' [<args>]' : '') +
      (command.mainArg ? (' <' + command.mainArg.name + '>') : ''));

  console.log('(' + command.description + ')');

  if (command.mainArg) {
    console.log('');
    console.log('  ' + pad('<' + command.mainArg.name + '>', 14) +
        padDescription(command.mainArg.description));
  }

  if (command.args) {
    console.log('');
    console.log('Arguments:');

    for (var i = 0; i < command.args.length; ++i) {
      var arg = command.args[i];
      console.log('  --' + pad(arg.name, 12) + padDescription(arg.description));
    }
  }
}

var args = process.argv.slice(2);

if (args.length === 0) {
  help();
  return;
}

var command = args[0];

if (command === 'help' || command === '--help') {
  help();
  return;
}

if (command === '--version') {
  console.log(version);
  return;
}

if (command === 'completion') {
  tabtab.complete('runtime', function(err, data) {
    if (err || !data) {
      return;
    }

    var line = String(data.line || '');
    var parts = line.split(' ');
    if (parts.length > 2) {
      var commandName = parts[1];
      for (var i = 0; i < cmds.length; ++i) {
        var cmd = cmds[i];
        if (cmd.name === commandName && cmd.args && /^--\w?/.test(data.last)) {
          tabtab.log(cmd.args.map(function(a) { return a.name; }), data, '--');
          return;
        }
      }
    } else {
      tabtab.log(cmds.map(function(c) { return c.name; }), data);
    }
  });
  return;
}

var commandHandled = false;

for (var i = 0; i < cmds.length; ++i) {
  var cmd = cmds[i];
  if (cmd.name === command) {
    commandHandled = true;

    var argsOpts = {
      string: [],
      boolean: ['help'],
      default: {}
    };

    if (cmd.args) {
      cmd.args.forEach(function(arg) {
        if (arg.type === 'boolean') {
          argsOpts.boolean.push(arg.name);
        }

        if (arg.type === 'string') {
          argsOpts.string.push(arg.name);
        }

        argsOpts.default[arg.name] = arg.default;
      });
    }

    var argv = parseArgs(args.slice(1), argsOpts);
    if (argv.help) {
      commandHelp(cmd);
      return;
    }

    var commandFunction = require('../command/runtime-' + cmd.name);
    commandFunction(argv, function(err) {
      if (err) {
        if (typeof err === 'string') {
          console.log(chalk.red('error: ' + err));
        } else {
          throw err;
        }

        process.exit(1);
      }
    });

    break;
  }
}

if (commandHandled) {
  return;
}

help();
