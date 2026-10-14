import type { Persistence } from './storage';

export type Typeface = { family: string; file: string; dataURL: string };
export type FontSlot = 'primary' | 'accent';
export function typefaces(slug: string, persistence: Persistence) {
  const key = (slot: FontSlot) => `font:${slug}${slot === 'accent' ? ':accent' : ''}`;
  return {
    async load(slot: FontSlot): Promise<Typeface | null> {
      return await persistence.kv.get<Typeface>(key(slot)) || null;
    },
    save(slot: FontSlot, font: Typeface | null) { return persistence.kv.set(key(slot), font); },
  };
}

export async function readTypeface(file: File): Promise<Typeface> {
  const dataURL = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return {
    family: 'user-' + file.name.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, ''),
    file: file.name, dataURL,
  };
}

/** The caller owns the returned face and removes it when replacing/unmounting it. */
export async function activateTypeface(font: Typeface): Promise<FontFace> {
  const face = await new FontFace(font.family, `url(${font.dataURL})`).load();
  document.fonts.add(face);
  return face;
}
