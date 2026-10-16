import type { Asset } from '../engine/contracts';
import { decodeImage, maxImageBytes, rasterType } from '../engine/images';
import type { Persistence } from './storage';

export type UploadedImage = { file: string; dataURL: string; width: number; height: number };
const assets = new WeakMap<UploadedImage, Asset>();
export function images(slug: string, persistence: Persistence) {
  const key = `image:${slug}`;
  return {
    async load(): Promise<UploadedImage | null> { return await persistence.kv.get<UploadedImage>(key) || null; },
    save(image: UploadedImage | null) { return persistence.kv.set(key, image); },
  };
}

export function imageAsset(image: UploadedImage): Asset {
  const existing = assets.get(image);
  if (existing) return existing;
  if (typeof image.file !== 'string' || typeof image.dataURL !== 'string' || image.dataURL.length > Math.ceil(maxImageBytes / 3) * 4 + 100) {
    throw new Error('Invalid image data or image larger than 10 MB.');
  }
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(image.dataURL);
  if (!match) throw new Error('Choose a PNG, JPEG, or WebP image.');
  const asset: Asset = { id: 'image', role: 'image', mediaType: match[1], bytes: Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)) };
  assets.set(image, asset);
  return asset;
}

export async function validateImage(image: UploadedImage | null | undefined) {
  if (image) await decodeImage(imageAsset(image));
}

export async function readImage(file: File): Promise<UploadedImage> {
  if (!file.size || file.size > maxImageBytes) throw new Error('Images must be 10 MB or smaller.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const asset: Asset = { id: 'image', role: 'image', mediaType: rasterType(bytes), bytes };
  const decoded = await decodeImage(asset);
  const dataURL = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(new Blob([bytes], { type: asset.mediaType }));
  });
  const image = { file: file.name, dataURL, width: decoded.width, height: decoded.height };
  assets.set(image, asset);
  return image;
}
