type Entry = { name: string; bytes: Uint8Array };
const encoder = new TextEncoder();
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xedb88320 ^ n >>> 1 : n >>> 1;
  return n >>> 0;
});
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
  return (crc ^ 0xffffffff) >>> 0;
}
function record(size: number, values: [number, number, 2 | 4][]) {
  const bytes = new Uint8Array(size), view = new DataView(bytes.buffer);
  for (const [offset, value, width] of values) {
    if (width === 2) view.setUint16(offset, value, true);
    else view.setUint32(offset, value, true);
  }
  return bytes;
}
/** Standard stored ZIP: local assets stay byte-exact; no compression dependency. */
export function zip(entries: Entry[]): Blob {
  const local: BlobPart[] = [], central: BlobPart[] = [];
  let offset = 0, centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name), size = entry.bytes.length, crc = crc32(entry.bytes);
    const header = record(30, [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x800, 2], [12, 33, 2], [14, crc, 4], [18, size, 4], [22, size, 4], [26, name.length, 2]]);
    const directory = record(46, [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x800, 2], [14, 33, 2], [16, crc, 4], [20, size, 4], [24, size, 4], [28, name.length, 2], [42, offset, 4]]);
    local.push(header, name, entry.bytes); central.push(directory, name);
    offset += header.length + name.length + size;
    centralSize += directory.length + name.length;
  }
  return new Blob([...local, ...central, record(22, [[0, 0x06054b50, 4], [8, entries.length, 2], [10, entries.length, 2], [12, centralSize, 4], [16, offset, 4]])], { type: 'application/zip' });
}
