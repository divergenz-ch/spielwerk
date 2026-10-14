export type Parameters = Record<string, unknown>;
export type SavedSettings = { params: Parameters; view: Parameters };
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}
export interface Persistence {
  settings: Pick<Storage, 'getItem' | 'setItem'>;
  kv: KeyValueStore;
  request: typeof fetch;
}

export function browserPersistence(): Persistence {
  let database: Promise<IDBDatabase> | undefined;
  const open = () => database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('spielwerk', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('kv');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('kv', mode);
      const request = action(transaction.objectStore('kv'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Storage transaction aborted'));
    });
  }
  return {
    settings: localStorage,
    kv: {
      get: <T>(key: string) => run<T | undefined>('readonly', store => store.get(key)),
      set: async (key, value) => { await run('readwrite', store => store.put(value, key)); },
    },
    request: fetch.bind(globalThis),
  };
}

const viewKeys = new Set(['open', 'zoom', 'pan', 'expandedGroups']);
export function splitSettings(values: Parameters): SavedSettings {
  return {
    params: Object.fromEntries(Object.entries(values).filter(([key]) => !viewKeys.has(key))),
    view: Object.fromEntries(Object.entries(values).filter(([key]) => viewKeys.has(key))),
  };
}

export function settingsStore(slug: string, persistence: Persistence) {
  const read = (): Parameters => JSON.parse(persistence.settings.getItem(slug) || '{}');
  return {
    load(defaults: Parameters = {}): SavedSettings {
      return splitSettings({ ...defaults, ...read() });
    },
    save(params: Parameters, view: Parameters = {}): SavedSettings {
      const values = { ...read(), ...splitSettings(params).params, ...splitSettings(view).view };
      persistence.settings.setItem(slug, JSON.stringify(values));
      return splitSettings(values);
    },
  };
}
