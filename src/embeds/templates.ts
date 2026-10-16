import type { DesignState } from '../engine/contracts';
import type { Parameters } from '../workspace/storage';

const escapeAttribute = (value: unknown) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function templates(design: DesignState<Parameters>, assets: { id: string; role: string; mediaType: string; url: string }[]) {
  const config = JSON.stringify({ ...design, assets }).replace(/</g, '\\u003c');
  const p = design.params;
  const attributes = design.toolId === 'arrow-maze'
    ? ` fit="${escapeAttribute(p.efit ?? 'regenerate')}" cell="${escapeAttribute(p.ecell ?? 0)}"` : '';
  const playback = p.eplay && p.eplay !== 'from motion' ? ` playback="${escapeAttribute(p.eplay)}"` : '';
  const { width, height } = design.artboard.dimensions;
  const snippet = `<script type="module" src="./runtime.js"></script>
<spielwerk-artwork${attributes}${playback} style="display:block;width:100%;aspect-ratio:${width}/${height}">
  <script type="application/json">${config}</script>
</spielwerk-artwork>`;
  const demo = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeAttribute(design.toolId)} embed</title><link rel="icon" href="data:,">
<style>body{margin:0}spielwerk-artwork{height:100vh}</style></head>
<body>${snippet}</body></html>`;
  const instructions = `Serve this extracted folder over HTTP (not file://). Open index.html for the demo.
Copy snippet.html into your website. Point its module script src to the runtime.js
in this folder; keep the module script immediately before its artwork element,
and keep assets/, fonts/, and images/ (when present) beside runtime.js.
This preserves separate asset bases
when multiple exported packages share a page. No editor, backend,
CDN, or build tool is needed on your website. Your host CSS controls the artwork
box; without a height it keeps the exported artboard proportions.

The spielwerk-artwork element exposes play(), pause(), restart(), seek(seconds),
and setConfig(design). Its ready promise resolves after the first visual frame
or rejects on initial rendering failure. Listen for spielwerk:error for failures.
Playback: loop, once, in-view, static (omitted: use the design's motion).
Optional attributes: pause-offscreen="false", reduced-motion="ignore".
Arrow Maze only: fit="regenerate|contain|cover|fixed", cell="40" (CSS pixels).
Liquid Gradients requires WebGL2; maximum box size is 4096 pixels per axis,
subject to GPU limits. Keep hardware acceleration enabled.
You can use config-src="config.json" instead of inline application/json;
asset URLs in external configuration resolve relative to that configuration URL.
Visual playback only: no visitor editing, dragging, widget clicks, or attraction.
Uploaded fonts and images are included as original bytes; ensure you have
permission to host them. Liquid Gradients images must be PNG, JPEG, or WebP,
at most 10 MB and 4096 pixels per axis. Transparent pixels reveal the palette.
`;
  return { snippet, demo, instructions };
}
