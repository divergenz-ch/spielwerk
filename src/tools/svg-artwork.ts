import type { ExportHandlers } from '../workspace/exports';
import type { Parameters } from '../workspace/storage';
type SvgScene = { svg: string; staticSvg: string; motionSvg?: string };

async function raster(svg: string, width: number, height: number) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0, width, height);
    return { canvas, ctx };
  } finally { URL.revokeObjectURL(url); }
}
const word16 = (n: number) => [n & 255, n >> 8 & 255];
// Literal LZW blocks clear before dictionary growth changes the nine-bit code width.
function gifFrame(pixels: Uint8ClampedArray, width: number, height: number, delay: number) {
  const count = width * height;
  const packed = new Uint8Array(Math.ceil((count + Math.ceil(count / 128) + 1) * 9 / 8));
  let bits = 0;
  const code = (n: number) => { for (let i = 0; i < 9; i++, bits++) if (n & 1 << i) packed[bits >> 3] |= 1 << (bits & 7); };
  for (let i = 0; i < count; i++) {
    if (i % 128 === 0) code(256);
    const k = i * 4; const index = (pixels[k] & 224) | (pixels[k + 1] & 224) >> 3 | pixels[k + 2] >> 6;
    code(pixels[k + 3] < 128 ? 0 : index || 1);
  }
  code(257);
  const blocks: Uint8Array[] = [new Uint8Array([0x21, 0xf9, 4, 5, ...word16(delay), 0, 0, 0x2c, 0, 0, 0, 0, ...word16(width), ...word16(height), 0, 8])];
  for (let i = 0; i < packed.length; i += 255) { const block = packed.slice(i, i + 255); blocks.push(new Uint8Array([block.length]), block); }
  blocks.push(new Uint8Array([0])); return blocks;
}
export function svgArtwork(id: string, motion = false): ExportHandlers<Parameters, SvgScene> { return {
  async svg({ frame }) { return { name: `${id}.svg`, blob: new Blob([(motion ? frame.scene.motionSvg! : frame.scene.staticSvg).replace(/ data-(?:arrow|word|text|profile)="[^"]*"/g, '')], { type: 'image/svg+xml' }) }; },
  async png({ frame }) {
    const { canvas } = await raster(motion ? frame.scene.svg : frame.scene.staticSvg, frame.dimensions.width, frame.dimensions.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
    return { name: `${id}.png`, blob };
  },
  async gif({ input, frame, evaluate, progress }) {
    const p = input.design.params;
    const fps = Math.max(5, Math.min(30, Number(p.fps) || 10));
    const scale = Math.min(1, (Number(p.gifpx) || 600) / Math.max(frame.dimensions.width, frame.dimensions.height));
    const width = Math.round(frame.dimensions.width * scale), height = Math.round(frame.dimensions.height * scale);
    const palette = new Uint8Array(768);
    for (let i = 0; i < 256; i++) palette.set([Math.round((i >> 5) * 255 / 7), Math.round((i >> 2 & 7) * 255 / 7), (i & 3) * 85], i * 3);
    palette.set([0, 0, 0], 3);
    const parts: BlobPart[] = [new Uint8Array([71, 73, 70, 56, 57, 97, ...word16(width), ...word16(height), 0xf7, 0, 0]), palette, new Uint8Array([0x21, 0xff, 11, ...new TextEncoder().encode('NETSCAPE2.0'), 3, 1, 0, 0, 0])];
    const count = Math.max(1, Math.round(frame.durationSeconds * fps));
    for (let i = 0; i < count; i++) {
      progress(`Encoding frame ${i + 1}/${count}…`);
      const evaluated = await evaluate(frame.durationSeconds ? i * frame.durationSeconds / count : 0);
      const { ctx } = await raster(evaluated.scene.svg, width, height);
      parts.push(...gifFrame(ctx.getImageData(0, 0, width, height).data, width, height, Math.max(2, Math.round(100 / fps))));
      if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve));
    }
    parts.push(new Uint8Array([0x3b]));
    return { name: `${id}.gif`, blob: new Blob(parts, { type: 'image/gif' }) };
  },
}; }
