/* Tiny IndexedDB wrapper with a localStorage fallback. Stores: docs, bank, mytemplates, meta */
const DB_NAME = 'waraqa';
const STORES = ['docs', 'bank', 'mytemplates', 'meta'];
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no idb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach((s) => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((e) => { dbp = null; throw e; });
  return dbp;
}

const lsKey = (store) => `waraqa:${store}`;
const lsAll = (store) => { try { return JSON.parse(localStorage.getItem(lsKey(store)) || '[]'); } catch { return []; } };
const lsSave = (store, arr) => localStorage.setItem(lsKey(store), JSON.stringify(arr));

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const r = fn(s);
    t.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const db = {
  async all(store) {
    try { return (await tx(store, 'readonly', (s) => s.getAll())) || []; } catch { return lsAll(store); }
  },
  async get(store, id) {
    try { return await tx(store, 'readonly', (s) => s.get(id)); } catch { return lsAll(store).find((x) => x.id === id); }
  },
  async put(store, obj) {
    try { await tx(store, 'readwrite', (s) => s.put(obj)); } catch {
      const arr = lsAll(store).filter((x) => x.id !== obj.id); arr.push(obj); lsSave(store, arr);
    }
    return obj;
  },
  async del(store, id) {
    try { await tx(store, 'readwrite', (s) => s.delete(id)); } catch { lsSave(store, lsAll(store).filter((x) => x.id !== id)); }
  },
  async clear(store) {
    try { await tx(store, 'readwrite', (s) => s.clear()); } catch { lsSave(store, []); }
  },
};

export async function askPersistence() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch { /* ignore */ }
}
export async function storageInfo() {
  try { const e = await navigator.storage.estimate(); return { used: e.usage || 0, quota: e.quota || 0 }; } catch { return null; }
}

export async function exportAll() {
  const out = { app: 'waraqa', version: 1, exportedAt: new Date().toISOString() };
  for (const s of STORES) out[s] = await db.all(s);
  return out;
}
export async function importAll(data, { replace = false } = {}) {
  if (!data || data.app !== 'waraqa') throw new Error('This file is not a Waraqa backup.');
  let count = 0;
  for (const s of STORES) {
    if (!Array.isArray(data[s])) continue;
    if (replace) await db.clear(s);
    for (const o of data[s]) { await db.put(s, o); if (s === 'docs') count++; }
  }
  return count;
}
