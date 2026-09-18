// Shared typeface picker for Spielwerk tools. Classic script → window.fontPicker.
// Needs snapshots.js first (SLUG, kv, fileURL).
// Loads a local .ttf/.otf/.woff(2) via FontFace so canvas and inline SVG render it
// immediately, and keeps a data: URL so SVG exports can embed the face and keep
// rendering elsewhere. The face lives in IndexedDB under "font:<slug>" — never in
// localStorage, whose origin-wide quota every tool shares — so it survives reloads
// and rides along in snapshots (snapshots.js reads the same key).
//
//   const userFont = fontPicker({onChange: () => render()});
//   somegroup.append(userFont.row);
//   userFont.font  // {family, dataURL} — both null until a file is picked
// A second face for the same tool passes its own storage key:
//   fontPicker({label: "accent face", key: "font:" + SLUG + ":accent", onChange})
function fontPicker({label = "typeface", key, onChange}) {
  const KEY = key || "font:" + SLUG;
  const row = document.createElement("label");
  const name = document.createElement("span");
  name.textContent = label;
  const inp = Object.assign(document.createElement("input"),
    {type: "file", accept: ".ttf,.otf,.woff,.woff2"});
  inp.style.cssText = "grid-column: 2 / 3; min-width: 0; font: inherit; font-size: 11px;";
  const clear = Object.assign(document.createElement("button"), {type: "button", textContent: "✕", title: "back to the system font"});
  clear.style.cssText = "font:inherit;border:1px solid #ccc;background:#fff;border-radius:6px;cursor:pointer;justify-self:end";
  const info = document.createElement("span");
  info.style.cssText = "grid-column: 1 / 4; color: #888; font-size: 11px;";
  info.textContent = "system default";
  const font = {family: null, dataURL: null};
  const apply = async ({family, file, dataURL}) => {
    const face = new FontFace(family, `url(${dataURL})`);
    await face.load();
    document.fonts.add(face);
    Object.assign(font, {family, dataURL});
    info.textContent = file;
    onChange(font);
  };
  inp.addEventListener("input", async () => {
    const file = inp.files[0];
    if (!file) return;
    const f = {family: "user-" + file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]/g, ""),
               file: file.name, dataURL: await fileURL(file)};
    try { await apply(f); kv.set(KEY, f); }
    catch (e) { info.textContent = "could not load: " + e.message; }
  });
  clear.addEventListener("click", () => {
    Object.assign(font, {family: null, dataURL: null});
    info.textContent = "system default";
    inp.value = "";
    kv.set(KEY, null);
    onChange(font);
  });
  kv.get(KEY).then(f => f && apply(f)).catch(() => {});   // restore last upload / snapshot font
  row.append(name, inp, clear, info);
  return {row, font};
}
