// Shared parameter snapshots for Spielwerk tools. Classic script → window.SLUG,
// kv, fileURL, snapshotPanel. Load before fontpick.js.
//
// A snapshot is the tool's whole localStorage blob (minus panel open state and
// zoom) plus the uploaded typeface. Everything sits in IndexedDB: its quota is
// big enough for font binaries, which is why fonts never went into localStorage.
// Loading a snapshot writes the blob and the font back and reloads — every tool
// already boots from exactly those two places, so no tool needs a "set" path.
//
// Storage: when the page is served by serve.py (probe: GET /snaps/ping),
// snapshots live as plain JSON files in ~/Documents/spielwerk-snapshots/
// <slug>.json — one shared place, independent of browser and origin. Anywhere
// else (file://, GitHub Pages) they fall back to per-origin IndexedDB. On the
// first load with the server up, old IndexedDB snapshots are migrated into the
// file and cleared. The ⇩/⇧ buttons export/import a tool's snapshots as one
// JSON file (fonts ride along as data URLs) to move them across machines.
//
//   group("snapshots").append(snapshotPanel());
const SLUG = location.pathname.split("/").pop().replace(/\.html$/, "");

// tiny key/value store on IndexedDB: kv.get(key) / kv.set(key, value)
const kv = (() => {
  const db = new Promise((res, rej) => {
    const r = indexedDB.open("spielwerk", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const run = (mode, f) => db.then(d => new Promise((res, rej) => {
    const q = f(d.transaction("kv", mode).objectStore("kv"));
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  }));
  return {get: k => run("readonly", s => s.get(k)),
          set: (k, v) => run("readwrite", s => s.put(v, k))};
})();
// snapshot storage: JSON files via serve.py when reachable, else IndexedDB
const snapStore = (() => {
  const KEY = "snaps:" + SLUG;
  const remote = fetch("/snaps/ping").then(r => r.ok).catch(() => false);
  return {
    async load() {
      if (!await remote) return await kv.get(KEY) || [];
      const snaps = await fetch("/snaps/" + SLUG).then(r => r.json());
      const old = await kv.get(KEY) || [];        // one-time migration from IndexedDB
      const extra = old.filter(s => !snaps.some(x => x.name === s.name));
      if (extra.length) { snaps.push(...extra); await this.save(snaps); }
      if (old.length) await kv.set(KEY, []);
      return snaps;
    },
    async save(snaps) {
      if (await remote) await fetch("/snaps/" + SLUG, {method: "PUT", body: JSON.stringify(snaps, null, 1)});
      else await kv.set(KEY, snaps);
    }
  };
})();
const fileURL = file => new Promise(r => {
  const fr = new FileReader();
  fr.onload = () => r(fr.result);
  fr.readAsDataURL(file);
});

function snapshotPanel() {
  const FONT = "font:" + SLUG;
  const BTN = "font:inherit;border:1px solid #ccc;background:#fff;border-radius:6px;cursor:pointer;padding:2px 7px";
  const button = (text, title) => {
    const b = Object.assign(document.createElement("button"), {textContent: text, title, type: "button"});
    b.style.cssText = BTN;
    return b;
  };

  const box = document.createElement("div");
  const row = document.createElement("label");
  row.innerHTML = `<span>save as</span><input type="text" placeholder="name" style="grid-column:2">`;
  const inp = row.querySelector("input");
  const add = button("+", "save the current settings and typeface");
  row.append(add);
  const list = document.createElement("div");
  const ex = button("⇩", "export all snapshots as a JSON file");
  ex.onclick = async () => {
    const snaps = await snapStore.load();
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([JSON.stringify({tool: SLUG, snaps}, null, 1)], {type: "application/json"})),
      download: `${SLUG}-snapshots.json`});
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const im = button("⇧", "import snapshots from a JSON file (same names overwrite)");
  im.onclick = () => {
    const f = Object.assign(document.createElement("input"), {type: "file", accept: ".json,application/json"});
    f.onchange = async () => {
      const {tool, snaps: incoming} = JSON.parse(await f.files[0].text());
      if (tool !== SLUG && !confirm(`This file is from "${tool}" — import into "${SLUG}" anyway?`)) return;
      const snaps = await snapStore.load();
      for (const s of incoming) {
        const i = snaps.findIndex(x => x.name === s.name);
        i < 0 ? snaps.push(s) : snaps[i] = s;
      }
      await snapStore.save(snaps);
      draw();
    };
    f.click();
  };
  const io = document.createElement("div");
  io.style.cssText = "display:flex;gap:6px;justify-content:flex-end;margin-top:6px";
  io.append(ex, im);
  box.append(row, list, io);

  async function draw() {
    const snaps = await snapStore.load();
    list.replaceChildren(...snaps.map((s, i) => {
      const r = document.createElement("div");
      r.style.cssText = "display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;margin:6px 0";
      const name = document.createElement("span");
      name.textContent = s.name;
      name.title = new Date(s.at).toLocaleString() + (s.font ? " · " + s.font.file : "");
      name.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      const load = button("load", "restore these settings (reloads the page)");
      load.onclick = async () => {
        localStorage.setItem(SLUG, JSON.stringify({...JSON.parse(localStorage.getItem(SLUG) || "{}"), ...s.params}));
        await kv.set(FONT, s.font);
        await kv.set(FONT + ":accent", s.accent || null);   // second face, when the tool has one
        location.reload();
      };
      const del = button("✕", "delete this snapshot");
      del.onclick = async () => { snaps.splice(i, 1); await snapStore.save(snaps); draw(); };
      r.append(name, load, del);
      return r;
    }));
    if (!snaps.length) list.innerHTML = '<span style="color:#888;font-size:11px">nothing saved yet</span>';
  }

  async function save() {
    navigator.storage?.persist?.();                          // ask the browser not to evict the DB
    const {open, zoom, ...params} = JSON.parse(localStorage.getItem(SLUG) || "{}");
    const snaps = await snapStore.load();
    const name = inp.value.trim() || `snapshot ${snaps.length + 1}`;
    const snap = {name, at: Date.now(), params, font: await kv.get(FONT) || null,
                  accent: await kv.get(FONT + ":accent") || null};
    const i = snaps.findIndex(s => s.name === name);          // same name overwrites
    i < 0 ? snaps.push(snap) : snaps[i] = snap;
    await snapStore.save(snaps);
    inp.value = "";
    draw();
  }
  add.onclick = save;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); save(); } });
  draw();
  return box;
}
