// Shared parameter snapshots for Spielwerk tools. Classic script → window.SLUG,
// kv, fileURL, snapshotPanel. Load before fontpick.js.
//
// A snapshot is the tool's whole localStorage blob (minus panel open state and
// zoom) plus the uploaded typeface. Everything sits in IndexedDB: its quota is
// big enough for font binaries, which is why fonts never went into localStorage.
// Loading a snapshot writes the blob and the font back and reloads — every tool
// already boots from exactly those two places, so no tool needs a "set" path.
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
const fileURL = file => new Promise(r => {
  const fr = new FileReader();
  fr.onload = () => r(fr.result);
  fr.readAsDataURL(file);
});

function snapshotPanel() {
  const KEY = "snaps:" + SLUG, FONT = "font:" + SLUG;
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
  box.append(row, list);

  async function draw() {
    const snaps = await kv.get(KEY) || [];
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
        location.reload();
      };
      const del = button("✕", "delete this snapshot");
      del.onclick = async () => { snaps.splice(i, 1); await kv.set(KEY, snaps); draw(); };
      r.append(name, load, del);
      return r;
    }));
    if (!snaps.length) list.innerHTML = '<span style="color:#888;font-size:11px">nothing saved yet</span>';
  }

  async function save() {
    const {open, zoom, ...params} = JSON.parse(localStorage.getItem(SLUG) || "{}");
    const snaps = await kv.get(KEY) || [];
    const name = inp.value.trim() || `snapshot ${snaps.length + 1}`;
    const snap = {name, at: Date.now(), params, font: await kv.get(FONT) || null};
    const i = snaps.findIndex(s => s.name === name);          // same name overwrites
    i < 0 ? snaps.push(snap) : snaps[i] = snap;
    await kv.set(KEY, snaps);
    inp.value = "";
    draw();
  }
  add.onclick = save;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); save(); } });
  draw();
  return box;
}
