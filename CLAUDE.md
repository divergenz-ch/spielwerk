# Spielwerk authoring boundaries

The current workspace uses Svelte for UI and Rust/Wasm for geometry and timing.
Start with the [current-app workflow](README.md) and
[engine contract](src/engine/README.md). The single-file conventions below
apply only to retained legacy pages in `tools/`.

## Current workspace

`src/main.ts` merges delivered registrations from `src/tools/registry.ts` with
pending metadata in `src/workspace/registry.ts`. Eight generators and their
website packages are delivered. Logo Extruder and Font Remixer remain pending.
Final ten-tool verification and broader integration documentation belong to
`fn-1-spielwerk-shared-design-workspace.1`; this UI refinement doesn't release
that gate or authorize publication.

Svelte owns canonical parameters, assets, playback, and view preferences.
`Controls.svelte` renders adapter-defined groups and native inputs; edits pass
through `controlValue` in `src/workspace/view.ts`. Preserve minimum-relative
step rounding, clamping, decimal precision, and last-valid-value recovery.
Restoring settings or snapshots must update displayed controls without an
edit/persistence loop. Remounting must not duplicate listeners or edits.
Keep reset keyboard-reachable and focus visible; editing keys must not trigger
workspace panning.

Rust owns computation. `latestEvaluation` publishes only the latest full-detail
result; retain its disposal boundary on navigation. Artboard reports updating,
current, or failed preview state, including retained artwork. Avoid per-frame
live announcements during playback. Zoom, pan, and disclosure state remain
view preferences, separate from design export.

Keep parameters and **Artwork export** directly reachable in the control
column. Dimensions live under **Artboard**, snapshot actions under
**Snapshots**, and typeface inputs outside snapshot management. Export uses
`exportArtwork`'s immutable activation-time input, even during preview lag or
failure. Offer only formats with both adapter support and a handler. Keep
folder selection secondary, preserve download fallback warnings, and report
browser download initiation separately from a completed folder write.
Website ZIP guidance must retain runtime, Wasm, and fonts together.

## Control-library decision

Task `fn-6-spielwerk-minimal-creative-instrument.1` tested stock Tweakpane 4.0.5
(MIT) against native controls in the same Chromium Svelte/App fixture with
real Wasm. The selected implementation remains native; Tweakpane is not an
installed dependency or a second UI option.

Both candidates edited numeric, choice, color, text, and toggle values.
Tweakpane used only public `Pane`, `addFolder`, `addBinding`, `addButton`,
`refresh`, and `dispose` APIs, with an editing mirror forwarding normalized
values to Svelte. Text explicitly used `view: 'text'`. No fork, plugin,
third-party Svelte wrapper, or private-DOM patch was used.

Stock Tweakpane failed the parity gate:

- Its six observed inputs had no accessible names; visible labels were
  unassociated. Native controls had six named inputs.
- With minimum 0.15 and step 0.2, canonical 0.55 displayed as 0.6; an ArrowUp
  edit reached canonical 0.75 but displayed 0.8. Native displayed both exactly.
- Stock inputs were focusable, but the observed input outline and shadow were
  absent. The selected native path retained visible focus.

The candidate did restore snapshots through mirror refresh and survived three
unmount/remount cycles without duplicate widgets or duplicate edit callbacks.
Selected native tests additionally verified zero edit callbacks on direct restores,
blank/non-finite recovery, rejected choices, hex-like text, and keyboard reset.
These are Chromium observations, not a cross-browser accessibility
certification or an OS screen-reader listening test.

With identical production entrypoints and base sources, native JavaScript
measured 137,635 bytes (49,074 gzip) versus 284,813 (79,084 gzip) for Tweakpane,
a candidate increase of 147,178 bytes (30,010 gzip). The selected native fixes
measured 137,841 bytes (49,136 gzip). These are task .1 build measurements,
not current bundle budgets or runtime speed claims. The task's recorded
[decision and evidence](.flow/tasks/fn-6-spielwerk-minimal-creative-instrument.1.md)
retain the comparison. No candidate lifecycle adapter remains to maintain.

## Legacy page skeleton

Each legacy tool is one page in `tools/<slug>.html`. Copy the closest existing
tool when maintaining that surface (`stripe-marquee.html` for panel structure,
`arrow-field.html` for a SMIL + GIF generator). The remaining sections describe
that legacy surface only, including its storage, rendering, and filenames.

- Single HTML file: inline `<style>`, `#panel` (left, sliders) + `#stage`
  (right, live SVG) + `#viewbox` zoom select, then the shared scripts —
  `export.js`, `zoom.js`, `mobile.js`, `sliders.js`, `snapshots.js`, and
  `fontpick.js` (after snapshots.js) when the tool renders text — and `mobile.css`.
  Never duplicate what those helpers already do.
- Link directly to the legacy page. The root `index.html` now mounts the
  Svelte workspace and has no legacy `tools` manifest.

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
- Snapshots: after the DEFS loop, `group("snapshots").append(snapshotPanel());`
  (shared `snapshots.js`). A snapshot is the tool's localStorage blob plus the
  uploaded typeface — stored in `~/Documents/spielwerk-snapshots/<slug>.json`
  when served by `serve.py`, else in IndexedDB; loading writes both back and reloads,
  so anything a tool keeps outside `p` (uploaded images, stamps) is not carried.
- **REQUIRED: any tool that renders text lets the user upload their own
  typeface.** Use the shared `fontpick.js` (`fontPicker({onChange})`) — it
  loads .ttf/.otf/.woff(2) via FontFace for live canvas/SVG rendering and
  hands back a data: URL. If text survives into the exported SVG (as `<text>`),
  embed that data: URL as an `@font-face` in a `<style>` inside the SVG so the
  export keeps the face (see arrow-comb); canvas-baked type (stripe-marquee)
  needs no embedding. The binary is never persisted — localStorage quota is
  origin-wide and shared by every tool.

## Relative geometry (REQUIRED)

- The artboard is resizable like Illustrator's artboard tool (zoom.js
  `resize`: double-click the board for a frame with eight handles, Esc or a
  click on the empty stage leaves), and the whole graphic must scale with it. **No geometry parameter is stored in absolute
  pixels.** Each one is either a count/fraction of a grid (columns, % of a
  cell, fractions of the artboard) or **% of the artboard width**:
  `px = artboard width × value / 100`.
- Label and hint such sliders "… %" / "% of artboard width", with a fine step
  (e.g. 0.01) so thin strokes stay adjustable.
- Resolve to px in exactly one place, at the top of the generator (`layout()`
  / `makeSVG()`), from a `REL` key list and a `basis` width (the artboard
  width; an embed that regenerates at another scale passes its own basis).
  Everything downstream keeps working in px.
- Grid tools that should keep their element count across aspect changes
  (arrow-maze is the reference) size the grid by area instead: `cols` counts
  the columns of a square board of the same area (≈ cols² cells at any
  aspect, cell ∝ √(W·H)), and their `%` sizes resolve against
  `basis = √(W·H)` — labelled "% of artboard size" — so strokes keep their
  ratio to the cells. Old saves migrate once behind an `area: 1` flag.
- Exceptions: output sizes (`gif px`, embed CSS-px cell) and time.
- If a tool ever stored px, migrate old saves and snapshots once on load
  (`rel: 1` flag, px ÷ width × 100) — see `ArrowMaze.migrate`.

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

## Responsive embed (p5) — arrow-maze is the reference

A tool whose output should live on websites (responsive, smooth motion) moves
its generator into `tools/<slug>.embed.js`, one classic script shared by the
tool page and the exported artefact:

- `layout(p, W, H, env) → scene`: the pure generator for any box. It returns
  the static SVG (`scene.svg`, still the SVG export) plus plain geometry.
- `drawScene(ctx, scene, t)`: Canvas 2D painter for any instant, which also
  drives PNG/GIF.
- `<slug>` custom element: p5 instance mode owns the canvas, pixel density
  and loop; attributes `fit` / `playback` / `cell`; idles when nothing moves.
- DEFS live in the embed file (`<Tool>.DEFS`), so the embed has defaults.
- The tool previews with the element (`fit="contain"`, `regenerate` for the
  responsive preview) and adds an **Embed** export. The responsive preview
  works like Safari's responsive design mode: the element sits in a box of
  `vw × vh` CSS px at 1:1 (zoom.js `fixed`), and the same resize handles
  drag that box instead of the artboard. No SMIL in these tools:
  the SVG export is the static picture. Keep the static SVG byte-stable when
  refactoring the generator — diff it against the old output.

## Export + review

- Wire `wireExport({SVG, PNG, GIF})`; GIF via `rasterise`/`encodeGIF` over one
  motion cycle, with `gif fps` / `gif px` sliders in an export group.
- Filenames: `<slug>-<seed>.<ext>`.
- Before calling it done: serve locally (`python3 -m http.server`), open in
  Chrome, screenshot the result, and check the console — never judge only
  from code. Kill the server and close the tab afterwards.
