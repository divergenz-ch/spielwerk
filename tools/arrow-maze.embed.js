// <arrow-maze> — responsive, embeddable runtime for the arrow-maze tool.
// Classic script, no build. Load it after p5 (or let it fetch p5 itself):
//
//   <script src="arrow-maze.embed.js" defer></script>
//   <arrow-maze fit="regenerate" playback="loop">
//     <script type="application/json">{"params": {…}, "fonts": {…}}</script>
//   </arrow-maze>
//
// Three layers, one file:
//   layout(p, W, H, env) → scene   pure: walks, panels, words, geometry + a static SVG
//   drawScene(ctx, scene, t)       paints any instant of a scene on a canvas 2D context
//   <arrow-maze>                   custom element: p5 instance-mode loop, resize, playback
// The tool page (arrow-maze.html) uses the same three, so the preview is the embed.
(function runtime() {
// ---------- parameters ----------
// The tool builds its panel from these; the embed takes its defaults from them.
// A ["", "group", …] row opens a new collapsible section; rows after it land in it.
const DEFS = [
  ["", "group", {label: "arrows"}],
  ["seed",   "range", {min: 1, max: 9999, step: 1, value: 42, hint: "every other setting equal, the same seed gives the same picture"}],
  ["cols",   "range", {min: 2, max: 60, step: 1, value: 14, label: "columns", hint: "grid density: the columns of a square board of the same area — the grid keeps about columns² cells at any aspect, so resizing the artboard keeps the arrow count and scales the arrows with it; fewer columns, bigger arrows"}],
  ["amount", "range", {min: 5, max: 100, step: 5, value: 100, label: "arrow amount %", hint: "share of the grid seeded with arrows — 100 packs it full, every step down removes arrows evenly"}],
  ["length", "range", {min: 1, max: 80, step: 1, value: 14, label: "max length", hint: "cells per arrow, drawn between 3 and this"}],
  ["turn",   "range", {min: 0, max: 100, step: 5, value: 30, label: "bend chance %", hint: "chance to bend at each cell once the straight run is done"}],
  ["run",    "range", {min: 1, max: 6, step: 1, value: 2, label: "min straight", hint: "cells to go straight between bends"}],
  ["dirs",   "select", {options: ["mixed", "orthogonal", "diagonal"], value: "mixed", label: "bend angles", hint: "orthogonal: 90° only — diagonal: 45° only"}],
  ["fork",   "range", {min: 0, max: 100, step: 5, value: 30, label: "fork chance %", hint: "chance an arrow grows a second branch"}],
  ["bleed",  "range", {min: 0, max: 100, step: 5, value: 30, label: "edge bleed %", hint: "chance an arrow on a border cell starts off the edge"}],
  ["headMargin", "range", {min: 0, max: 1.5, step: 0.01, value: 0, label: "head margin %", hint: "% of artboard size — fine inset from the actual outer head contour, inside the global margin — 0 keeps the original head bleed; shafts can still bleed"}],
  ["cross",  "range", {min: 0, max: 100, step: 5, value: 0, label: "cross panels %", hint: "chance an arrow from a paper panel ignores the panel edges — set ring colour to home panel so it keeps a paper gap where it crosses ink"}],
  ["dots",   "range", {min: 0, max: 12, step: 1, value: 1, label: "filler dots", hint: "at most this many discs in holes the arrows left"}],
  ["", "group", {label: "geometry"}],
  ["shaft",  "range", {min: 10, max: 98, step: 1, value: 77, label: "shaft % cell", hint: "the rest of the cell is spacing — contours take their room from the shaft"}],
  ["headW",  "range", {min: 60, max: 400, step: 5, value: 200, label: "head width %", hint: "base width as % of shaft width — match head length for a 90° tip"}],
  ["headL",  "range", {min: 30, max: 400, step: 5, value: 130, label: "head length %", hint: "tip length as % of half the shaft width — match head width for a 90° tip"}],
  ["round",  "range", {min: 0, max: 100, step: 5, value: 50, label: "rounded bends %", hint: "share of bends drawn as arcs instead of sharp corners"}],
  ["radius", "range", {min: 10, max: 100, step: 5, value: 100, label: "bend radius %", hint: "of a cell, for rounded bends"}],
  ["mix",    "select", {options: ["per arrow", "per bend"], value: "per arrow", label: "rounding mix", hint: "decide round or sharp once per arrow, or at every bend"}],
  ["arcs",   "range", {min: 0, max: 100, step: 5, value: 40, label: "wide arcs %", hint: "chance a 90° bend sweeps a quarter circle several cells wide"}],
  ["arcR",   "range", {min: 1, max: 6, step: 1, value: 3, label: "arc radius", hint: "in cells, the widest sweep"}],
  ["uturn",  "range", {min: 0, max: 100, step: 5, value: 0, label: "u-turn %", hint: "chance a straight run ends in a 180° sweep back — hairpins, S- and P-shapes"}],
  ["big",    "range", {min: 0, max: 100, step: 5, value: 0, label: "big arrows %", hint: "chance an arrow draws at the large scale: a wider lane walked in coarser steps"}],
  ["bigk",   "range", {min: 1.5, max: 4, step: 0.5, value: 2, label: "big scale ×", hint: "lane width of the large arrows, in cells of the base grid"}],
  ["vary",   "range", {min: 0, max: 80, step: 5, value: 30, label: "shaft taper %", hint: "how much the shaft thins along alternate runs"}],
  ["", "group", {label: "panels"}],
  ["panels", "range", {min: 1, max: 32, step: 1, value: 4, label: "panel amount", hint: "number of nested panel subdivisions"}],
  ["invert", "range", {min: 0, max: 100, step: 5, value: 40, label: "inverted %", hint: "share of panels drawn paper-on-ink"}],
  ["line",   "range", {min: 0, max: 0.8, step: 0.01, value: 0.17, label: "divider %", hint: "% of artboard size (√ width × height)"}],
  ["", "group", {label: "text"}],
  ["words",  "text",  {value: "", label: "words", hint: "entries split on | — a / inside an entry breaks it into fixed lines"}],
  ["textmin","range", {min: 10, max: 100, step: 5, value: 40, label: "shrink to %", hint: "how small a word may go to find a pocket"}],
  ["tgap",   "range", {min: 0, max: 100, step: 5, value: 15, label: "text gap % cell", hint: "breathing room the arrows keep around the words — 0 lets them almost touch"}],
  ["tblock", "checkbox", {value: true, label: "text clears arrows", hint: "the words claim their ground before the arrows walk — untick and the arrows run beneath, the text simply overlays them (with flip per panel the letters invert against whatever they cross)"}],
  ["weight", "range", {min: 100, max: 900, step: 100, value: 700, label: "weight"}],
  ["aweight","range", {min: 100, max: 900, step: 100, value: 400, label: "accent weight", hint: "weight of words set in the accent face"}],
  ["textcol","select", {options: ["home panel", "flip per panel"], value: "home panel", label: "word colour", hint: "flip per panel: letters invert against the true ground beneath them — panels, arrows and dots alike — like white type under a difference filter"}],
  ["", "group", {label: "layers"}],
  ["", "group", {label: "colour"}],
  ["", "group", {label: "contours"}],
  ["ringcol","select", {options: ["ring masters", "home panel"], value: "ring masters", label: "ring colour", hint: "home panel: rings take the arrow's own panel ground, so they only show where it crosses onto another panel"}],
  ["hollow", "range", {min: 0, max: 100, step: 5, value: 0, label: "hollow %", hint: "chance an arrow is drawn as ground fill with a counter-colour contour — signage-style outline arrows; the arrow colour master then paints their outline, not a fill"}],
  ["cwidth", "range", {min: 0, max: 1, step: 0.01, value: 0.23, label: "arrow contour %", hint: "% of artboard size per ring around the arrows"}],
  ["tcwidth","range", {min: 0, max: 1, step: 0.01, value: 0.23, label: "text contour %", hint: "% of artboard size per ring around the words"}],
  ["steps",  "range", {min: 1, max: 8, step: 1, value: 4, label: "contour rings"}],
  ["cjoin",  "select", {options: ["rounded", "sharp", "beveled"], value: "rounded", label: "contour edges", hint: "corner joins for arrow and text contours — rounded: round joins; sharp: miter joins; beveled: clipped corners"}],
  ["", "group", {label: "motion"}],
  ["motion", "select", {options: ["none", "draw in", "draw loop"], value: "none", label: "motion"}],
  ["speed",  "range", {min: 0.5, max: 20, step: 0.5, value: 3, label: "cycle sec"}],
  ["hold",   "range", {min: 0, max: 90, step: 5, value: 35, label: "hold %", hint: "share of the cycle the finished picture stays"}],
  ["stagger","range", {min: 0, max: 100, step: 5, value: 50, label: "stagger %", hint: "how far apart the arrows start"}],
  ["timing", "select", {options: ["ease out", "linear", "snap"], value: "ease out", label: "timing"}],
  ["", "group", {label: "export"}],
  ["outline","checkbox", {value: true, label: "outline words", hint: "render words as vector paths so the SVG needs no font (Paper, print); needs the faces re-parsed, uploads only"}],
  ["fps",    "range", {min: 5, max: 30, step: 1, value: 20, label: "gif fps"}],
  ["gifpx",  "range", {min: 200, max: 1000, step: 50, value: 600, label: "gif px"}],
  ["efit",   "select", {options: ["regenerate", "contain", "cover"], value: "regenerate", label: "embed resize", hint: "regenerate: the maze re-lays itself out for any box, arrows keep their size — contain / cover: this artboard, scaled"}],
  ["ecell",  "range", {min: 0, max: 200, step: 1, value: 60, label: "embed cell px", hint: "regenerate: grid cell on the website in CSS px — 0 = the artboard's own cell (artboard px = CSS px, huge on a big artboard)"}],
  ["eplay",  "select", {options: ["from motion", "loop", "once", "in-view", "static"], value: "from motion", label: "embed playback", hint: "in-view replays the draw-in whenever it scrolls into view; visitors asking for reduced motion get the still picture"}]
];
const LAYERS = ["paper", "panels", "arrows", "dots", "text"];
const BLENDS = ["normal", "multiply", "screen", "overlay", "difference"];
const FIXED = [["ink", "ink", "#111111"], ["paper", "paper", "#f4f1ea"], ["arrow", "arrow", "#111111"], ["gradA", "inner ring", "#1c1c1c"], ["gradB", "outer ring", "#f5c518"]];
// Every size not counted in grid cells is stored as % of the artboard size
// √(W·H) (margin, head margin, divider, contours) — the same measure the grid
// cell follows, so the whole picture scales with the artboard at any aspect.
// layout() resolves them to px against its basis.
const REL = ["margin", "headMargin", "line", "cwidth", "tcwidth"];
const sizeOf = (w, h) => Math.sqrt(w * h);
const toPx = (v, basis) => +(v * basis / 100).toFixed(4);
// Old configs, converted once, in place: before rel: 1 these sizes were artboard
// px; before area: 1 they were % of the width and cols counted the columns
// across the width — cols becomes the square-equivalent count of the same grid.
const migrate = src => {
  if (!src) return src;
  const w = +src.wpx || 1500, h = +src.hpx || 2000;
  if (!src.rel) {
    for (const k of REL) if (k in src) src[k] = +src[k] / w * 100;
    src.rel = 1;
  }
  if (!src.area) {
    if ("cols" in src) {
      const M = insetMargin(toPx(+src.margin || 0, w), w, h);
      src.cols = +(+src.cols * Math.sqrt((h - 2 * M) / (w - 2 * M))).toFixed(3);
    }
    for (const k of REL) if (k in src) src[k] = +src[k] * w / sizeOf(w, h);   // unrounded: the px stay exact
    src.area = 1;
  }
  return src;
};
// a partial or older config gets every missing key from the defaults
const normalize = src => {
  const p = migrate({wpx: 1500, hpx: 2000, margin: 0, nodes: {}, masters: [], assign: {}, ...src});
  for (const [key, type, opt] of DEFS) if (type !== "group" && !(key in p)) p[key] = opt.value;
  for (const [k, , def] of FIXED) p[k] ??= def;
  p.layers = (p.layers || []).filter(l => LAYERS.includes(l.id));
  for (const id of LAYERS) if (!p.layers.some(l => l.id === id)) p.layers.push({id, on: true, opacity: 100, blend: "normal"});
  return p;
};
const entries = p => p.words.split("|").map(s => s.trim()).filter(Boolean);

// ---------- Lab gradient (same as arrow-poster) ----------
const hex2lab = h => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const xyz = [
    (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047,
    0.2126 * r + 0.7152 * g + 0.0722 * b,
    (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  ].map(v => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
};
const lab2rgb = ([L, A, B]) => {
  const y = (L + 16) / 116, x = y + A / 500, z = y - B / 200;
  const [X, Y, Z] = [x, y, z].map(v => v ** 3 > 0.008856 ? v ** 3 : (v - 16 / 116) / 7.787);
  const lin = [
    3.2406 * X * 0.95047 - 1.5372 * Y - 0.4986 * Z * 1.08883,
    -0.9689 * X * 0.95047 + 1.8758 * Y + 0.0415 * Z * 1.08883,
    0.0557 * X * 0.95047 - 0.204 * Y + 1.057 * Z * 1.08883
  ];
  return "rgb(" + lin.map(c => {
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(255 * s)));
  }).join(",") + ")";
};
const gradient = (a, b) => {
  const la = hex2lab(a), lb = hex2lab(b);
  return t => lab2rgb(la.map((v, i) => v + t * (lb[i] - v)));
};

// Leave a usable grid (100px on the short side, or half a small embed).
// A near-zero grid width would otherwise create thousands of rows on tall boxes.
const marginLimit = (w, h) => { const side = Math.min(w, h); return Math.max(0, (side - Math.min(100, side / 2)) / 2); };
const insetMargin = (m, w, h) => Math.max(0, Math.min(+m || 0, marginLimit(w, h)));
// The grid for a gw × gh box: about cols² square cells whatever the aspect
// (cols counts the columns of a square box of the same area), so resizing keeps
// the arrow count and the cell scales with √(gw·gh). fixed: a cell in px
// instead (the regenerating embed). The leftover is centred.
const gridOf = (cols, gw, gh, fixed = 0) => {
  const a = Math.sqrt(gw / gh);
  const nc = Math.max(2, Math.round(fixed ? gw / fixed : cols * a)), nr = Math.max(2, Math.round(fixed ? gh / fixed : cols / a));
  return {cols: nc, rows: nr, cell: Math.min(gw / nc, gh / nr)};
};
const headShape = (halfShaft, halfHead, length) => {
  const tab = +Math.min(halfShaft, halfHead).toFixed(2);
  return [[0, halfHead], [length, 0], [0, -halfHead], [-0.5, -tab], [-0.5, tab]];
};
// "sharp" contours keep their points: arrow-head wings are often narrower than
// the 29° that SVG/Canvas's default miter limit 4 allows, and would be bevelled.
// 20 keeps corners down to ~6° pointed. Canvas, SVG and the bounds share it.
const MITER = 20;
const miterAttr = join => join === "miter" ? ` stroke-miterlimit="${MITER}"` : "";
// Bounds of the actual closed head contour, using the contours' miter limit.
// Round joins expand the fill bbox by the radius; bevel/miter use edge offsets
// and only the outward corner intersections, not a blanket 4× padding.
const strokeBounds = (P, width, join) => {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  if (!width) return box;
  if (join === "round") return [box[0] - width, box[1] - width, box[2] + width, box[3] + width];
  const add = (x, y) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); };
  const normals = P.map(([x, y], i) => {
    const b = P[(i + 1) % P.length], dx = b[0] - x, dy = b[1] - y, length = Math.hypot(dx, dy);
    const n = [-dy / length, dx / length];
    for (const p of [P[i], b]) for (const sign of [-1, 1]) add(p[0] + sign * width * n[0], p[1] + sign * width * n[1]);
    return n;
  });
  if (join === "miter") P.forEach(([x, y], i) => {
    const a = normals[(i + P.length - 1) % P.length], b = normals[i], den = 1 + a[0] * b[0] + a[1] * b[1];
    if (den < 1e-9) return;
    const dx = (a[0] + b[0]) / den, dy = (a[1] + b[1]) / den;
    // headShape is clockwise; its left normals point outwards.
    if (Math.hypot(dx, dy) <= MITER) add(x + width * dx, y + width * dy);
  });
  return box;
};

// ---------- generator ----------
// Arrows are self-avoiding walks on a cell grid; occupancy lives on a finer
// subcell grid where each shaft lane, head triangle and arc claims what it
// covers plus half a gap, so nothing can ever overlap or touch. Panels are a
// guillotine split of the grid; a walk never leaves its panel.
// W × H is whatever box the design has to fill — the tool's artboard or an
// embed's container. The scene carries the finished static SVG plus the
// geometry drawScene() needs to paint any instant of the draw-in.
// env: {ctx: a 2D context to measure words, fonts: {main, accent: {family,
// dataURL}}, OT: {main, accent} opentype faces for outlined SVG words}
const measureCtx = () => measureCtx.c ??= Object.assign(document.createElement("canvas").getContext("2d"), {textBaseline: "middle"});
// env.basis: the size the relative sizes resolve against — √(W·H) unless a
// regenerating embed lays the design out at another scale; env.cell: a fixed
// grid cell in px instead of the cols density (that embed again)
function layout(src, W, H, env = {}) {
  const p = normalize(src), basis = env.basis ?? sizeOf(W, H);
  for (const k of REL) p[k] = toPx(p[k], basis);
  const contourJoin = {rounded: "round", sharp: "miter", beveled: "bevel"}[p.cjoin] || "round";
  const ctx = env.ctx || measureCtx();                 // measures words in the live face
  const userFont = {font: env.fonts?.main || {}}, accentFont = {font: env.fonts?.accent || {}};
  const OT = env.OT || {};
  const masterColor = id => FIXED.some(f => f[0] === id) ? p[id] : p.masters.find(m => m.id === id)?.color;
  const colorOf = (key, auto) => masterColor(p.assign[key]) ?? auto;
  const mulberry = s => {
    const next = () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.clone = () => mulberry(s);                    // preview a head's rings without consuming draws on failed walks
    return next;
  };
  const rnd = mulberry(p.seed), rnd3 = mulberry(p.seed * 97 + 13), rnd4 = mulberry(p.seed * 131 + 19),
        rnd5 = mulberry(p.seed * 167 + 23),            // contour widths only, so the other streams stay put
        rnd6 = mulberry(p.seed * 193 + 29),            // panel crossing only
        rnd7 = mulberry(p.seed * 229 + 37),            // hollow arrows only
        rnd8 = mulberry(p.seed * 251 + 41);            // big-arrow scale only
  const g = gradient(p.gradA, p.gradB);
  const pal = Array.from({length: p.steps}, (_, i) => g(p.steps === 1 ? 0.5 : i / (p.steps - 1)));
  const f = n => +n.toFixed(2), f3 = n => +n.toFixed(3);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // motion timing: drawScene() evaluates progress() per arrow and frame
  const moving = p.motion !== "none", loop = p.motion === "draw loop";
  const m = Math.max(0.05, 1 - p.hold / 100);    // reveal ends at m of the cycle
  const T = loop ? p.speed : p.speed * (1 + p.stagger / 100 + (p.fork ? m : 0));   // forks start late, so draw-in runs longer

  // ---- grid + panels
  const M = insetMargin(p.margin, W, H), gw = W - 2 * M, gh = H - 2 * M;   // foreground only; backgrounds stay full-bleed
  const {cols, rows, cell} = gridOf(p.cols, gw, gh, env.cell);
  const ox = M + (gw - cols * cell) / 2, oy = M + (gh - rows * cell) / 2;   // foreground grid is centred within its inset
  // Guillotine subdivisions preserve the irregular, nested panel structure.
  // Always split the largest eligible panel so the amount reaches its target
  // instead of stopping early once panels become smaller than six cells.
  const panels = [{x0: 0, y0: 0, x1: cols, y1: rows}];
  for (let k = 1; k < p.panels; k++) {
    const eligible = panels.filter(q => q.x1 - q.x0 > 1 || q.y1 - q.y0 > 1);
    if (!eligible.length) break;                       // every panel is one grid cell
    const q = eligible.reduce((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) > (a.x1 - a.x0) * (a.y1 - a.y0) ? b : a);
    const w = q.x1 - q.x0, h = q.y1 - q.y0;
    const vert = w <= 1 ? false : h <= 1 ? true : w === h ? rnd() < 0.5 : w > h;
    const span = vert ? w : h;
    const cut = Math.max(1, Math.min(span - 1, Math.round(span * (0.3 + rnd() * 0.4))));
    const r = {...q};
    if (vert) { q.x1 = q.x0 + cut; r.x0 = q.x1; } else { q.y1 = q.y0 + cut; r.y0 = q.y1; }
    panels.push(r);
  }
  for (const q of panels) q.inv = rnd() < p.invert / 100;
  const N = cols * rows;
  const pid = new Uint8Array(N);                       // panel per cell
  panels.forEach((q, i) => { for (let y = q.y0; y < q.y1; y++) for (let x = q.x0; x < q.x1; x++) pid[y * cols + x] = i; });
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const starts = shuffle(Array.from({length: N}, (_, i) => i));

  // ---- fine occupancy: SUB×SUB subcells per cell, in cell units (cell centres on the
  // integers). Every shape claims what it covers plus half the lane gap, so any
  // two shapes end up a full gap apart: a shaft lane is exactly one cell wide,
  // heads and arcs take just the subcells they need. Sampling on centres can
  // miss a sliver thinner than a subcell, so the head claims one subcell more
  // than the gap: its distance to anything is then never under the lane gap.
  const SUB = 8, fw = cols * SUB, fh = rows * SUB;
  // fid: owner arrow id (>= 0), FREE, or a negative sentinel that no arrow id can match
  const FREE = -1, WORD = -2, DOT = -3;
  const fid = new Int32Array(fw * fh).fill(FREE), fst = new Uint8Array(fw * fh);   // owner arrow, its step
  // a lane is one cell = shaft + spacing; everything else scales off the shaft.
  // Contours come out of the shaft: the ink core thins by the contour budget
  // and the rings grow back into that room, so the spacing stays what it was
  const ctot = p.cwidth * p.steps / cell;                // contour budget, cell units
  const sc = Math.max(0.04, p.shaft / 200 - ctot), hg = 0.5 - sc, hm = hg + 1 / SUB;   // shaft half-width, half gap, head margin
  // Equal controls mean length = half the base width: an isosceles 90° tip.
  const hw = p.headW / 100 * sc, hl = p.headL / 100 * sc, r0c = p.radius / 100;
  const subs = (x0, y0, x1, y1, test) => {              // subcells in a bbox whose centre passes test
    const out = [];
    const i0 = Math.max(0, Math.floor((x0 + 0.5) * SUB)), i1 = Math.min(fw - 1, Math.ceil((x1 + 0.5) * SUB));
    const j0 = Math.max(0, Math.floor((y0 + 0.5) * SUB)), j1 = Math.min(fh - 1, Math.ceil((y1 + 0.5) * SUB));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++)
      if (test((i + 0.5) / SUB - 0.5, (j + 0.5) / SUB - 0.5)) out.push(j * fw + i);
    return out;
  };
  const panelOf = k => pid[((k / fw | 0) / SUB | 0) * cols + ((k % fw) / SUB | 0)];
  const clear = (list, qi, ok) => list.every(k => (qi < 0 || panelOf(k) === qi) && (fid[k] === -1 || ok(k)));
  const unit0 = ([x, y]) => { const l = Math.hypot(x, y); return [x / l, y / l]; };
  const dSeg = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  };
  const rect = (a, b, ca, cb, half = 0.5) => {          // a lane a→b, 2·half wide, caps ca behind / cb ahead
    const [ux, uy] = unit0([b[0] - a[0], b[1] - a[1]]), L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = half + Math.max(ca, cb);
    return subs(Math.min(a[0], b[0]) - m, Math.min(a[1], b[1]) - m, Math.max(a[0], b[0]) + m, Math.max(a[1], b[1]) + m, (x, y) => {
      const px = x - a[0], py = y - a[1], al = px * ux + py * uy;
      return al >= -ca && al <= L + cb && Math.abs(py * ux - px * uy) <= half;
    });
  };
  const tri = (P, m) => {                               // triangle P grown by m
    const inside = (x, y) => { let sgn = 0; for (let i = 0; i < 3; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % 3]; sgn |= (bx - ax) * (y - ay) - (by - ay) * (x - ax) > 0 ? 1 : 2; } return sgn !== 3; };
    const xs = P.map(v => v[0]), ys = P.map(v => v[1]);
    return subs(Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m, (x, y) =>
      inside(x, y) || P.some((a, i) => dSeg(x, y, a[0], a[1], P[(i + 1) % 3][0], P[(i + 1) % 3][1]) <= m));
  };
  const disc = ([cx, cy], R) => subs(cx - R, cy - R, cx + R, cy + R, (x, y) => Math.hypot(x - cx, y - cy) <= R);
  const annulus = (V, u1, u2, r, th, half = 0.5) => {   // a round bend's arc band: its inner edge can leave the lanes
    const sg = Math.sign(u1[0] * u2[1] - u1[1] * u2[0]), t = r * Math.tan(th / 2);
    const cx = V[0] - u1[0] * t - u1[1] * sg * r, cy = V[1] - u1[1] * t + u1[0] * sg * r;
    const mx = V[0] - cx, my = V[1] - cy, ml = Math.hypot(mx, my), cs = Math.cos(th / 2);
    return subs(cx - r - half, cy - r - half, cx + r + half, cy + r + half, (x, y) => {
      const dx = x - cx, dy = y - cy, dd = Math.hypot(dx, dy);
      return Math.abs(dd - r) <= half && dx * mx + dy * my >= cs * dd * ml;
    });
  };

  // ---- self-avoiding walks
  // ponytail: greedy first-fit from shuffled starts, no backtracking beyond the head — fine up to ~40×60 cells
  const D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const turns = p.dirs === "orthogonal" ? [2, -2] : p.dirs === "diagonal" ? [1, -1] : [1, -1, 2, -2];
  const arrows = [];
  // fork: {id, k} — a branch leaving arrow id at its cell k; its first two steps
  // may share that arrow's claims for the steps into and out of the fork cell,
  // nothing else. bleed: the tail sits on a border cell and runs off the edge.
  const grid = {x0: 0, y0: 0, x1: cols, y1: rows};
  // Peek the same ring widths the renderer will use, then commit only on a
  // successful walk. No worst-case padding, and zero-margin output stays stable.
  const arrowStyle = (fork, r5 = rnd5.clone(), r7 = rnd7.clone()) => {
    const hv = r7() < p.hollow / 100;
    const hollow = fork ? arrows[fork.id].hollow : hv;
    if (fork) return {hollow, ringWidths: arrows[fork.id].ringWidths};
    const cw = hollow ? Math.max(p.cwidth, 2) : p.cwidth;
    let acc = 0;
    const widths = cw ? pal.map(() => acc += cw * (0.4 + r5() * 1.2)) : [];
    const cap = Math.min(1, cw * p.steps / (acc || 1));
    return {hollow, ringWidths: widths.map(w => w * cap).reverse()};
  };
  const walk = (s, d, id, q, {fork = null, bleed = false, cross = false, scale = 1} = {}) => {   // one attempt from cell s heading d; claims subcells on success
    const qi = cross ? -1 : panels.indexOf(q), B = cross ? grid : q;   // a crossing arrow keeps q as its home for colour, roams the whole grid
    // scale > 1: the arrow walks the same grid in steps of `scale` cells and every
    // claim, cap and head grows by the same factor — a big arrow among small ones
    const K = scale, hmK = hg * K + 1 / SUB, hwK = hw * K, hlK = hl * K, eK = (K - 1) / 2;
    const ringWidth = arrowStyle(fork).ringWidths[0] || 0;
    const localHead = headShape(sc * K * cell, hwK * cell, hlK * cell);
    const own = (j, k) => (fid[j] === id && fst[j] >= k - 2)
      || (fork && k <= 2 && fid[j] === fork.id && (fst[j] === fork.k || fst[j] === fork.k + 1));
    const cells = [[s % cols, s / cols | 0]], bends = [], arcs = [], dirs = [d], claimed = [];   // arcs[k]: radius of step k if it sweeps
    const want = p.length < 3 ? p.length : 3 + Math.floor(rnd() * (p.length - 2));
    const arrowRound = rnd3() < p.round / 100;           // this arrow's corners, when mixing per arrow
    const dip = p.vary / 100 * (0.5 + 0.5 * rnd3());    // how far the shaft thins mid-way: thick tail, thin middle, thick at the head
    let run = 0, lastV = 0;                              // cells since the last bend; index of the last bend
    const claim = (list, k) => {                        // remember what was free vs shared with our own earlier step
      const fresh = [], shared = [];
      for (const j of list) {                           // a parent's subcells at a fork stay the parent's
        if (fid[j] === -1) { fresh.push(j); fid[j] = id; fst[j] = k; }
        else if (fid[j] === id) { shared.push(j); fst[j] = k; }
      }
      claimed.push({fresh, shared, k});
    };
    const release = () => { const {fresh, shared, k} = claimed.pop(); for (const j of fresh) fid[j] = -1; for (const j of shared) fst[j] = k - 1; };
    const inPanel = (x, y) => x >= B.x0 + eK && x <= B.x1 - 1 - eK && y >= B.y0 + eK && y <= B.y1 - 1 - eK;
    if (K > 1 && !fork && !bleed && !inPanel(cells[0][0], cells[0][1])) return false;   // a wide tail needs its whole lane inside
    const step = t => {                                 // try a step turning by t (45° units)
      const [x, y] = cells[cells.length - 1], nd = (d + t + 8) % 8, [dx, dy] = D[nd], nx = x + dx * K, ny = y + dy * K;
      const k = cells.length;
      // a branch's first step must leave the parent's axis, or the tail mitre is undefined
      if (fork && k === 1 && ((nd - arrows[fork.id].dirs[fork.k] + 8) & 3) === 0) return false;
      // a 90° turn may sweep: a quarter circle of n cells radius, vertex n cells
      // ahead, landing n cells along the new heading — on the grid for axis and
      // diagonal headings alike (radius n√2 for the latter)
      if (Math.abs(t) === 2 && rnd() < p.arcs / 100) {
        const n = (1 + Math.floor(rnd() * p.arcR)) * K, [ax, ay] = D[d], vx = x + ax * n, vy = y + ay * n, bx = vx + dx * n, by = vy + dy * n;
        const R = n * Math.hypot(ax, ay);
        if (inPanel(bx, by) && inPanel(vx, vy)) {
          const u1 = unit0(D[d]), u2 = unit0(D[nd]);
          const list = annulus([vx, vy], u1, u2, R, Math.PI / 2, 0.5 * K);
          if (clear(list, qi, j => own(j, k))) {
            claim(list, k); cells.push([bx, by]); dirs.push(nd);
            arcs[k] = {r: R, th: Math.PI / 2, sg: Math.sign(u1[0] * u2[1] - u1[1] * u2[0])};
            bends[k - 1] = false;
            lastV = k; run = 2; d = nd;
            return true;
          }
        }
      }
      if (!inPanel(nx, ny)) return false;
      const bendRound = rnd3() < p.round / 100;         // one draw per bend, mixing or not
      const round = t !== 0 && (p.mix === "per arrow" ? arrowRound : bendRound);
      let list = rect([x, y], [nx, ny], (k === 1 && !fork && !bleed ? hg : 0.5) * K, 0.5 * K, 0.5 * K);   // a fork or bleed tail is buried, no gap behind it
      if (round && r0c > 0) {                            // biggest radius this bend can get; render may shrink it
        const th = Math.abs(t) * Math.PI / 4, prev = Math.hypot(x - cells[lastV][0], y - cells[lastV][1]);
        list = list.concat(annulus([x, y], unit0(D[d]), unit0(D[nd]), Math.min(r0c * K, prev / 2 / Math.tan(th / 2)), th, 0.5 * K));
      }
      // our own last two steps may share the corner region, nothing else
      if (!clear(list, qi, j => own(j, k))) return false;
      claim(list, k); cells.push([nx, ny]); dirs.push(nd); bends[k - 1] = round;
      if (t) lastV = k - 1;
      run = t ? 1 : run + 1; d = nd;
      return true;
    };
    // u-turn: a 180° sweep back — the two legs run 2r apart, the tightest radius
    // hairpin-close; radius in half-lane steps up to the arc radius
    const ustep = () => {
      const [x, y] = cells[cells.length - 1], k = cells.length;
      const [ux, uy] = unit0(D[d]);
      const r = K * 0.5 * (1 + Math.floor(rnd() * p.arcR));
      const sg = rnd() < 0.5 ? 1 : -1;
      const cx = x - uy * sg * r, cy = y + ux * sg * r;
      const bx = x - uy * sg * 2 * r, by = y + ux * sg * 2 * r;
      const nd = (d + 4) % 8;
      if (!inPanel(bx, by)) return false;
      const list = subs(cx - r - 0.5 * K, cy - r - 0.5 * K, cx + r + 0.5 * K, cy + r + 0.5 * K, (px, py) => {
        const dx = px - cx, dy = py - cy;
        return Math.abs(Math.hypot(dx, dy) - r) <= 0.5 * K && dx * ux + dy * uy >= -1e-9;
      });
      if (!clear(list, qi, j => own(j, k))) return false;
      claim(list, k); cells.push([bx, by]); dirs.push(nd);
      arcs[k] = {r, th: Math.PI, sg}; bends[k - 1] = false;
      lastV = k; run = 0; d = nd;
      return true;
    };
    // Fit the actual stroked head along the last step, at subpixel precision.
    // Moving it back also shortens the shaft; rejecting an entire grid cell
    // would turn a 0.1px margin into a visibly huge jump.
    const head = () => {
      const k = cells.length - 1;
      if (!k) return null;
      const end = cells[k], start = cells[k - 1], ao = arcs[k];
      const u = unit0(D[dirs[k]]), u0 = unit0(D[dirs[k - 1]]);
      const pose = t => {
        if (!ao) return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, u[0], u[1]];
        const a = ao.sg * ao.th * t, co = Math.cos(a), si = Math.sin(a);
        const tx = u0[0] * co - u0[1] * si, ty = u0[0] * si + u0[1] * co;
        return [start[0] + ao.sg * ao.r * (ty - u0[1]), start[1] - ao.sg * ao.r * (tx - u0[0]), tx, ty];
      };
      const points = t => {
        const [x, y, ux, uy] = pose(t);
        return localHead.map(([hx, hy]) => [ox + (x + 0.5) * cell + hx * ux - hy * uy, oy + (y + 0.5) * cell + hx * uy + hy * ux]);
      };
      let t = 1;
      if (M > 0 || p.headMargin > 0) {
        const inset = M + p.headMargin + 0.01;         // only SVG's coordinate-rounding tolerance
        const box = t => strokeBounds(points(t), ringWidth, contourJoin);
        const fits = b => b[0] >= inset && b[1] >= inset && b[2] <= W - inset && b[3] <= H - inset;
        if (!fits(box(1))) {
          if (!ao) {
            const b = box(0), delta = [(end[0] - start[0]) * cell, (end[1] - start[1]) * cell];
            let lo = 0, hi = 1;
            for (let axis = 0; axis < 2; axis++) {
              const d = delta[axis], lower = inset - b[axis], upper = (axis ? H : W) - inset - b[axis + 2];
              if (Math.abs(d) < 1e-9) { if (lower > 0 || upper < 0) return null; }
              else { lo = Math.max(lo, Math.min(lower / d, upper / d)); hi = Math.min(hi, Math.max(lower / d, upper / d)); }
            }
            if (hi < lo || hi < 1e-4) return null;
            t = hi;
          } else {
            // Arc headings rotate with the head. Find the last fitting interval
            // then bisect it, rather than snapping the head to an arc station.
            let hi = 1, lo = null;
            for (let j = 1; j <= 128; j++) {
              const at = 1 - j / 128;
              if (fits(box(at))) { lo = at; break; }
              hi = at;
            }
            if (lo === null) return null;
            for (let j = 0; j < 24; j++) { const at = (lo + hi) / 2; if (fits(box(at))) lo = at; else hi = at; }
            t = lo;
            if (t < 1e-4) return null;
          }
        }
      }
      const P = points(t).slice(0, 3).map(([x, y]) => [(x - ox) / cell - 0.5, (y - oy) / cell - 0.5]);
      if (M === 0 && p.headMargin === 0) {             // preserve the original full-bleed baseline
        const [tx, ty] = P[1];
        if (tx < -0.5 || tx > cols - 0.5 || ty < -0.5 || ty > rows - 0.5) return null;
      }
      const list = tri(P, hmK);
      // Of its own arrow the head may share only the last step's claim, and of
      // that only its lane around the head (within half a lane of the final
      // heading line) or what lies off every earlier step's lane. A u-turn, wide
      // arc or round corner claims its whole band, which reaches the incoming
      // leg — sharing that would fuse the head into its own shaft.
      const [px, py, hx, hy] = pose(t);
      const at = (i, s) => {                            // centreline of step i at fraction s
        const a = arcs[i], [x0, y0] = cells[i - 1];
        if (!a) return [x0 + (cells[i][0] - x0) * s, y0 + (cells[i][1] - y0) * s];
        const [vx, vy] = unit0(D[dirs[i - 1]]), g = a.sg * a.th * s, co = Math.cos(g), si = Math.sin(g);
        return [x0 + a.sg * a.r * (vx * si + vy * co - vy), y0 - a.sg * a.r * (vx * co - vy * si - vx)];
      };
      const mine = j => {
        const x = ((j % fw) + 0.5) / SUB - 0.5, y = ((j / fw | 0) + 0.5) / SUB - 0.5;
        if (Math.abs((x - px) * hy - (y - py) * hx) <= 0.5 * K + 1e-9) return true;
        for (let i = 1; i < k; i++) for (let m = 0, n = arcs[i] ? 16 : 1, a = at(i, 0); m < n; m++) {
          const b = at(i, (m + 1) / n);
          if (dSeg(x, y, a[0], a[1], b[0], b[1]) <= 0.5 * K) return false;
          a = b;
        }
        return true;
      };
      return clear(list, qi, j => fid[j] === id ? fst[j] === k && mine(j) : fork && k <= 2 && own(j, k))
        ? {list, end: t === 1 ? end : pose(t).slice(0, 2), th: ao ? ao.th * t : null} : null;
    };
    let hd = null;
    // walk to the wanted length, then on until the head fits
    while (!(cells.length - 1 >= want && (hd = head())) && cells.length - 1 < want + 6) {
      if (p.uturn && run >= Math.max(p.run, 1) && rnd() < p.uturn / 100 && ustep()) continue;
      const ts = shuffle([...turns]);
      const order = run >= p.run && rnd() < p.turn / 100 ? [...ts, 0] : [0, ...ts];   // straight runs at least p.run cells
      if (!order.some(step)) break;
    }
    // no room for the head here: back the shaft up one step and try again
    while (cells.length >= 2) {
      if (hd ||= head()) {
        const k = cells.length - 1;
        claim(hd.list, k); cells[k] = hd.end;
        if (arcs[k]) arcs[k] = {...arcs[k], th: hd.th};
        arrows.push({cells, bends, arcs, dirs, dip, q, fork, bleed, cross, k: K, ...arrowStyle(fork, rnd5, rnd7)});
        return true;
      }
      release(); cells.pop(); dirs.pop();
    }
    while (claimed.length) release();
    return false;
  };
  // ---- words fill the blank space the arrows left: each entry (split on |)
  // takes the deepest free pocket of any panel that holds it — full size on one
  // line first, then wrapped after words, then scaled down towards the minimum.
  // A dragged entry sits where it was put, at its own size, wrapped to its panel.
  // ponytail: exhaustive subcell scan over a summed-area table; ~1M O(1) checks worst case
  // Hand-placed entries are claimed before the walks so the arrows keep clear
  // of them; auto entries go after, into the pockets the arrows left.
  const lh = 1.1, hm0 = p.tgap / 100 * 0.5 + 1 / SUB;   // leading in em; the words' clearance is its own dial, plus one subcell of sampling safety
  const tct = p.tcwidth * p.steps / cell;             // the words' own contour budget, cell units
  const fam = userFont.font.family ? `${userFont.font.family}, Helvetica, sans-serif` : "Helvetica Neue, Helvetica, Arial, sans-serif";
  const famAcc = accentFont.font.family ? `${accentFont.font.family}, Helvetica, sans-serif` : fam;
  const famOf = nd => nd?.acc ? famAcc : fam, weightOf = nd => nd?.acc ? p.aweight : p.weight;
  const W1 = fw + 1;
  let sat;                                            // occupied count over subcell prefixes
  const buildSAT = () => {
    sat = new Int32Array(W1 * (fh + 1));
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++)
      sat[(j + 1) * W1 + i + 1] = (fid[j * fw + i] !== -1) + sat[j * W1 + i + 1] + sat[(j + 1) * W1 + i] - sat[j * W1 + i];
  };
  const blocked = (q, i0, j0, i1, j1) =>              // inclusive subcell box: outside the panel or touching anything
    i0 < q.x0 * SUB || j0 < q.y0 * SUB || i1 >= q.x1 * SUB || j1 >= q.y1 * SUB
    || sat[(j1 + 1) * W1 + i1 + 1] - sat[j0 * W1 + i1 + 1] - sat[(j1 + 1) * W1 + i0] + sat[j0 * W1 + i0] > 0;
  const scales = [];
  for (let s = 1; s >= p.textmin / 100 - 1e-9; s -= 0.1) scales.push(s);
  const words = [], dropped = [];                     // dropped: entries no pocket held, for the panel
  const placeWords = manual => { buildSAT(); for (const t of entries(p)) {
    const nd = p.nodes[t] || {size: 60, x: null, y: null}, px0 = cell * nd.size / 100;
    if ((nd.x !== null) !== manual) continue;
    ctx.font = `${weightOf(nd)} ${px0}px ${famOf(nd)}`;
    const ws = t.split(/\s+/), ww = ws.map(w => ctx.measureText(w).width), sp = ctx.measureText(" ").width;
    const total = ww.reduce((a, b) => a + b) + sp * (ws.length - 1);
    const wraps = [], seen = new Set();                // distinct greedy wraps, fewest lines first
    if (t.includes("/")) {                             // "/" sets the line breaks by hand: exactly these lines, no auto wrap
      const parts = t.split("/").map(x => x.trim()).filter(Boolean);
      wraps.push({lines: parts, width: Math.max(...parts.map(l => ctx.measureText(l).width))});
    } else
    for (let n = 1; n <= ws.length; n++) {
      const maxW = Math.max(...ww, total / n), lines = [[]];
      let cw = -sp;
      ws.forEach((w, i) => {
        if (cw + sp + ww[i] > maxW + 1e-6) { lines.push([]); cw = -sp; }
        lines[lines.length - 1].push(i); cw += sp + ww[i];
      });
      if (seen.has(lines.length)) continue;
      seen.add(lines.length);
      wraps.push({lines: lines.map(l => l.map(i => ws[i]).join(" ")),
                  width: Math.max(...lines.map(l => l.reduce((a, i) => a + ww[i], 0) + sp * (l.length - 1)))});
    }
    // tight ink bounds: the claimed box hugs the letters' actual extents (cap
    // height, descenders, italic overhang) instead of the em box, so arrows can
    // sit as close as the gap dial allows. cx/cy: ink centre off the anchor centre.
    const inkBox = lines => {
      let L = 1e9, R = -1e9, T = 1e9, B = -1e9;
      lines.forEach((l, k) => {
        const m = ctx.measureText(l), ly = (k - (lines.length - 1) / 2) * lh * px0;
        T = Math.min(T, ly - m.actualBoundingBoxAscent); B = Math.max(B, ly + m.actualBoundingBoxDescent);
        L = Math.min(L, -m.width / 2 - m.actualBoundingBoxLeft); R = Math.max(R, -m.width / 2 + m.actualBoundingBoxRight);
      });
      return {w: R - L, h: B - T, cx: (L + R) / 2, cy: (T + B) / 2};
    };
    for (const w of wraps) w.ink = inkBox(w.lines);
    let best = null;
    if (nd.x !== null) {                               // placed by hand: fewest lines that fit the grid's width
      const ci = (nd.x * W - ox) / cell * SUB, cj = (nd.y * H - oy) / cell * SUB;
      const q = panels[pid[clamp(cj / SUB | 0, 0, rows - 1) * cols + clamp(ci / SUB | 0, 0, cols - 1)]];
      const fit = wraps.find(w => (w.ink.w / cell + 2 * (hm0 + tct)) * SUB <= fw) || wraps[wraps.length - 1];   // wraps only against the whole grid: dragged words may span panels
      const bw = Math.ceil((fit.ink.w / cell + 2 * (hm0 + tct)) * SUB), bh = Math.ceil((fit.ink.h / cell + 2 * (hm0 + tct)) * SUB);
      best = {i0: ci + fit.ink.cx / cell * SUB - bw / 2, j0: cj + fit.ink.cy / cell * SUB - bh / 2, bw, bh, q, lines: fit.lines, px: px0, ink: fit.ink, s: 1};
    }
    else search: for (const s of scales) for (const {lines, ink} of wraps) {
      const bw = Math.ceil((ink.w * s / cell + 2 * (hm0 + tct)) * SUB), bh = Math.ceil((ink.h * s / cell + 2 * (hm0 + tct)) * SUB);
      for (const q of panels)
        for (let j0 = q.y0 * SUB; j0 + bh <= q.y1 * SUB; j0++) for (let i0 = q.x0 * SUB; i0 + bw <= q.x1 * SUB; i0++) {
          // loop bounds keep the box inside the panel, so occupancy is the only test left
          const occ = sat[(j0 + bh) * W1 + i0 + bw] - sat[j0 * W1 + i0 + bw] - sat[(j0 + bh) * W1 + i0] + sat[j0 * W1 + i0];
          if (occ && p.tblock) continue;               // words must sit on free ground — unless they may overlay
          let k = 0;                                   // clearance: how far the box can grow before it touches
          if (!occ) while (!blocked(q, i0 - k - 1, j0 - k - 1, i0 + bw + k, j0 + bh + k)) k++;
          // free beats overlapped, least overlap beats more, deepest pocket breaks ties —
          // in overlay mode a full-size fit always exists, so words stop shrinking to dodge arrows
          if (!best || occ < best.occ || (occ === best.occ && k > best.k))
            best = {occ, k, i0, j0, bw, bh, q, lines, px: px0 * s, ink, s};
        }
      if (best) break search;
    }
    if (!best) { dropped.push(t); continue; }          // no pocket holds it even at the minimum: dropped
    for (let j = Math.max(0, best.j0 | 0); j < Math.min(fh, best.j0 + best.bh); j++)
      for (let i = Math.max(0, best.i0 | 0); i < Math.min(fw, best.i0 + best.bw); i++) fid[j * fw + i] = WORD;
    buildSAT();
    words.push({...best, t});
  } };
  if (p.tblock) placeWords(true);                     // hand-placed words claim ground first: the walks keep clear

  const d0 = p.dirs === "orthogonal" ? [0, 2, 4, 6] : [0, 1, 2, 3, 4, 5, 6, 7];
  // headings whose reverse leaves the panel from cell x,y: a tail there can bleed off the edge
  const exits = (x, y, q) => d0.filter(d => { const bx = x - D[d][0], by = y - D[d][1]; return bx < q.x0 || bx >= q.x1 || by < q.y0 || by >= q.y1; });
  for (const s of starts) {
    const x = s % cols, y = s / cols | 0, q = panels[pid[s]];
    if (fid[(y * SUB + SUB / 2) * fw + x * SUB + SUB / 2] !== -1) continue;
    const cross = !q.inv && rnd6() < p.cross / 100;    // only ink arrows cross: a paper arrow on paper would read as a hollow outline
    const scale = rnd8() < p.big / 100 ? p.bigk : 1;   // dedicated stream, so 0 % leaves every other draw untouched
    const ex = exits(x, y, cross ? grid : q), bleed = ex.length > 0 && rnd() < p.bleed / 100, id = arrows.length;
    if (!shuffle(bleed ? ex : [...d0]).some(d => walk(s, d, id, q, {bleed, cross, scale}))) continue;
    // fork: a branch leaves an interior cell of the fresh arrow, turning off its heading there
    // only where the parent runs straight through the cell, so its centreline
    // passes the centre and the branch's tail can be buried along it; never
    // near the head
    if (rnd() < p.fork / 100) {
      const A = arrows[id], ks = [];
      for (let k = 1; k <= A.cells.length - 4; k++) if (A.dirs[k] === A.dirs[k + 1] && !A.arcs[k] && !A.arcs[k + 1]
        && Number.isInteger(A.cells[k][0]) && Number.isInteger(A.cells[k][1])) ks.push(k);   // u-turns can leave the integer grid; forks stay on it
      if (ks.length) {
        const k = ks[Math.floor(rnd() * ks.length)], [fx, fy] = A.cells[k];
        shuffle([...turns]).some(t => walk(fy * cols + fx, (A.dirs[k] + t + 8) % 8, arrows.length, q, {fork: {id, k}, cross, scale: A.k}));
      }
    }
  }
  // arrow amount: the fill always runs to saturation, then the slider keeps the
  // first share of the arrows (branches ride with their root) and releases the
  // rest's claims — so the count scales evenly and the freed room goes to the
  // words and dots below
  {
    const roots = arrows.filter(A => !A.fork).length;
    const keep = Math.max(1, Math.round(p.amount / 100 * roots));
    let r = 0;
    arrows.forEach(A => { if (!A.fork) r++; A.skip = r > keep; });
    if (keep < roots) for (let j = 0; j < fid.length; j++)
      if (fid[j] >= 0 && arrows[fid[j]].skip) fid[j] = FREE;   // arrow claims only — never words or dots
  }
  if (!p.tblock) placeWords(true);   // overlay: hand-placed words drop in over the finished arrows — their claim still steers the auto words and dots
  placeWords(false);

  // dots fill leftover holes
  const dots = [];
  for (const s of starts) {
    if (dots.length >= p.dots) break;
    const x = s % cols, y = s / cols | 0, list = disc([x, y], 1.25 + hg);
    if (x < 1.25 || x > cols - 2.25 || y < 1.25 || y > rows - 2.25 || !clear(list, pid[s], () => false)) continue;
    for (const j of list) fid[j] = DOT;
    dots.push({x, y, q: panels[pid[s]]});
  }

  // ---- draw
  const sw = 2 * sc * cell, hwp = hw * cell, hlp = hl * cell, r0 = r0c * cell;
  let textUsed = false;                                // any word that fell back to <text> needs the @font-face defs
  const LY = Object.fromEntries(LAYERS.map(id => [id, []]));   // svg per layer
  LY.paper.push(`<rect width="${W}" height="${H}" fill="${p.paper}"/>`);
  // the canvas twin of the SVG: the same shapes as plain numbers for drawScene()
  const S = {w: W, h: H, paper: p.paper, ink: p.ink, panels: [], lines: null, dots: [], families: [], words: [], covers: [], dropped,
             contourJoin, contentRect: M > 0 ? [M, M, gw, gh] : null,
             flipPaper: [], flipInk: [], layers: p.layers.filter(l => l.on && l.opacity > 0).map(l => ({...l})),
             timing: {moving, loop, m, T, speed: p.speed, timing: p.timing}};
  const contentClip = M > 0 ? ` clip-path="url(#content-inset)"` : "";
  const contentDef = M > 0 ? `<defs><clipPath id="content-inset"><rect x="${M}" y="${M}" width="${gw}" height="${gh}"/></clipPath></defs>` : "";
  const lines = [], ppR = [], piR = [];                // panel rects by polarity, for the words' flip clips
  panels.forEach((q, qi) => {
    const x0 = q.x0 ? ox + q.x0 * cell : 0, x1 = q.x1 < cols ? ox + q.x1 * cell : W;
    const y0 = q.y0 ? oy + q.y0 * cell : 0, y1 = q.y1 < rows ? oy + q.y1 * cell : H;
    const fill = colorOf("panel:" + qi, q.inv ? p.ink : p.paper);
    LY.panels.push(`<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" fill="${fill}" data-el="panel:${qi}"/>`);
    q.px = `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}"/>`;
    q.rc = [x0, y0, x1 - x0, y1 - y0];
    S.panels.push({key: "panel:" + qi, rc: q.rc, fill});
    (q.inv ? piR : ppR).push(q.px);
    (q.inv ? S.flipInk : S.flipPaper).push(q.rc);
    if (q.x1 < cols) lines.push(`M${f(x1)} ${f(y0)}V${f(y1)}`);   // inner edges only, so the artboard rim stays clean
    if (q.y1 < rows) lines.push(`M${f(x0)} ${f(y1)}H${f(x1)}`);
  });
  if (p.line && lines.length) {
    S.lines = {key: "lines", d: lines.join(""), color: colorOf("lines", p.ink), width: p.line};
    LY.panels.push(`<path d="${S.lines.d}" fill="none" stroke="${S.lines.color}" stroke-width="${p.line}"${contentClip} data-el="lines"/>`);
  }
  // covers: every shape that can end up under a word. The flip below re-draws
  // the letters clipped to each one in its fill's counter colour, so the text
  // reacts to the true ground beneath it — panels, arrows and dots alike —
  // exactly like white type under a difference filter, but as editable fills
  const covers = S.covers;                             // {el: svg clip shape, fill, bb, c: canvas shape}
  const layerOn = id => p.layers.some(l => l.id === id && l.on && l.opacity > 0);
  const lum = c => { const m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return 0.5;
    const n = parseInt(m[1], 16);
    return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; };
  const counter = c => Math.abs(lum(c) - lum(p.ink)) >= Math.abs(lum(c) - lum(p.paper)) ? p.ink : p.paper;
  dots.forEach(({x, y, q}, j) => {
    const cx = f(ox + (x + 0.5) * cell), cy = f(oy + (y + 0.5) * cell), r = f(1.25 * cell);
    const fill = colorOf("dot:" + j, q.inv ? p.paper : p.ink);
    LY.dots.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" data-el="dot:${j}"/>`);
    S.dots.push({key: "dot:" + j, cx, cy, r, fill});
    if (layerOn("dots")) covers.push({el: `<circle cx="${cx}" cy="${cy}" r="${r}"/>`, fill, bb: [cx - r, cy - r, cx + r, cy + r], c: {dot: [cx, cy, r]}});
  });
  const esc = s => s.replace(/[&<>]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
  // words get the arrows' contour stack too: even ring steps, every line's rings
  // before any line's fill so a wide ring never sits on the neighbouring line
  const tr = p.tcwidth ? pal.map((c, k) => ({c, w: p.tcwidth * (k + 1)})).reverse() : [];
  // flip per panel: every word is drawn twice, ink clipped to the paper panels
  // and paper clipped to the ink panels — letters flip polarity at panel edges.
  // Background panels extend through the global foreground margin.
  if (p.textcol === "flip per panel" && words.length) {
    LY.text.push(`<defs><clipPath id="tpp">${ppR.join("")}</clipPath><clipPath id="tpi">${piR.join("")}</clipPath></defs>`);
  }
  // words render AFTER the arrows loop (drawWords below), so the covers exist —
  // the flip needs every shape's final geometry and fill
  const drawWords = () => { const parts = [], usedCovers = new Set();
  words.forEach(({i0, j0, bw, bh, q, lines, px, ink, s: sc2, t}, n) => {   // data-node lets the stage drag it
    const nd = p.nodes[t];
    // the box hugs the ink; the anchor centre sits off it by the ink offsets
    const cx = f(ox + (i0 + bw / 2) / SUB * cell - ink.cx * sc2), cy = oy + (j0 + bh / 2) / SUB * cell - ink.cy * sc2;
    const ot = nd?.acc ? OT.accent : OT.main;
    // canvas draws each line with textBaseline "middle"; the SVG sets the alphabetic
    // baseline where canvas puts it (ink ascent above "alphabetic" minus above
    // "middle"), in the same font string, so preview, PNG and SVG line up whatever the face's metrics
    ctx.font = `${weightOf(nd)} ${px}px ${famOf(nd)}`;
    const tb0 = ctx.textBaseline;
    ctx.textBaseline = "alphabetic"; const aA = ctx.measureText("H").actualBoundingBoxAscent;
    ctx.textBaseline = "middle"; const aM = ctx.measureText("H").actualBoundingBoxAscent;
    ctx.textBaseline = tb0;
    const base = aA - aM;                              // middle line → alphabetic baseline, px down
    const dOf = (l, k) => {                            // one line as a glyph path
      const ly = cy + (k - (lines.length - 1) / 2) * lh * px;
      // own serializer — opentype 2.0.0's toPathData emits NaNs on longer strings
      return ot.getPath(l, cx - ot.getAdvanceWidth(l, px) / 2, ly + base, px)
        .commands.map(c =>
          c.type === "M" ? `M${f(c.x)} ${f(c.y)}` :
          c.type === "L" ? `L${f(c.x)} ${f(c.y)}` :
          c.type === "C" ? `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}` :
          c.type === "Q" ? `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}` : "Z").join("");
    };
    // outlined words merge the whole block into ONE path per paint — the export
    // stays a flat stack of editable compound paths, not a path per line
    const blockD = p.outline && ot ? lines.map(dOf).join("") : null;
    const line = (l, k, paint) => {
      const ly = cy + (k - (lines.length - 1) / 2) * lh * px;
      textUsed = true;
      return `<text x="${cx}" y="${f(ly + base)}" font-family="${famOf(nd)}"`
        + ` font-size="${f(px)}" font-weight="${weightOf(nd)}" text-anchor="middle"${paint}>${esc(l)}</text>`;
    };
    const draw = paint => blockD ? `<path d="${blockD}"${paint}/>` : lines.map((l, k) => line(l, k, paint)).join("");
    const assigned = masterColor(p.assign["word:" + t]);
    // the panel flip lays the base; every arrow or dot crossing the word's box
    // then re-draws it clipped to that shape, in its fill's counter colour —
    // shapes never overlap each other, so exactly one cover owns any point
    const wx0 = ox + i0 / SUB * cell, wy0 = oy + j0 / SUB * cell;
    const wx1 = wx0 + bw / SUB * cell, wy1 = wy0 + bh / SUB * cell;
    const overs = !assigned && p.textcol === "flip per panel"
      ? covers.map((c, ci) => ci).filter(ci => { const b = covers[ci].bb; return b[0] < wx1 && b[2] > wx0 && b[1] < wy1 && b[3] > wy0; })
      : [];
    for (const ci of overs) usedCovers.add(ci);
    const fills = !assigned && p.textcol === "flip per panel"
      ? `<g clip-path="url(#tpp)">` + draw(` fill="${p.ink}"`) + `</g>`
        + `<g clip-path="url(#tpi)">` + draw(` fill="${p.paper}"`) + `</g>`
        + overs.map(ci => `<g clip-path="url(#tc${ci})">` + draw(` fill="${counter(covers[ci].fill)}"`) + `</g>`).join("")
      : draw(` fill="${assigned ?? (q.inv ? p.paper : p.ink)}"`);
    const flip = !assigned && p.textcol === "flip per panel";
    S.words.push({key: "word:" + n, n, t, lines, cx, cy, px, lh, font: `${weightOf(nd)} ${px}px ${famOf(nd)}`, rings: tr,
      fill: flip ? null : assigned ?? (q.inv ? p.paper : p.ink), overs: overs.map(ci => ({ci, fill: counter(covers[ci].fill)})),
      box: [wx0, wy0, wx1, wy1]});
    parts.push(`<g id="word-${n}" data-node="${n}" data-el="word:${n}" data-cx="${cx}" data-cy="${f(cy)}">`
      + tr.map(r => draw(` fill="none" stroke="${r.c}" stroke-width="${f(2 * r.w)}" stroke-linejoin="${contourJoin}"${miterAttr(contourJoin)}`)).join("")
      + fills + `</g>`);
  });
  if (usedCovers.size) LY.text.push(`<defs>${[...usedCovers].map(ci => `<clipPath id="tc${ci}">${covers[ci].el}</clipPath>`).join("")}</defs>`);
  LY.text.push(...parts); };

  const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  // rings are drawn level by level across all arrows (widest level first), then
  // every fill: where a branch meets its parent the union then reads as one
  // shape's contour instead of the branch's rings sitting on the parent's.
  // Bleed arrows are clipped to their panel.
  const defs = [], usedClips = new Set();
  arrows.forEach((A, i) => {
    if (A.skip) return;                                  // amount slider dropped it; skipping after the fill keeps every random stream aligned
    const K = A.k || 1, swA = sw * K, hwpA = hwp * K, hlpA = hlp * K, r0A = r0 * K;   // big arrows scale every stroke of their own
    const pts = A.cells.map(([x, y]) => [ox + (x + 0.5) * cell, oy + (y + 0.5) * cell]);
    // contours: the outline and head stroked at growing widths, widest first, the
    // fill on top — ring widths vary per arrow but the stack never exceeds the
    // budget the shaft gave up, so neighbours' contours can at most meet
    const home = colorOf("panel:" + panels.indexOf(A.q), A.q.inv ? p.ink : p.paper);   // the ground the arrow sits on
    const rings = A.fork ? arrows[A.fork.id].rings : A.ringWidths.map((w, j) => ({w,
      c: A.hollow ? p.arrow : p.ringcol === "home panel" ? home : pal[pal.length - 1 - j]}));
    A.rings = rings;
    const w1 = rings.length ? rings[0].w : 0;
    // a bleed tail starts well past the panel edge; the clip trims it flush.
    // It extends along the walk's INITIAL heading (dirs[0]) — dirs[1] is already
    // the post-bend heading when the first step sweeps an arc or u-turn
    const u1 = unit0(D[A.dirs[0]]), ext = A.bleed ? (0.75 * cell + 2 * sc * cell) * K + w1 : 0;
    const tail = [pts[0][0] - u1[0] * ext, pts[0][1] - u1[1] * ext];
    // centreline as lines, with each bend either sharp or a true arc (radius
    // clamped so a cut never eats more than half a segment). segs carries the
    // exact geometry: the shaft's stations and the head's pose both read it, so
    // the two can never drift apart while the arrow draws in.
    const segs = [];
    const sAt = [];                                        // centreline length reached at each cell, for fork timing
    let L = 0, cur = tail;
    const line = (a, b) => {
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (l < 1e-6) return;
      segs.push({a, u: unit(a, b), s0: L, len: l}); L += l;
    };
    const arc = (a, u1, sg, r, th, b) => {              // from a, tangent u1, sweeping sg through th, to b
      const c = [a[0] - u1[1] * sg * r, a[1] + u1[0] * sg * r];
      segs.push({c, r, sg, a0: Math.atan2(a[1] - c[1], a[0] - c[0]), s0: L, len: r * th}); L += r * th;
    };
    // straight runs between bends: a corner's radius may use half of each
    // neighbouring run, which is exactly what the walk reserved for it
    const bendAt = k => k > 0 && k < pts.length - 1 && (A.arcs[k] || A.arcs[k + 1] || A.dirs[k] !== A.dirs[k + 1]);
    const runLen = (k, dir) => { let j = k; do j += dir; while (j > 0 && j < pts.length - 1 && !bendAt(j)); return Math.hypot(pts[j][0] - pts[k][0], pts[j][1] - pts[k][1]); };
    if (ext) { line(tail, pts[0]); cur = pts[0]; }   // the lead-in is its own straight segment, so a first-step arc starts where it was claimed
    for (let k = 1; k < pts.length; k++) {
      sAt[k - 1] = L;
      const P = pts[k], nx = pts[k + 1];
      if (A.arcs[k]) {                                   // sweeping step: a quarter or half circle from cur to P
        const ao = A.arcs[k];
        arc(cur, unit0(D[A.dirs[k - 1]]), ao.sg, ao.r * cell, ao.th, P);
        cur = P;
        continue;
      }
      if (nx && !A.arcs[k + 1]) {
        const u1 = unit(cur, P), u2 = unit(P, nx);
        const cross = u1[0] * u2[1] - u1[1] * u2[0];
        if (Math.abs(cross) > 1e-9 && A.bends[k] && r0 > 0) {
          const th = Math.atan2(Math.abs(cross), u1[0] * u2[0] + u1[1] * u2[1]), tan = Math.tan(th / 2);
          const r = Math.min(r0A, runLen(k, -1) / 2 / tan, runLen(k, 1) / 2 / tan);
          const t = r * tan, sg = Math.sign(cross);
          const a = [P[0] - u1[0] * t, P[1] - u1[1] * t], b = [P[0] + u2[0] * t, P[1] + u2[1] * t];
          line(cur, a);
          arc(a, u1, sg, r, th, b);
          cur = b;
          continue;
        }
      }
      line(cur, P); cur = P;
    }
    sAt[pts.length - 1] = L;
    const poseAt = rr => {                                 // position + heading (rad) at fraction rr of the centreline
      const s = clamp(rr, 0, 1) * L;
      const g = segs.find(g => s <= g.s0 + g.len) || segs[segs.length - 1], ds = s - g.s0;
      if (g.u) return [g.a[0] + g.u[0] * ds, g.a[1] + g.u[1] * ds, Math.atan2(g.u[1], g.u[0])];
      const ang = g.a0 + g.sg * ds / g.r;
      return [g.c[0] + g.r * Math.cos(ang), g.c[1] + g.r * Math.sin(ang), ang + g.sg * Math.PI / 2];
    };

    // head in the motion frame (base on the origin, tip along +x), with a tab back
    // into the shaft so the seam never shows
    // shaft as a filled outline: each straight run has one width, runs alternate
    // full / thinner starting full, and the width switches only at angled bends,
    // where the two runs' offset edges cross (a square junction for 90°); arcs
    // and the runs after them keep the width they came in with
    let w = swA, k = 0;
    const same = (g, h) => g.u && h.u && g.u[0] * h.u[0] + g.u[1] * h.u[1] > 1 - 1e-6;
    const wid = segs.map((g, i) => {
      const prev = segs[i - 1];
      if (g.u && prev && prev.u && !same(g, prev)) w = ++k % 2 ? swA * (1 - A.dip * (0.6 + 0.4 * rnd3())) : swA;
      return w;
    });
    const st = [];                                             // stations: x, y, tangent, width, centreline length
    segs.forEach((g, i) => {
      const wv = wid[i];
      if (g.u) st.push([g.a[0], g.a[1], g.u[0], g.u[1], wv, g.s0], [g.a[0] + g.u[0] * g.len, g.a[1] + g.u[1] * g.len, g.u[0], g.u[1], wv, g.s0 + g.len]);
      else {
        const n = Math.ceil(g.len / (0.1 * cell));
        for (let j = 0; j <= n; j++) {
          const ds = g.len * j / n, ang = g.a0 + g.sg * ds / g.r;
          st.push([g.c[0] + g.r * Math.cos(ang), g.c[1] + g.r * Math.sin(ang), -g.sg * Math.sin(ang), g.sg * Math.cos(ang), wv, g.s0 + ds]);
        }
      }
    });
    // the shaft's outline from any run of stations: the static picture takes
    // them all, a draw-in frame the ones up to the head (drawScene cuts them)
    const edges = st => {
    const left = [], right = [];
    for (let i = 0; i < st.length; i++) {
      const [x, y, tx, ty, w] = st[i];
      let ox = -ty * w / 2, oy = tx * w / 2;                   // offset to the left edge
      const nxt = st[i + 1];
      if (nxt && Math.hypot(nxt[0] - x, nxt[1] - y) < 1e-6) {   // joint: two tangents (and widths) at one point
        const n1 = [-ty, tx], n2 = [-nxt[3], nxt[2]], c = n1[0] * n2[0] + n1[1] * n2[1], d1 = w / 2, d2 = nxt[4] / 2;
        if (Math.abs(c) < 0.999) {                             // corner: where the two offset edges cross
          const q = 1 - c * c;
          ox = (d1 * (n1[0] - n2[0] * c) + d2 * (n2[0] - n1[0] * c)) / q;
          oy = (d1 * (n1[1] - n2[1] * c) + d2 * (n2[1] - n1[1] * c)) / q;
        }
        i++;
      }
      let lx = x + ox, ly = y + oy, rx = x - ox, ry = y - oy;
      if (i === 0 && A.fork) {                                 // a branch's tail is cut along the parent's centreline, so
        const [vx, vy] = unit0(D[arrows[A.fork.id].dirs[A.fork.k]]);   // both corners (and their rings) stay inside the parent
        const dot = -ox * vy + oy * vx, den = -tx * vy + ty * vx;      // offsets and tangent against the parent's normal
        if (Math.abs(den) > 1e-6) { lx -= tx * dot / den; ly -= ty * dot / den; rx += tx * dot / den; ry += ty * dot / den; }
      }
      left.push([lx, ly]);
      right.push([rx, ry]);
    }
    return left.concat(right.reverse());
    };
    const ring = edges(st);                                    // closed polygon: left edge out, right edge back
    const outline = "M" + ring.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";

    const col = colorOf("arrow:" + i, A.hollow ? home : p.arrow);
    // head in its own frame (base on the origin, tip along +x), with a tab back
    // into the shaft so the seam never shows
    const head = headShape(swA / 2, hwpA, hlpA);
    // phase: on a 1/8 grid for a free arrow; a branch starts the moment its
    // parent's head passes the fork (undoing the easing to find that moment)
    let ph;
    if (A.fork) {
      const P = arrows[A.fork.id], frac = P.sAt[A.fork.k] / P.L, x = p.timing === "ease out" ? 1 - Math.cbrt(1 - frac) : frac;
      ph = P.ph + (loop ? -1 : 1) * m * x;
    } else ph = (p.stagger / 100) * Math.round(rnd4() * 8) / 8;
    A.ph = ph; A.sAt = sAt; A.L = L;
    const cp = A.bleed && !A.cross ? ` clip-path="url(#q${panels.indexOf(A.q)})"` : "";   // a crossing tail runs off the artboard anyway
    if (cp) usedClips.add(panels.indexOf(A.q));
    // static picture: the head bakes into the shaft's path data, so each paint
    // is ONE editable compound path — no transformed groups in the export.
    // The final-pose shape is always built: the words' flip clips against it
    const [hx2, hy2, ha2] = poseAt(1), co = Math.cos(ha2), si = Math.sin(ha2);
    const pt = (x, y) => `${f(hx2 + x * co - y * si)} ${f(hy2 + x * si + y * co)}`;
    const shapeD = outline + "M" + head.map(([x, y]) => pt(x, y)).join("L") + "Z";
    const piece = paint => `<path d="${shapeD}"${paint}${cp} data-el="arrow:${i}"/>`;
    // canvas: stations + pose let drawScene cut the shaft at any length
    A.scene = {key: "arrow:" + i, ph, L, rings, fill: col, clip: cp ? A.q.rc : null,
               st, edges, poseAt, head, ring, shapeD};
    A.draw = {
      rings: rings.map(r => piece(` fill="none" stroke="${r.c}" stroke-width="${f(2 * r.w)}" stroke-linejoin="${contourJoin}"${miterAttr(contourJoin)}`)),
      fill: piece(` fill="${col}"`)
    };
    if (layerOn("arrows")) {
      // tight bbox from the real geometry: shaft edge stations plus head corners,
      // grown by the ring stack — it only gates which words clip against the shape
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      const grow = (x, y, e) => { bx0 = Math.min(bx0, x - e); by0 = Math.min(by0, y - e); bx1 = Math.max(bx1, x + e); by1 = Math.max(by1, y + e); };
      for (const [x, y, , , w] of st) grow(x, y, w / 2 + w1);
      for (const [x, y] of [[0, hwpA], [hlpA, 0], [0, -hwpA]])
        grow(hx2 + x * co - y * si, hy2 + x * si + y * co, w1);
      covers.push({el: `<path d="${shapeD}"${cp}/>`, fill: col, bb: [bx0, by0, bx1, by1], c: {arrow: A.scene}});
    }
  });
  // families: a branch draws inside its parent's group — rings (widest level
  // first) before every fill, so the union still reads as one shape with one
  // contour, and the export groups sanely: one <g> per arrow
  for (const qi of usedClips) defs.push(`<clipPath id="q${qi}">${panels[qi].px}</clipPath>`);
  if (defs.length) LY.arrows.push(`<defs>${defs.join("")}</defs>`);
  const fams = new Map();
  arrows.forEach((A, i) => { if (A.skip) return; const r = A.fork ? A.fork.id : i; fams.has(r) ? fams.get(r).push(i) : fams.set(r, [i]); });
  for (const [r, members] of fams) {
    S.families.push(members.map(i => arrows[i].scene));
    const ringP = [];
    for (let j = 0; j < pal.length; j++) for (const i of members) if (arrows[i].draw.rings[j]) ringP.push(arrows[i].draw.rings[j]);
    LY.arrows.push(`<g id="arrow-${r}">${ringP.join("")}${members.map(i => arrows[i].draw.fill).join("")}</g>`);
  }
  drawWords();                                         // now that every cover shape is known
  const faces = textUsed ? [userFont.font, accentFont.font].filter(f => f.dataURL)
    .map(f => `@font-face{font-family:"${f.family}";src:url(${f.dataURL});}`).join("") : "";
  const fontDefs = faces ? `<defs><style>${faces}</style></defs>` : "";
  // layers bottom-up in the panel's order; hidden ones are left out entirely
  const layers = p.layers.filter(l => l.on && l.opacity > 0).map(l =>
    `<g id="${l.id}"${["arrows", "dots", "text"].includes(l.id) ? contentClip : ""}${l.opacity < 100 ? ` opacity="${l.opacity / 100}"` : ""}${l.blend !== "normal" ? ` style="mix-blend-mode:${l.blend}"` : ""}>${LY[l.id].join("")}</g>`).join("");
  S.svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${fontDefs}${contentDef}${layers}</svg>`;
  return S;
}

// ---------- canvas renderer ----------
// Paints the scene at time t (seconds; null = the finished picture) on any 2D
// context whose transform already maps scene units to pixels. Plain Canvas 2D,
// so the p5 loop, PNG and GIF exports all share it.
const clamp01 = x => Math.max(0, Math.min(1, x));
const EASE = {"ease out": x => 1 - (1 - x) ** 3, "linear": x => x, "snap": x => x >= 1 ? 1 : 0};
// reveal fraction of an arrow with phase ph at time t — the draw-in timing math
const progress = (tm, ph, t) => {
  if (t === null || !tm.moving) return 1;
  let c = t / tm.speed + (tm.loop ? ph : -ph);
  c = tm.loop ? c - Math.floor(c) : clamp01(c);
  return EASE[tm.timing](Math.min(1, c / tm.m));
};
const poly = (path, pts) => { pts.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y)); path.closePath(); return path; };
// the shaft cut at centreline length s: stations up to s plus one interpolated there
const cut = (st, s) => {
  const out = [];
  for (let i = 0; i < st.length; i++) {
    const a = st[i];
    if (a[5] <= s) { out.push(a); continue; }
    const b = out[out.length - 1];
    if (b && s > b[5] + 1e-6) {
      const k = (s - b[5]) / (a[5] - b[5]), x = b[0] + (a[0] - b[0]) * k, y = b[1] + (a[1] - b[1]) * k;
      const tx = b[2] + (a[2] - b[2]) * k, ty = b[3] + (a[3] - b[3]) * k, l = Math.hypot(tx, ty) || 1;
      out.push([x, y, tx / l, ty / l, b[4], s]);
    }
    break;
  }
  return out;
};
const headAt = (A, r) => {
  const [hx, hy, ha] = A.poseAt(r), co = Math.cos(ha), si = Math.sin(ha);
  return A.head.map(([x, y]) => [hx + x * co - y * si, hy + x * si + y * co]);
};
// Path2Ds of an arrow at reveal r; the finished shape is built once and kept
const arrowPaths = (A, r) => {
  if (r >= 1) return A._done ??= [poly(poly(new Path2D(), A.ring), headAt(A, 1))];
  const st = cut(A.st, r * A.L), paths = [];
  if (st.length > 1) paths.push(poly(new Path2D(), A.edges(st)));
  paths.push(poly(new Path2D(), headAt(A, r)));
  return paths;
};
const rectClip = (ctx, rects) => {
  const p = new Path2D();
  for (const [x, y, w, h] of rects) p.rect(x, y, w, h);
  ctx.clip(p);
};
const coverPath = c => c.dot ? (c._p ??= (() => { const p = new Path2D(); p.arc(c.dot[0], c.dot[1], c.dot[2], 0, 2 * Math.PI); return p; })())
  : arrowPaths(c.arrow, 1)[0];

function drawLayer(ctx, S, id, t, opt) {
  if (S.contentRect && ["arrows", "dots", "text"].includes(id)) rectClip(ctx, [S.contentRect]);
  if (id === "paper") { ctx.fillStyle = S.paper; ctx.fillRect(0, 0, S.w, S.h); return; }
  if (id === "panels") {
    for (const q of S.panels) { ctx.fillStyle = q.fill; ctx.fillRect(...q.rc); }
    if (S.lines) {
      if (S.contentRect) rectClip(ctx, [S.contentRect]);
      ctx.strokeStyle = S.lines.color; ctx.lineWidth = S.lines.width; ctx.lineJoin = "miter"; ctx.miterLimit = 4;
      ctx.stroke(S.lines._p ??= new Path2D(S.lines.d));
    }
    return;
  }
  if (id === "dots") {
    for (const d of S.dots) { ctx.fillStyle = d.fill; ctx.fill(coverPath({dot: [d.cx, d.cy, d.r]})); }
    return;
  }
  if (id === "arrows") {
    // per family: every ring level of every member first, then the fills, so
    // a branch and its parent read as one shape with one contour
    for (const fam of S.families) {
      const drawn = fam.map(A => ({A, paths: arrowPaths(A, progress(S.timing, A.ph, t))}));
      const levels = Math.max(0, ...fam.map(A => A.rings.length));
      const paint = (A, fn) => {
        if (A.clip) { ctx.save(); rectClip(ctx, [A.clip]); fn(); ctx.restore(); } else fn();
      };
      ctx.lineJoin = S.contourJoin; ctx.miterLimit = MITER;   // same limit as the SVG
      for (let j = 0; j < levels; j++) for (const {A, paths} of drawn) {
        const rg = A.rings[j];
        if (!rg) continue;
        paint(A, () => { ctx.strokeStyle = rg.c; ctx.lineWidth = 2 * rg.w; for (const p of paths) ctx.stroke(p); });
      }
      for (const {A, paths} of drawn) paint(A, () => { ctx.fillStyle = A.fill; for (const p of paths) ctx.fill(p); });
    }
    return;
  }
  if (id === "text") {
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineJoin = S.contourJoin; ctx.miterLimit = MITER;
    for (const w of S.words) {
      const drag = opt.drag && opt.drag.n === w.n ? opt.drag : null;
      ctx.save();
      if (drag) ctx.translate(drag.dx, drag.dy);
      ctx.font = w.font;
      const each = fn => w.lines.forEach((l, k) => fn(l, w.cx, w.cy + (k - (w.lines.length - 1) / 2) * w.lh * w.px));
      for (const rg of w.rings) { ctx.strokeStyle = rg.c; ctx.lineWidth = 2 * rg.w; each((l, x, y) => ctx.strokeText(l, x, y)); }
      const fill = (c, clip) => {
        ctx.save(); clip?.(); ctx.fillStyle = c; each((l, x, y) => ctx.fillText(l, x, y)); ctx.restore();
      };
      if (w.fill) fill(w.fill);
      else {                                         // flip per panel, then the counter colour over each cover
        fill(S.ink, () => rectClip(ctx, S.flipPaper));
        fill(S.paper, () => rectClip(ctx, S.flipInk));
        for (const o of w.overs) {
          const c = S.covers[o.ci].c;
          fill(o.fill, () => { if (c.arrow?.clip) rectClip(ctx, [c.arrow.clip]); ctx.clip(coverPath(c)); });
        }
      }
      ctx.restore();
    }
  }
}

// layers with opacity or a blend mode are isolated on a scratch canvas first,
// exactly like an SVG group with opacity / mix-blend-mode
const scratch = new WeakMap();
function drawScene(ctx, S, t = null, opt = {}) {
  for (const l of S.layers) {
    if (l.opacity >= 100 && l.blend === "normal") { ctx.save(); drawLayer(ctx, S, l.id, t, opt); ctx.restore(); continue; }
    const cv = ctx.canvas;
    let off = scratch.get(cv);
    if (!off || off.width !== cv.width || off.height !== cv.height) {
      off = Object.assign(document.createElement("canvas"), {width: cv.width, height: cv.height});
      scratch.set(cv, off);
    }
    const o = off.getContext("2d");
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, off.width, off.height);
    o.setTransform(ctx.getTransform());
    o.save(); drawLayer(o, S, l.id, t, opt); o.restore();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = l.opacity / 100;
    ctx.globalCompositeOperation = l.blend === "normal" ? "source-over" : l.blend;
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }
}
// reveal state of every arrow at t, to skip frames where nothing moves
const frameKey = (S, t) => S.families.map(f => f.map(A => progress(S.timing, A.ph, t).toFixed(4)).join()).join("|");

// topmost element under scene point x, y: {key, word?} or null
const hitCtx = () => hitCtx.c ??= document.createElement("canvas").getContext("2d");
function hitTest(S, x, y) {
  const c = hitCtx(), rc = S.contentRect;
  const inContent = !rc || (x >= rc[0] && y >= rc[1] && x <= rc[0] + rc[2] && y <= rc[1] + rc[3]);
  for (const l of [...S.layers].reverse()) {
    if (!inContent && ["arrows", "dots", "text"].includes(l.id)) continue;
    if (l.id === "text") { const w = [...S.words].reverse().find(w => x >= w.box[0] && x <= w.box[2] && y >= w.box[1] && y <= w.box[3]); if (w) return {key: w.key, word: w}; }
    if (l.id === "dots") { const d = S.dots.find(d => Math.hypot(x - d.cx, y - d.cy) <= d.r); if (d) return {key: d.key}; }
    if (l.id === "arrows") for (const fam of [...S.families].reverse()) for (const A of fam) {
      if (A.clip && !(x >= A.clip[0] && y >= A.clip[1] && x <= A.clip[0] + A.clip[2] && y <= A.clip[1] + A.clip[3])) continue;
      if (c.isPointInPath(arrowPaths(A, 1)[0], x, y)) return {key: A.key};
    }
    if (l.id === "panels") {
      if (S.lines && inContent) { c.lineWidth = Math.max(6, S.lines.width); if (c.isPointInStroke(S.lines._p ??= new Path2D(S.lines.d), x, y)) return {key: S.lines.key}; }
      const q = S.panels.find(q => x >= q.rc[0] && y >= q.rc[1] && x <= q.rc[0] + q.rc[2] && y <= q.rc[1] + q.rc[3]);
      if (q) return {key: q.key};
    }
  }
  return null;
}

// ---------- <arrow-maze> custom element ----------
// Attributes (all optional):
//   fit             regenerate (default) — re-lays the maze out for the element's box,
//                   arrows keep their size (cell px from the design, or the `cell`
//                   attribute) so a wider box gets more columns, not bigger arrows
//                   contain | cover — the designed artboard, scaled to fit / fill
//                   fixed — the designed artboard at 1:1, centred
//   playback        loop | once | in-view (replays each time it scrolls into view)
//                   | static; default follows the design's motion setting
//   cell            regenerate only: grid cell in CSS px
//   pause-offscreen default on; "false" keeps the clock running out of view
//   reduced-motion  respect (default: static under prefers-reduced-motion) | ignore
//   src             URL of a config JSON, instead of an inline
//                   <script type="application/json"> child
//   p5-src          where to load p5 from when the page has none
// Config: {params: {…tool settings…}, fonts: {main, accent: {family, dataURL}}}
//   (an accent without dataURL names a face registered elsewhere — the main one)
// JS: el.config = {…}; el.play(); el.pause(); el.restart(); el.seek(sec);
//     el.scene; events "arrowmaze:layout" and "arrowmaze:ready".
const P5_SRC = "https://cdn.jsdelivr.net/npm/p5@2.3.3/lib/p5.min.js";
let p5Load = null;
const needP5 = src => window.p5 ? Promise.resolve(window.p5) : p5Load ??= new Promise((ok, fail) =>
  document.head.append(Object.assign(document.createElement("script"), {
    src, onload: () => ok(window.p5), onerror: () => fail(new Error("arrow-maze: could not load p5 from " + src))})));
// a font from the config is registered once per page; null = ready to measure
const faces = new Map();                               // family → pending load | true once settled
const fontWait = f => {
  if (!f?.family || !f.dataURL || faces.get(f.family) === true) return null;
  if ([...document.fonts].some(x => x.family.replace(/["']/g, "") === f.family && x.status === "loaded")) return null;
  if (!faces.has(f.family)) faces.set(f.family, new FontFace(f.family, `url(${f.dataURL})`).load()
    .then(face => document.fonts.add(face), e => console.warn("arrow-maze: font", f.family, e.message))
    .finally(() => faces.set(f.family, true)));
  return faces.get(f.family);
};
const PLAY = {"none": "static", "draw in": "once", "draw loop": "loop"};
const MOTION = {static: "none", once: "draw in", "in-view": "draw in", loop: "draw loop"};

class ArrowMazeElement extends HTMLElement {
  static observedAttributes = ["fit", "playback", "cell", "reduced-motion", "src"];
  #cfg = null; #scene = null; #sk = null; #size = {w: 0, h: 0};
  #clock = {t0: 0, at: 0, run: false}; #last = ""; #stale = false; #timer = 0; #ro = null; #io = null;
  env = {};                                            // extra layout env (the tool passes opentype faces)
  dragOffset = null;                                   // {n, dx, dy}: a word being dragged, in scene units

  constructor() {
    super();
    this.attachShadow({mode: "open"}).innerHTML =
      `<style>:host{display:block;position:relative;overflow:hidden}#box{position:absolute;inset:0}canvas{display:block}</style><div id="box"></div>`;
  }
  get fit() { return this.getAttribute("fit") || "regenerate"; }
  get scene() { return this.#scene; }
  get config() { return this.#cfg; }
  set config(c) {
    this.#cfg = c?.params ? {params: c.params, fonts: c.fonts || {}} : {params: c || {}, fonts: {}};
    if (this.isConnected && !this.clientHeight) this.#resized({width: this.clientWidth, height: 0});   // config came after the first measure
    this.#relayout();
    this.restart();
  }

  connectedCallback() {
    if (!this.#cfg) {
      const js = this.querySelector('script[type="application/json"]');
      if (js) this.config = JSON.parse(js.textContent);
      else if (this.getAttribute("src")) this.#fetch();
    }
    this.#ro = new ResizeObserver(([e]) => this.#resized(e.contentRect));
    this.#ro.observe(this);
    this.#io = new IntersectionObserver(([e]) => this.#visible(e.isIntersecting));
    this.#io.observe(this);
    needP5(this.getAttribute("p5-src") || P5_SRC).then(P5 => this.#start(P5), e => console.error(e));
  }
  disconnectedCallback() {
    this.#ro?.disconnect(); this.#io?.disconnect(); clearTimeout(this.#timer);
    this.#sk?.remove(); this.#sk = null;
  }
  attributeChangedCallback(name, was, now) {
    if (was === now || !this.isConnected) return;
    if (name === "src") this.#fetch(); else { this.#relayout(); this.#kick(); }
  }

  // ---- clock
  #now() { const c = this.#clock; return c.run ? (performance.now() - c.t0) / 1000 : c.at; }
  play() { const c = this.#clock; if (!c.run) { c.t0 = performance.now() - c.at * 1000; c.run = true; } this.#kick(); }
  pause() { const c = this.#clock; c.at = this.#now(); c.run = false; }
  seek(t) { const c = this.#clock; c.at = t; c.t0 = performance.now() - t * 1000; this.#kick(); }
  restart() { this.seek(0); }
  redraw() { this.#kick(); }

  // scene units → element px: {s, x, y}
  #map() {
    const S = this.#scene, {w, h} = this.#size, fit = this.fit;
    const s = fit === "fixed" ? 1 : fit === "contain" ? Math.min(w / S.w, h / S.h) : Math.max(w / S.w, h / S.h);
    return {s, x: (w - S.w * s) / 2, y: (h - S.h * s) / 2};
  }
  toScene(clientX, clientY) {
    const r = this.getBoundingClientRect(), m = this.#map();
    return {x: (clientX - r.left - m.x) / m.s, y: (clientY - r.top - m.y) / m.s};
  }
  #playback() {
    const want = this.getAttribute("playback") || PLAY[this.#cfg?.params.motion] || "static";
    return want !== "static" && this.getAttribute("reduced-motion") !== "ignore"
      && matchMedia("(prefers-reduced-motion: reduce)").matches ? "static" : want;
  }

  // ---- layout: the walks are the expensive part, so it only runs on a new
  // config, a changed attribute or (regenerate) a settled resize
  #relayout() {
    if (!this.#cfg) return;
    const {params, fonts} = this.#cfg;
    const waits = [fontWait(fonts.main), fontWait(fonts.accent)].filter(Boolean);
    if (waits.length) { Promise.all(waits).then(() => this.#relayout()); return; }
    const p = normalize(params);
    p.motion = MOTION[this.#playback()];
    let W = p.wpx, H = p.hpx, basis, cell;
    if (this.fit === "regenerate") {
      ({w: W, h: H} = this.#size);
      if (!(W > 0 && H > 0)) return;                    // no box yet: the first resize lays it out
      const size = sizeOf(p.wpx, p.hpx), M = insetMargin(toPx(p.margin, size), p.wpx, p.hpx);
      const own = gridOf(p.cols, p.wpx - 2 * M, p.hpx - 2 * M).cell;
      cell = +this.getAttribute("cell") || p.ecell || own;
      // a different cell is the design at another scale: the relative sizes
      // (contours, divider, margin) resolve against the artboard scaled with it
      basis = size * cell / own;
    }
    this.#scene = layout(p, W, H, {fonts, ...this.env, basis, cell});
    this.#stale = false;
    this.dispatchEvent(new CustomEvent("arrowmaze:layout", {detail: this.#scene}));
    this.#kick();
  }
  #fetch() {
    fetch(this.getAttribute("src")).then(r => r.json()).then(c => { this.config = c; })
      .catch(e => console.error("arrow-maze: config", e));
  }
  #resized({width: w, height: h}) {
    if (!h && w && this.#cfg) {                        // no height from the page: keep the design's proportions
      const p = normalize(this.#cfg.params);
      this.style.aspectRatio = `${p.wpx} / ${p.hpx}`;
      return;                                          // the observer fires again with the new height
    }
    this.#size = {w, h};
    this.#fitCanvas();
    if (this.fit === "regenerate") {
      if (!this.#scene) this.#relayout();
      else {                                           // meanwhile the old scene is scaled to cover
        this.#stale = true;
        clearTimeout(this.#timer);
        this.#timer = setTimeout(() => this.#relayout(), 200);
      }
    }
    this.#kick();
  }
  #visible(on) {
    const pb = this.#playback();
    if (on && pb === "in-view") { this.restart(); this.play(); }
    else if (on) this.play();
    else if (this.getAttribute("pause-offscreen") !== "false") this.pause();
  }

  // ---- p5: instance mode, one per element; it owns the canvas, the pixel
  // density and the frame loop, drawScene does the painting
  #start(P5) {
    if (this.#sk || !this.isConnected) return;
    new P5(sk => {
      sk.setup = () => {
        // p5 2.x sets up async: drop an instance whose element left (or was
        // re-started) in the meantime
        if (!this.isConnected || this.#sk) { sk.remove(); return; }
        this.#sk = sk;
        sk.createCanvas(1, 1);
        this.#fitCanvas();
        this.#kick();
        this.dispatchEvent(new CustomEvent("arrowmaze:ready"));
      };
      sk.draw = () => { if (this.#sk === sk) this.#frame(); };   // a removed instance may still draw once
    }, this.shadowRoot.getElementById("box"));
  }
  #fitCanvas() {
    const sk = this.#sk, {w, h} = this.#size;
    if (!sk || !(w > 0 && h > 0)) return;
    const d = Math.min(devicePixelRatio || 1, Math.sqrt(16e6 / (w * h)));   // cap the backing store at ~16 Mpx
    if (Math.abs(sk.pixelDensity() - d) > 1e-3) sk.pixelDensity(d);
    if (sk.width !== Math.ceil(w) || sk.height !== Math.ceil(h)) sk.resizeCanvas(Math.ceil(w), Math.ceil(h));
    this.#last = "";
  }
  #kick() { this.#last = ""; this.#sk?.loop(); }
  #frame() {
    const sk = this.#sk, S = this.#scene;
    if (!S || !(this.#size.w > 0)) { sk.noLoop(); return; }
    const pb = this.#playback(), t = pb === "static" ? null : this.#now();
    // skip frames where no arrow moved (the hold, a finished draw-in)
    const key = frameKey(S, t) + JSON.stringify(this.dragOffset);
    if (key !== this.#last) {
      this.#last = key;
      const ctx = sk.drawingContext, d = sk.pixelDensity();
      const m = this.fit === "regenerate" && !this.#stale ? {s: 1, x: 0, y: 0} : this.#map();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(d * m.s, 0, 0, d * m.s, d * m.x, d * m.y);
      drawScene(ctx, S, t, {drag: this.dragOffset});
      ctx.restore();
    }
    const done = t === null || !this.#clock.run || (!S.timing.loop && t > S.timing.T);
    if (done) sk.noLoop();
  }
}

// source(): this whole runtime as script text, so the tool can write the
// embed file (or inline it) without fetching — fetch fails from file://
const source = () => `// <arrow-maze> runtime — spielwerk arrow-maze.embed.js\n(${runtime})();\n`;
window.ArrowMaze = {DEFS, LAYERS, BLENDS, FIXED, REL, sizeOf, migrate, normalize, entries, marginLimit, layout, drawScene, progress, hitTest, P5_SRC, source};
if (!customElements.get("arrow-maze")) customElements.define("arrow-maze", ArrowMazeElement);
})();
