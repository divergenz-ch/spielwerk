import { settingsStore, splitSettings, type Parameters, type Persistence } from './storage';
import { typefaces, type Typeface } from './fonts';
import { images, validateImage, type UploadedImage } from './images';

export type Snapshot = { name: string; at: number; params: Parameters; font: Typeface | null; accent?: Typeface | null; image?: UploadedImage | null };
export type SnapshotFile = { tool: string; snaps: Snapshot[] };
export interface SnapshotStore {
  load(): Promise<Snapshot[]>;
  save(snaps: Snapshot[]): Promise<void>;
}

export function snapshotStore(slug: string, persistence: Persistence): SnapshotStore {
  if (!/^[a-z0-9-]+$/i.test(slug) || slug === 'ping') throw new Error('Invalid tool slug');
  const key = `snaps:${slug}`;
  const endpoint = `/snaps/${slug}`;
  const remote = persistence.request('/snaps/ping').then(async response =>
    response.ok && await response.json() === 'ok',
  ).catch(() => false);
  async function request(init?: RequestInit) {
    const response = await persistence.request(endpoint, init);
    if (!response.ok) throw new Error(`Snapshot service: ${response.status}`);
    return response;
  }
  return {
    async load() {
      const local = await persistence.kv.get<Snapshot[]>(key) || [];
      if (!await remote) return local;
      const snaps: Snapshot[] = await (await request()).json();
      const extra = local.filter(snap => !snaps.some(saved => saved.name === snap.name));
      if (extra.length) {
        snaps.push(...extra);
        await this.save(snaps);
      }
      if (local.length) await persistence.kv.set(key, []);
      return snaps;
    },
    async save(snaps) {
      if (await remote) await request({ method: 'PUT', body: JSON.stringify(snaps, null, 1) });
      else await persistence.kv.set(key, snaps);
    },
  };
}

export function snapshots(slug: string, persistence: Persistence, store = snapshotStore(slug, persistence)) {
  const settings = settingsStore(slug, persistence);
  const fonts = typefaces(slug, persistence);
  const imageStore = images(slug, persistence);
  const designOnly = (snap: Snapshot): Snapshot => ({
    name: snap.name, at: snap.at, params: splitSettings(snap.params).params,
    font: snap.font ?? null, accent: snap.accent ?? null,
    ...(snap.image ? { image: snap.image } : {}),
  });
  return {
    list: () => store.load(),
    async save(name: string) {
      const snaps = await store.load();
      const image = await imageStore.load();
      const snap: Snapshot = {
        name: name.trim() || `snapshot ${snaps.length + 1}`, at: Date.now(),
        params: settings.load().params,
        font: await fonts.load('primary'), accent: await fonts.load('accent'),
        ...(image ? { image } : {}),
      };
      const index = snaps.findIndex(saved => saved.name === snap.name);
      if (index < 0) snaps.push(snap); else snaps[index] = snap;
      await store.save(snaps);
      return snap;
    },
    async load(snap: Snapshot) {
      await validateImage(snap.image);
      await imageStore.save(snap.image ?? null);
      const state = settings.save(splitSettings(snap.params).params);
      await fonts.save('primary', snap.font ?? null);
      await fonts.save('accent', snap.accent ?? null);
      return state;
    },
    async remove(name: string) {
      await store.save((await store.load()).filter(snap => snap.name !== name));
    },
    async export(): Promise<SnapshotFile> {
      return { tool: slug, snaps: (await store.load()).map(designOnly) };
    },
    async import(file: SnapshotFile, confirm: (message: string) => boolean | Promise<boolean>) {
      if (file.tool !== slug && !await confirm(`This file is from "${file.tool}" — import into "${slug}" anyway?`)) return false;
      const snaps = await store.load();
      for (const incoming of file.snaps) {
        const snap = designOnly(incoming);
        await validateImage(snap.image);
        const index = snaps.findIndex(saved => saved.name === snap.name);
        if (index < 0) snaps.push(snap); else snaps[index] = snap;
      }
      await store.save(snaps);
      return true;
    },
  };
}
