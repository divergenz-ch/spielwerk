# Spielwerk

Spielwerk is a desktop workspace for parametric artwork, with a Svelte UI,
Rust/WebAssembly computation, and GPU shader rendering. Choose a tool, edit its
parameters, preview the result, and export it from one control column.

The current app delivers Arrow Maze, Arrow Poster, Arrow Comb, Arrow Field,
Switchboard, Truchet Tiles, Imprint, Stripe Marquee, and Liquid Gradients,
including website embed packages. Logo Extruder and Font Remixer remain pending;
their catalog entries show an unavailable message. This is not ten-tool completion. Final
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

Open the printed local URL. Liquid Gradients opens first and starts playing.
Links such as `/#arrow-maze` still open that tool directly. The **Link to**
action preserves the selected tool in the URL. An unknown tool hash falls back
to Liquid Gradients.

To build and inspect the static app locally:

```sh
npm run build
npm run preview
```

Serve or publish `dist/` on an HTTP static host, including under a subdirectory.
The app needs no backend, but it cannot load through `file://`. Serve `.wasm`
assets as `application/wasm`, and permit WebAssembly in the host's CSP. Serving
this repository's source root alone does not build the Svelte app.

## Deploy to Cloudflare

The production app uses Cloudflare Workers Static Assets at
[spielwerk.net](https://spielwerk.net). `wrangler.jsonc` pins the account,
Worker name, and custom domain. Cloudflare manages the domain's DNS and TLS.

After installing the dependencies and engine tools above, authenticate with
an account that can deploy Workers and manage the domain:

```sh
npx wrangler login
npm run deploy:check
npm run deploy
```

Both deployment commands rebuild the app and Wasm. `deploy:check` validates
without uploading; `deploy` publishes `dist/` and attaches `spielwerk.net`.
Only the built app is published, not the source repository or legacy tools.
`public/_headers` adds basic response headers and immutable caching for
hashed assets. Tool links use URL hashes, so missing paths return 404 rather
than the app shell.

This deployment has no snapshot backend. Snapshots, uploaded typefaces, and
images stay in the visitor's browser; export snapshot JSON to transfer them.

## Choose, edit, preview, and export

The header contains one **Tool** selector, the tool name, and its short purpose.
The preview sits beside a scrollable **Design controls** column. Every delivered
animation-capable tool starts playing when opened. Older saved **Motion → none**
settings use the tool's moving default on opening; other saved settings stay
intact. You can pause or turn motion off while editing. Loading a still snapshot
keeps it still. Autoplay respects reduced-motion preferences; **Play** remains
available for explicit playback.

1. Select a delivered tool. Open its Tweakpane parameter folders and adjust a
   slider or exact numeric field. **Reset …** restores that parameter's default.
   Arrow keys step numeric values; Tab reaches each reset button. Color pickers
   expand inline, and text fields keep color-like text as text.
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
website snippet. Keep the included runtime, Wasm, fonts, and images together. These
current-app packages are separate from the legacy p5 embed described below.

## Liquid gradients

Open `/#liquid-gradients` or select **Liquid Gradients** to create standalone
flowing color fields. This tool requires WebGL2; if it's unavailable, the app
reports an error instead of substituting a different renderer.

- Adjust **Scale**, **Distortion**, **Softness**, **Grain %**, and **Seed**.
  Set the four colors under **Palette**. Snapshots retain these settings.
- Animation starts automatically. **Pause** holds the current frame, and
  **Play** restarts it. **Speed** controls the loop duration: 1 is a 24-second
  cycle. **Motion → none** selects a still field.
- Set fixed or responsive dimensions under **Artboard**, up to 4096 pixels
  per axis, subject to GPU limits. Zoom changes the view, not output resolution.
- Export **PNG** for the selected instant or **Website embed (ZIP)** for
  responsive animation. SVG, GIF, and video export aren't offered for shaders.
  Embeds pause offscreen and respect reduced-motion preferences by default.

Rust validates settings and evaluates seeded, periodic shader uniforms. A
persistent WebGL2 canvas shades each frame without recreating its GPU context.
Identical inputs reproduce the image on the same renderer; small pixel
variations across GPUs and browsers are possible. No font upload is needed.

### Use an image

Under **Image**, choose **Upload image** to apply the liquid distortion to a
PNG, JPEG, or WebP. Files must be at most 10 MB and 4096 pixels per axis.
Processing happens in your browser; on the production static site, no image
is sent to a server. Animated sources use their first frame in the shader.

- Adjust **Distortion**, **Scale**, **Seed**, and **Speed** to shape the motion.
  Set **Distortion** and **Grain %** to zero for an unwarped image.
- **Image mix %** blends the image with the gradient: 100 uses the image,
  and 0 shows only the gradient. Transparent pixels reveal the palette.
- **Image fit → cover** fills the artboard with a centered crop. **Contain**
  preserves the whole image, with the gradient behind unused space.
- **Remove** returns to gradients. Images persist across reloads and are
  included in saved snapshots, snapshot JSON, PNG artwork, and website ZIPs.
  Loading an older snapshot without an image clears the current image.

Website packages include the original image in `images/`. Keep that directory
beside `runtime.js`, and only publish images you have permission to use.

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
and the [authoring guide](CLAUDE.md) for the Tweakpane integration and
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
