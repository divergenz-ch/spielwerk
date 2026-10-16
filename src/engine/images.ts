import type { Asset } from './contracts';

export const maxImageBytes = 10 * 1024 * 1024;
export const maxImageDimension = 4096;
const decoded = new WeakMap<Uint8Array, Promise<HTMLCanvasElement>>();

/** Only raster formats: never let SVG or remote URLs enter a shader texture. */
export function rasterType(bytes: Uint8Array): string {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
  throw new Error('Choose a PNG, JPEG, or WebP image.');
}

/** Assets are immutable. Decode once per byte buffer, not once per animation frame.
 * Freeze the first raster frame: animated WebP/APNG must not introduce another
 * clock. Release the bitmap immediately; the cached canvas is garbage collected
 * with its asset, including after navigation or replacing an image. */
export function decodeImage(asset: Asset): Promise<HTMLCanvasElement> {
  const existing = decoded.get(asset.bytes);
  if (existing) return existing;
  const pending = (async () => {
    if (!asset.bytes.byteLength || asset.bytes.byteLength > maxImageBytes) throw new Error('Images must be 10 MB or smaller.');
    if (asset.mediaType !== rasterType(asset.bytes)) throw new Error('The image format does not match its contents.');
    let bitmap: ImageBitmap;
    try { bitmap = await createImageBitmap(new Blob([asset.bytes], { type: asset.mediaType })); }
    catch { throw new Error('This image could not be decoded. Choose another PNG, JPEG, or WebP.'); }
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width > maxImageDimension || bitmap.height > maxImageDimension) {
        throw new Error('Images must be at most 4096 pixels wide and high. Resize the image and try again.');
      }
      const canvas = Object.assign(document.createElement('canvas'), { width: bitmap.width, height: bitmap.height });
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to decode image pixels in this browser.');
      context.drawImage(bitmap, 0, 0);
      return canvas;
    } finally { bitmap.close(); }
  })();
  decoded.set(asset.bytes, pending);
  return pending;
}
