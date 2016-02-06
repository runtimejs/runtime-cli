# runtime-cli
Command line tools for `runtime.js`.

[![Build Status](https://travis-ci.org/runtimejs/runtime-cli.svg?branch=master)](https://travis-ci.org/runtimejs/runtime-cli)
[![npm](https://img.shields.io/npm/v/runtime-cli.svg)](https://www.npmjs.com/package/runtime-cli)

### Installation

```
npm install -g runtime-cli
```

### Usage

```
USAGE: runtime <command> [<args>]

Commands:
  start         Quickly start runtime.js VM using current directory
  watch         Watch current directory and automatically restart runtime.js VM
  pack          Package specified directory into ramdisk bundle
  run           Run runtime.js VM using specified ramdisk bundle
  show          Print VM output or log
  help          Print this usage help
```

### Getting Started

To setup a project simply install `runtimejs` package as a dependency. It doesn't need to be `require()`-d anywhere, just make sure it exists in `node_modules`.

```
mkdir project
cd project
npm install runtimejs
echo "console.log('ok')" > index.js
```

Run project in QEMU VM:

```
runtime start
```

Or let it watch directory for changes and restart QEMU automatically:

```
runtime watch
```

### Commands

`start`, `watch` and `run` commands are very similar and have pretty much the same list of arguments. They all launch runtime.js in the QEMU VM.

```
USAGE: runtime start [<args>]
(Quickly start runtime.js VM using current directory)

Arguments:
  --net         Enable network (value can be "none", "user", "tap" or
                "bridge", defaults to "user")
  --netdump     Save network activity to a file
  --kvm         Enable Linux KVM (much faster virtualization)
  --curses      Use text-mode graphics
  --port        Redirect TCP/UDP connections on the host port to the runtime.js
  --append      Append string to runtime.js command line
  --dry-run     Test input but do not launch the VM
  --verbose     Output extra info like VM command line
  --virtio-rng  Enable VIRTIO-RNG entropy source for the runtime.js
  --nographic   Disable graphics, run in command line mode
  --kernel      Specify custom kernel binary file to use
  --local       Download the kernel locally (i.e. in the module's directory)
```

`pack` packages directory into ramdisk/initrd bundle. This is useful if you'd like to ship compiled bundle somewhere and don't want to run it locally.

```
USAGE: runtime pack [<args>] <directory>
(Package specified directory into ramdisk bundle)

  <directory>   Directory to package

Arguments:
  --list-files  List packaged files only
  --ignore      Add file ignore pattern
  --entry       Set entry point import/require string (defaults to "/")
```

### Completion

Enables tab-completion for all commands.

```
runtime completion >> ~/.bashrc
runtime completion >> ~/.zshrc
```

### License

Apache License, Version 2.0
