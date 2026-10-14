# Spielwerk

Spielwerk is a desktop workspace for parametric artwork, with a Svelte UI and
Rust/WebAssembly computation. Choose a tool, edit its parameters, preview the
result, and export it from one control column.

The current app delivers Arrow Maze, Arrow Poster, Arrow Comb, Arrow Field,
Switchboard, Truchet Tiles, Imprint, and Stripe Marquee, including website
embed packages. Logo Extruder and Font Remixer remain pending; their catalog
entries show an unavailable message. This is not ten-tool completion. Final
integration remains with `fn-1-spielwerk-shared-design-workspace.1`.

## Run the current app

Use Node `^22.12.0 || >=24.0.0`, npm, and rustup. The test hosts also need
Python 3. Install the dependencies and pinned engine tools, then start Vite:

```sh
npm ci
npx playwright install chromium
npm run setup:engine
npm run dev
```

Open the printed local URL. The root page is the workspace; `/#arrow-maze`
opens Arrow Maze directly. The **Link to** action preserves the selected tool
in the URL. An unknown tool hash falls back to Arrow Maze.

To build and inspect the static app locally:

```sh
npm run build
npm run preview
```

Serve or publish `dist/` on an HTTP static host, including under a subdirectory.
The app needs no backend, but it cannot load through `file://`. Serve `.wasm`
assets as `application/wasm`, and permit WebAssembly in the host's CSP. Serving
this repository's source root alone does not build the Svelte app.

## Choose, edit, preview, and export

The header contains one **Tool** selector, the tool name, and its short purpose.
The preview sits beside a scrollable **Design controls** column.

1. Select a delivered tool. Open its parameter groups and adjust a slider or
   exact numeric field. **Reset** restores that parameter's default.
2. Open **Artboard** for dimensions and, where supported, fixed or responsive
   layout. **Zoom** and **Reset pan** affect the view, not exported artwork.
3. Read the preview status. Edits request full-detail updates during interaction.
   While updating or after failure, the status identifies any previous artwork
   still displayed. A successful current render clears that indication.
4. Choose a supported **Output format** in **Artwork export**, then select
   **Export artwork**. The existing first supported format is the default until
   you change it. Unsupported formats aren't offered; the action is disabled
   while export is busy. Progress and errors appear below it.

Export captures a copy of the current settings, selected artboard dimensions,
assets, and playback time when you activate it. If the preview is updating or
has failed, export uses those current inputs rather than the older displayed
artwork. The export panel explains this when preview and settings differ.

Browser download is the default destination. **Download started** confirms
initiation, not a filesystem save. Where the browser supports it, **Choose
export folder** selects a session-only destination shared across tools.
Cancelling keeps the previous destination. A failed folder write falls back
to browser download and leaves a warning; a completed folder write reports
**Saved … to …**.

For **Website embed (ZIP)**, extract the ZIP and serve its demo or copy its
website snippet. Keep the included runtime, Wasm, and fonts together. These
current-app packages are separate from the legacy p5 embed described below.

## Snapshots and typefaces

Scroll below export to reach the remaining controls. Open **Snapshots** to
save, load, delete, import, or export snapshots. **Typefaces** stays outside
that disclosure, with a primary upload and an accent upload where supported.
You don't need to open snapshot management to upload or clear a typeface.

On a plain static host, snapshots use browser-local IndexedDB. Export snapshot
JSON to transfer it. The optional `serve.py` snapshot service described below
stores files separately; it is not required to run the built app.

## Focused workspace checks

After building, these browser checks cover controls, export, and storage:

```sh
npm run build
npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts
```

See the [engine guide](src/engine/README.md) for the internal Rust/Wasm probe
and the [authoring guide](CLAUDE.md) for the native-control decision and
ownership boundaries. These focused checks do not complete the separate
final ten-tool integration gate.

## Retained legacy tools

The single-file pages in `tools/` remain available independently of the built
workspace. They keep their inline styles and shared JavaScript helpers. For
example, run `python3 serve.py` and open
`http://localhost:8765/tools/arrow-maze.html` directly. The default port is 8765.
This server also persists snapshots as JSON in
`~/Documents/spielwerk-snapshots/`, one file per tool, shared across browsers
and origins. Without that service, legacy snapshots fall back to per-origin
IndexedDB.

For legacy authoring, copy the closest `tools/<slug>.html` page. Keep the
`<meta name="viewport">` and `<link rel="stylesheet" href="mobile.css">`
pair after the inline `<style>`, plus `<script src="mobile.js">` with the
other scripts. That layout assumes `#panel` > `h1`, `#stage`, and `#viewbox`;
tapping the heading opens its phone control sheet. The root `index.html` is
now the Svelte entrypoint and no longer contains a legacy tool manifest.

### Legacy Arrow Maze website embed

The legacy Arrow Maze page exports **Embed**, a demo page with a snippet and
`arrow-maze.embed.js`, the runtime used by that legacy page:

```html
<script src="arrow-maze.embed.js" defer></script>
<arrow-maze fit="regenerate" playback="loop" style="height: 100vh">
  <script type="application/json">{"params": {…}, "fonts": {…}}</script>
</arrow-maze>
```

The element fills its box; without a height, it keeps the artboard proportions.
Attributes include `fit` (`regenerate`, `contain`, `cover`, or `fixed`),
`playback` (`loop`, `once`, `in-view`, or `static`), `cell` (px),
`pause-offscreen="false"`, `reduced-motion="ignore"`, `src` (a config JSON URL
instead of inline JSON), and `p5-src`. `regenerate` lays out the maze for the
box at a fixed cell size. It loads p5 2.x from jsDelivr unless the page already
has `p5`; self-host `tools/p5.min.js` and set `p5-src` to avoid the CDN. Its JS
API includes `el.config = {…}`, `play()`, `pause()`, `restart()`, and `seek(sec)`.
