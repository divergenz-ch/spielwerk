# Rust/browser boundary

The internal probe proves a Svelte caller can evaluate real Rust/Wasm. The
current workspace also registers eight real generators in
`src/tools/registry.ts`: Arrow Maze, Arrow Poster, Arrow Comb, Arrow Field,
Switchboard, Truchet Tiles, Imprint, and Stripe Marquee. `src/main.ts` merges
these ready registrations with `src/workspace/registry.ts` metadata. Logo
Extruder and Font Remixer still have null adapters and unavailable catalog
entries. The eight generators include artwork handlers and website packages;
the probe's rectangles are a separate boundary fixture.

See the [workspace workflow](../../README.md) for choosing, editing, previewing,
and exporting, and the [control decision](../../CLAUDE.md#control-library-decision)
for the tested native-control selection. Final ten-tool integration remains
with `fn-1-spielwerk-shared-design-workspace.1`.

## Build and inspect the proof

Use Node as specified in `package.json`, npm, rustup, and Python 3. Install the
pinned Rust compiler, target, and binding CLI before building:

```sh
npm ci
npx playwright install chromium
npm run setup:engine
npm run test:engine
npm run dev
```

Open `/src/engine/probe.html` on the printed Vite URL. For static hosting, run
`npm run build` and serve `dist/` with any HTTP static server. The same proof
page works under a hosting subdirectory. The Wasm binary is a separate emitted
asset with an `application/wasm` response; no application backend is required.
`file://` loading is not supported. A host's CSP must permit WebAssembly.

`test:engine` builds both entries, runs three native Rust tests, and exercises
the Svelte proof through Chromium on Vite, static root, and static subdirectory
hosts. It also checks that blocking the Wasm asset prevents computation.
`test:integration` currently exercises the eight generators' downloaded
website packages in `tests/integration/generators.spec.ts`. That coverage does
not complete the pending extrusion/font work or the final ten-tool gate.

Rust 1.98.0, wasm-bindgen 0.2.129, serde 1.0.229, serde_json 1.0.154, and
`ttf-parser` 0.25.1 are pinned. Cargo.lock locks transitive dependencies.
The build checks the binding CLI version and uses `--locked`. The crate-local
rust-toolchain.toml pins compilation; `test:rust` explicitly uses that version.
Generated glue (`pkg/`), Cargo targets, and `dist/` remain ignored.

## State ownership and adapter contract

`contracts.ts` defines the handoff. Keep these responsibilities separate:

- `DesignState`: tool ID, settings, unsigned 32-bit seed, artboard mode and
  selected dimensions, and assets. The tool owns its settings; storage and
  compatibility remain with the storage task.
- `ViewState`: zoom, pan, and expanded control groups. Never send it to Rust
  or include it in an artwork export or design snapshot.
- `EvaluationInput`: design plus finite, nonnegative `timeSeconds` measured
  from the playback origin. Rust owns random draws, geometry, responsive
  layout, and animation evaluation. Do not use a wall clock or browser frame
  count inside calculations.
- `Asset`: stable ID, role, media type, and original binary bytes. The browser
  loads files; Rust receives applicable bytes for computation. Typefaces and
  accent typefaces are distinct from images and stamps. The storage task owns
  snapshot inclusion rules; this boundary doesn't persist anything.
- `ToolAdapter`: actual defaults, grouped controls, per-axis dimension limits,
  fixed/responsive capability, motion capability, format limits, and an async
  Rust evaluation call. Pending metadata deliberately doesn't invent tool
  limits or provide a placeholder evaluator.
- `Frame<Scene>`: evaluated dimensions, explicit time, cycle duration in
  seconds (zero for still artwork), and engine-produced scene data.
  `Renderer<Scene, Target>` paints it; rendering must not recompute layout or
  substitute reduced-detail geometry. Browser rasterization may vary.

For a fixed board, send its selected dimensions. For a responsive board,
send the chosen preview container dimensions, not a scaled fixed scene.
Ordinary artwork export evaluates those same dimensions and settings.
Embed playback supplies its containing box and explicit visual time.
Renderer-specific scene types stay generic: this fixture's rectangles are
not a universal representation for font outlines or 3D meshes.

## Sibling handoffs

Each owner supplies a real adapter before changing its registration to ready.
Pending metadata's intended formats remain limits, not available exports.
Delivered registrations and handlers determine the formats shown in the UI.

| Owner | Inputs to Rust | Rust outputs and browser responsibility |
| --- | --- | --- |
| Eight generators (fn-2) | Settings, seed, fixed or responsive dimensions, text/font/asset bytes where applicable, explicit time, and applicable interaction state encoded in settings | Deterministic full-detail 2D geometry and timing in a tool-specific scene; browser paints SVG or Canvas and encodes supported artwork formats. |
| Logo extrusion (fn-3) | Logo bytes, settings, seed, fixed dimensions, material/light inputs, and explicit time | Mesh/slice geometry, materials, lighting, and motion evaluation; browser renders and encodes PNG/GIF. No responsive capability is declared. |
| Font remixing (fn-4) | Static font bytes, settings, fixed dimensions, text, and optional stamp bytes | Transformed outlines, skeleton/stamp geometry, and applicable font-output bytes; browser paints artwork and saves supported font files. No responsive capability is declared. |
| Website runtimes (fn-5) | Generator design/asset inputs, containing dimensions, and explicit playback time | Reuse the applicable fn-2 Rust calculation and scene contract; supply independent visual-only runtimes and embed packaging, not editor UI. |
| Workspace storage/controls/export (fn-1 .4–.6) | Maintain design/view separation; supply controls from actual adapters and validate their declared limits | Call the adapter at selected dimensions/time; render or encode its output. Do not claim pending tool formats as available exports. |

SVG/PNG/GIF are not universal. Truchet Tiles and Imprint have SVG/PNG artwork;
the other six delivered generators also offer GIF. All eight have website
embeds through fn-5. Logo Extruder's intended PNG/GIF and Font Remixer's
intended SVG/PNG and font outputs remain pending with their engines and
renderers. Native SVG is the exercised foundation renderer; the probe does
not establish 3D rendering or font transformation support.

## Binding, rendering, and font-input proof

`client.ts` initializes wasm-bindgen's web-target ES module once and loads the
binary through a Vite asset URL. JSON carries the small fixture request/frame;
`Uint8Array` carries font bytes. There is no JavaScript geometry fallback.
The fixture validates its own bounded dimensions/cell size/time in Rust.
Those bounds are internal proof limits, not limits assigned to named tools.

The fixture creates a cell grid with seeded offsets and a two-second motion
cycle. At 120 × 80 with 40-unit cells it has six rectangles; at 200 × 80 it has
ten, keeping rectangle sizes unchanged. At 0.5 seconds the first x is 2.5;
at 1 second it is 5. Repeated evaluation is equal regardless of prior calls.
Svelte paints the returned rectangle attributes directly with native SVG.

`ttf-parser::Face::parse(bytes, 0)` proves binary font input with units-per-em
and glyph-count output, including a rejected invalid font. The committed
`metrics.ttf` is an authored minimal sfnt metadata test fixture, not a usable
font, third-party font, or proof of glyph transformations. A disposable probe
also parsed a local Arial font through actual Wasm. Font shaping, WOFF decoding,
glyph transformations, and valid font-output encoding are not delivered here.

The implementation checked these current official APIs on October 14, 2026:

- [wasm-bindgen deployment](https://wasm-bindgen.github.io/wasm-bindgen/reference/deployment.html):
  `--target web`, ES-module glue, and explicit initialization.
- [ttf-parser Face](https://docs.rs/ttf-parser/0.25.1/ttf_parser/struct.Face.html):
  borrowed font bytes, face index, required tables, and metrics.
- [SVGElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement):
  native browser SVG rendering without a separate rendering dependency.
