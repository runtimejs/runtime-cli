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
var crc32 = require('buffer-crc32');
var nullByte = new Buffer([0]);
var zlib = require('zlib');
var crypto = require('crypto');

function writeString(stream, str) {
  var strBuf = new Buffer(str, 'utf8');
  var strLenBuf = new Buffer(2);
  strLenBuf.writeUInt16BE(strBuf.length, 0);
  stream.write(strLenBuf);
  stream.write(strBuf);
  stream.write(nullByte);
  return strLenBuf.length + strBuf.length + nullByte.length;
}

function hashBuffer(buf) {
  var hash = crypto.createHash('sha256');
  hash.update(buf, 'binary');
  return hash.digest('hex');
}

module.exports = function(out, files, coreConfig, runtimeIndexName, appIndexName) {
  var headerBuffer = new Buffer(24);
  headerBuffer.writeUInt32BE(0xCAFECAFE, 0);
  headerBuffer.writeUInt8('P'.charCodeAt(0), 4);
  headerBuffer.writeUInt8('C'.charCodeAt(0), 5);
  headerBuffer.writeUInt8('K'.charCodeAt(0), 6);
  headerBuffer.writeUInt8('G'.charCodeAt(0), 7);
  headerBuffer.writeUInt32BE(0, 8); // backwards compatible file count 0

  var kernelVer = Number(coreConfig.kernelVersion);
  headerBuffer.writeUInt32BE(kernelVer, 12);
  headerBuffer.writeUInt32BE(files.length, 16);

  var def = zlib.createDeflate({
    level: 6
  });

  var inflatedSize = 0;
  inflatedSize += writeString(def, runtimeIndexName);
  inflatedSize += writeString(def, appIndexName);

  var hashes = {};

  for (var i = 0; i < files.length; ++i) {
    var file = files[i];
    var fileBuffer = fs.readFileSync(file.path);
    var hashValue = hashBuffer(fileBuffer);
    var isLink = typeof hashes[hashValue] === 'number';

    var fileHeaderBuf = new Buffer(8);
    fileHeaderBuf.writeUInt32BE(isLink ? 0xBB : 0xAA, 0);
    fileHeaderBuf.writeUInt32BE(fileBuffer.length, 4); // length
    inflatedSize += fileHeaderBuf.length;
    def.write(fileHeaderBuf);

    inflatedSize += writeString(def, file.name);

    if (isLink) {
      // link to another file by index
      var indexBuf = new Buffer(4);
      indexBuf.writeUInt32BE(hashes[hashValue], 0);
      def.write(indexBuf);
      inflatedSize += indexBuf.length;
    } else {
      // normal file content
      var crc = crc32(fileBuffer);
      def.write(crc);
      def.write(fileBuffer);
      inflatedSize += crc.length + fileBuffer.length;
      hashes[hashValue] = i;
    }

    // console.log(fileBuffer.length + '\t' + file.name + ' ' + (isLink ? '(link)' : ''));
  }

  headerBuffer.writeUInt32BE(inflatedSize, 20);
  out.write(headerBuffer);
  def.pipe(out);

  // console.log('Inflated size', inflatedSize);

  def.end();
};
