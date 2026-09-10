# spielwerk — building a new tool

Each tool is ONE self-contained page in `tools/<slug>.html`. Copy the closest
existing tool as the starting point (`stripe-marquee.html` is the reference for
panel structure, `arrow-field.html` for a SMIL + GIF generator) and keep every
convention below. Shortest diff against the house pattern wins.

## Page skeleton

- Single HTML file: inline `<style>`, `#panel` (left, sliders) + `#stage`
  (right, live SVG) + `#viewbox` zoom select, then the shared scripts —
  `export.js`, `zoom.js`, `mobile.js`, `sliders.js`, and `fontpick.js` when
  the tool renders text — and `mobile.css`.
  Never duplicate what those helpers already do.
- Register the tool in the `tools` manifest array in `index.html`
  (file, name, one-paragraph desc).

## Parameters

- All parameters live in one `DEFS` table: `[key, type, {min, max, step,
  value, label}]`. Types: `range`, `select`, `color`, `text`, `checkbox`.
- **REQUIRED: structure the panel in collapsible sections, exactly like
  stripe-marquee.** A `["", "group", {label: "…"}]` row opens a section;
  every row after it lands in that section. Use the native `<details>`
  `group()` helper + summary CSS from `stripe-marquee.html` (lines around
  `#panel details` / `// ---------- collapsible groups ----------`) verbatim:
  no toggle state machine, open/closed state persists in `p.open` inside the
  same localStorage blob. Only the first section starts open. Typical
  grouping: the tool's core look first, then motion, colour, export.
- Persist everything: one localStorage key equal to the file slug; save on
  every `render()`. Read back via `saved` with the DEFS value as default.
- Include the artboard-size block (width × height inputs, aspect presets,
  swap, ratio lock) copied from any existing tool — it belongs in an
  "artboard" group.
- **REQUIRED: any tool that renders text lets the user upload their own
  typeface.** Use the shared `fontpick.js` (`fontPicker({onChange})`) — it
  loads .ttf/.otf/.woff(2) via FontFace for live canvas/SVG rendering and
  hands back a data: URL. If text survives into the exported SVG (as `<text>`),
  embed that data: URL as an `@font-face` in a `<style>` inside the SVG so the
  export keeps the face (see arrow-comb); canvas-baked type (stripe-marquee)
  needs no embedding. The binary is never persisted — localStorage quota is
  origin-wide and shared by every tool.

## Generator

- One deterministic `makeSVG(time = null)` returning `{w, h, svg}` — seeded
  `mulberry32`, fixed random draws per element so the stream stays aligned
  whatever options are set. Keep the determinism self-check:
  `console.assert(makeSVG().svg === makeSVG().svg, "generator must be deterministic")`.
- Animation is declarative SMIL (`<animate>`, `<animateTransform>`,
  `<animateMotion>`) so the **exported SVG stays animated**. `time === null`
  → live SMIL; a number bakes that instant statically with the same shared
  timing math — that one generator drives live view, PNG (frame 0) and GIF
  frames.
- Round coordinates (`+n.toFixed(2)`) to keep files small.

## Export + review

- Wire `wireExport({SVG, PNG, GIF})`; GIF via `rasterise`/`encodeGIF` over one
  motion cycle, with `gif fps` / `gif px` sliders in an export group.
- Filenames: `<slug>-<seed>.<ext>`.
- Before calling it done: serve locally (`python3 -m http.server`), open in
  Chrome, screenshot the result, and check the console — never judge only
  from code. Kill the server and close the tab afterwards.
