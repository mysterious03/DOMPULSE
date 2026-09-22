// generate-icons.js
import fs from 'fs';
import path from 'path';

// Simple 1-channel or raw RGBA PNG writer without heavy dependencies
function createPng(size) {
  // Let's create an uncompressed PNG or use a solid/gradient icon with pulse motif
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const checksum = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(checksum, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw pixel data: each scanline starts with filter byte 0
  const rawBytes = [];
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;

  for (let y = 0; y < size; y++) {
    rawBytes.push(0); // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background circle: Deep purple to cyan
      if (dist <= r) {
        // Pulse wave motif
        const normX = (x / size) * 4 - 2;
        const pulseY = Math.sin(normX * 3.5) * Math.exp(-normX * normX * 0.8) * (size * 0.28);
        const onPulse = Math.abs(y - (cy - pulseY)) < Math.max(1, size * 0.08);

        if (onPulse) {
          // Vibrant cyan/electric pulse
          rawBytes.push(0x38, 0xbd, 0xf8, 255);
        } else {
          // Dark indigo / violet background
          const t = y / size;
          const red = Math.floor(15 + 20 * t);
          const green = Math.floor(23 + 10 * t);
          const blue = Math.floor(42 + 50 * t);
          rawBytes.push(red, green, blue, 255);
        }
      } else {
        // Transparent
        rawBytes.push(0, 0, 0, 0);
      }
    }
  }

  // Zlib deflate store block (uncompressed)
  const rawBuf = Buffer.from(rawBytes);
  // Break into max 65535 byte blocks
  const blocks = [];
  let offset = 0;
  while (offset < rawBuf.length) {
    const end = Math.min(offset + 65535, rawBuf.length);
    const chunk = rawBuf.subarray(offset, end);
    const isLast = end === rawBuf.length ? 1 : 0;
    const header = Buffer.alloc(5);
    header[0] = isLast;
    header.writeUInt16LE(chunk.length, 1);
    header.writeUInt16LE((~chunk.length) & 0xffff, 3);
    blocks.push(header, chunk);
    offset = end;
  }

  // Adler-32
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < rawBuf.length; i++) {
    s1 = (s1 + rawBuf[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(((s2 << 16) | s1) >>> 0, 0);

  const zlibData = Buffer.concat([
    Buffer.from([0x78, 0x01]), // zlib header
    ...blocks,
    adler
  ]);

  const idatChunk = makeChunk('IDAT', zlibData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

[16, 48, 128].forEach(size => {
  const buf = createPng(size);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), buf);
  console.log(`Generated icon${size}.png (${buf.length} bytes)`);
});
