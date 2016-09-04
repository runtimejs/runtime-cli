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
var chalk = require('chalk');
var shell = require('shelljs');
var shellExec = require('./shell-exec');
var rawExec = require('./raw-exec');
var logs = require('./logs');

var qemu = 'qemu-system-x86_64';

function testQemu(dryRun) {
  if (!shell.which(qemu)) {
    shell.echo(chalk.red('error: qemu is not installed (qemu-system-x86_64)'));
    if (!dryRun) {
      return shell.exit(1);
    }
  }
}

function getQemuArgs(opts) {
  var initrdPath = opts.initrd;
  var kernelPath = opts.kernel;

  if (!initrdPath) {
    shell.echo(chalk.red('error: initrd file required'));
    return shell.exit(1);
  }

  if (!shell.test('-f', initrdPath)) {
    shell.echo(chalk.red('error: initrd file "' + initrdPath + '" does not exist'));
    return shell.exit(1);
  }

  if (!shell.test('-f', kernelPath)) {
    shell.echo(chalk.red('error: kernel file "' + kernelPath + '" does not exist'));
    return shell.exit(1);
  }

  var a = [
    '-m 512',
    '-smp 1',
    '-s',
    '-kernel ' + kernelPath,
    '-initrd ' + initrdPath,
  ];

  if (opts.net && opts.net !== 'none') {
    a.push('-net nic,model=virtio,macaddr=1a:46:0b:ca:bc:7c');

    switch (opts.net) {
    case 'tap':
    case 'bridge':
      a.push('-net bridge');
      break;
    case 'user':
      var pushString = '-net user,net=192.168.76.0/24,dhcpstart=192.168.76.9,hostfwd=udp::9000-:9000,hostfwd=tcp::9000-:9000';
      for (var i = 0; i < opts.ports.length; i++) {
        pushString += ',hostfwd=udp::' + opts.ports[i] + '-:'+ opts.ports[i] + ',hostfwd=tcp::' + opts.ports[i] + '-:' + opts.ports[i];
      }
      a.push(pushString);
      break;
    default:
      shell.echo(chalk.red('error: unknown network type (supported tap/bridge/user)'));
      return shell.exit(1);
    }
  }

  if (opts.nographic) {
    a.push('-nographic');
    a.push('-monitor none');
  }

  if (opts.netdump) {
    a.push('-net dump,file=' + logs.netdumpPath);
  }

  if (opts.virtioRng) {
    a.push('-device virtio-rng-pci');
  }

  if (opts.kvm) {
    a.push('-enable-kvm');
    a.push('-no-kvm-irqchip');
  }

  if (opts.qemuCommandAppend) {
    a.push(String(opts.qemuCommandAppend));
  }

  if (opts.curses) {
    a.push('-curses');
    a.push('-serial file:' + logs.logPath);
  } else {
    a.push('-serial stdio');
  }

  if (opts.append) {
    a.push('-append "' + opts.append + '"');
  }

  return a;
}

module.exports = function(opts, cb) {
  testQemu(opts.dryRun);

  var qemuArgs = getQemuArgs(opts);
  var line = qemu + ' ' + qemuArgs.join(' ');

  if (opts.verbose) {
    console.log(line);
  }

  if (opts.dryRun) {
    return cb(null);
  }

  shell.echo(chalk.green(' --- starting qemu --- '));
  if (opts.curses) {
    rawExec(qemu, qemuArgs.join(' ').split(' '));
  } else {
    shellExec(line);
  }

  cb(null);
};
