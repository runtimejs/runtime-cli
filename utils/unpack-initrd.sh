#!/bin/bash

{ printf "\x1f\x8b\x08\x00\x00\x00\x00\x00"; tail -c +25 .initrd; } | gzip -dc | hexdump -n 256 -C
