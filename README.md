# spielwerk

Small parametric design tools. Each tool is one self-contained HTML file —
no build, no dependencies, works from `file://` or any static host.

## Adding a tool

1. Drop `your-tool.html` into `tools/`
2. Add one line to the `tools` array in `index.html`
3. Keep the `<meta name="viewport">` + `<link rel="stylesheet" href="mobile.css">`
   pair after the inline `<style>`, and `<script src="mobile.js">` with the
   other scripts — that is the whole phone layout (artboard on top, controls
   in a sheet that opens when the `<h1>` is tapped). It assumes the usual
   `#panel` > `h1` / `#stage` / `#viewbox` structure.

## Embedding a design on a website (arrow-maze)

arrow-maze exports **Embed**: a demo page with a ready-to-paste snippet, plus
`arrow-maze.embed.js` (the same runtime the tool previews with):

```html
<script src="arrow-maze.embed.js" defer></script>
<arrow-maze fit="regenerate" playback="loop" style="height: 100vh">
  <script type="application/json">{"params": {…}, "fonts": {…}}</script>
</arrow-maze>
```

The element fills its box; with no height it keeps the artboard's proportions.
Attributes: `fit` (`regenerate`: re-lays the maze out for the box at a fixed
cell size · `contain` · `cover` · `fixed`), `playback` (`loop` · `once` ·
`in-view` · `static`), `cell` (px), `pause-offscreen="false"`,
`reduced-motion="ignore"`, `src` (config JSON URL instead of the inline one),
`p5-src`. It loads p5 2.x from jsDelivr unless the page already has `p5` —
self-host `tools/p5.min.js` and set `p5-src` to avoid the CDN. JS:
`el.config = {…}`, `play()`, `pause()`, `restart()`, `seek(sec)`.

## Hosting

GitHub Pages, from the repo root of `main`. The index lists tools from
its inline manifest.

## Working locally

Run `python3 serve.py` (port 8765) instead of a plain static server: it
also persists snapshots as JSON files in `~/Documents/spielwerk-snapshots/`,
one file per tool — shared across browsers and origins. Without it,
snapshots fall back to the browser's per-origin IndexedDB.
