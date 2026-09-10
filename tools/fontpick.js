// Shared typeface picker for Spielwerk tools. Classic script → window.fontPicker.
// Loads a local .ttf/.otf/.woff(2) via FontFace so canvas and inline SVG render it
// immediately, and keeps a data: URL so SVG exports can embed the face and keep
// rendering elsewhere. The font itself is NOT persisted — the binary is too big
// for the origin-wide localStorage quota all tools share (font-remixer precedent).
//
//   const userFont = fontPicker({onChange: () => render()});
//   somegroup.append(userFont.row);
//   userFont.font  // {family, dataURL} — both null until a file is picked
function fontPicker({label = "typeface", onChange}) {
  const row = document.createElement("label");
  const name = document.createElement("span");
  name.textContent = label;
  const inp = Object.assign(document.createElement("input"),
    {type: "file", accept: ".ttf,.otf,.woff,.woff2"});
  inp.style.cssText = "grid-column: 2 / 4; min-width: 0; font: inherit; font-size: 11px;";
  const info = document.createElement("span");
  info.style.cssText = "grid-column: 1 / 4; color: #888; font-size: 11px;";
  info.textContent = "system default — uploads last until reload";
  const font = {family: null, dataURL: null};
  inp.addEventListener("input", async () => {
    const file = inp.files[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const fam = "user-" + file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "");
      const face = new FontFace(fam, buf);
      await face.load();
      document.fonts.add(face);
      font.family = fam;
      font.dataURL = await new Promise(r => {
        const fr = new FileReader();
        fr.onload = () => r(fr.result);
        fr.readAsDataURL(new Blob([buf], {type: "font/ttf"}));
      });
      info.textContent = file.name;
      onChange(font);
    } catch (e) {
      info.textContent = "could not load: " + e.message;
    }
  });
  row.append(name, inp, info);
  return {row, font};
}
