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
var qemu = require('../run/qemu');
var getRuntime = require('../run/get-runtime');
var readInitrd = require('../pack/read-initrd');

module.exports = function(args, cb) {
  if (args._.length === 0) {
    return cb('no ramdisk bundle specified');
  }

  // fix QEMU stdout on Windows
  process.env.SDL_STDIO_REDIRECT = 'no';

  var kernelFile = String(args.kernel || '');
  var initrdFile = String(args._[0] || global.ROOT_DIRECTORY || '');

  var fileData = readInitrd(initrdFile);
  if (!fileData) {
    return cb('ramdisk bundle read error');
  }
  
  var qemuNet = args.net;

  var extraPorts = [];
  if (typeof args.port === 'number') {
    extraPorts = [args.port];
  }
  if (args.port instanceof Array) {
    extraPorts = args.port;
  }

  var qemuNetdump = !!args.netdump;
  var qemuCurses = !!args.curses;
  var qemuKVM = !!args.kvm;
  var qemuAppend = args.append || '';
  var qemuNographic = !!args.nographic;
  var qemuVirtioRng = !!args['virtio-rng'];
  var qemuCommandAppend = args['append-qemu'] || '';

  var dryRun = !!args['dry-run'];
  var verbose = !!args.verbose;

  var drives = [];
  if (typeof args.drive === 'string') {
    drives = [args.drive];
  }
  if (Array.isArray(args.drive)) {
    drives = args.drive;
  }

  getRuntime(fileData.kernelVer, kernelFile, !!args.local, function(err, runtimeFile) {
    if (err) {
      return cb(err)
    }

    kernelFile = runtimeFile;

    qemu({
      initrd: initrdFile,
      kernel: kernelFile,
      net: qemuNet,
      netdump: qemuNetdump,
      curses: qemuCurses,
      kvm: qemuKVM,
      qemuCommandAppend: qemuCommandAppend,
      append: qemuAppend,
      dryRun: dryRun,
      verbose: verbose,
      virtioRng: qemuVirtioRng,
      nographic: qemuNographic,
      ports: extraPorts.filter(Boolean),
      drives: drives.filter(Boolean)
    }, cb);
  });
};
