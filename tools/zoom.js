// Shared artboard viewport for Spielwerk tools. Classic script → window.createZoom.
// Scales whatever element sits in the stage (an <svg> or a <canvas>), and adds
// Adobe-style navigation: fit/percent zoom, ⌘±, ⌘0/⌘1, space-drag pan, ⌘-wheel.
// Touch: one finger pans, two fingers pinch-zoom and pan. A tool that wants the
// finger for itself (dragging a widget, steering a field) calls preventDefault()
// on its own stage pointerdown — the pan listener sits on document and yields.
//
// The stage may have no layout yet when a tool first renders — a background tab,
// a hidden panel, a restored session. A stage with no content width measures 64
// (its padding alone), so the old fit maths gave (64 - 64) / w = 0 and baked
// "0px" into the artboard: invisible until some later render happened to run.
//
// Three guards, because no single one covers every case:
//   1. never write a size we cannot measure — clear it and let CSS show something
//   2. ResizeObserver — catches most 0 → laid out transitions
//   3. rAF retry — RO does not reliably fire for a stage revealed inside a
//      resized iframe, and rAF is paused in a hidden tab, so it costs nothing
//      there and resumes the instant the tab is shown
(() => {
  function createZoom({
    stage,                       // scrolling container
    select,                      // optional <select> with "fit" + percent options
    size,                        // () => ({w, h}) artboard pixels
    pad = 64,                    // breathing room around the artboard when fitting
    zoom = "fit",                // "fit" | percent
    max = 1,                     // fit never scales past this (1 = no upscaling)
    onChange = () => {},         // persist the new zoom
  }) {
    let mode = zoom === "fit" || typeof zoom === "number" ? zoom : "fit";
    // phones open fit-to-screen whatever percent the desktop session saved —
    // a stored 200% on a 390px screen shows one corner of the artboard
    if (matchMedia("(max-width: 720px)").matches) mode = "fit";
    const target = () => stage.firstElementChild;

    // null = stage not laid out yet, so any fit would be a guess
    function pct() {
      if (mode !== "fit") return mode;
      const { w, h } = size();
      const aw = stage.clientWidth - pad, ah = stage.clientHeight - pad;
      if (!(aw > 0 && ah > 0 && w > 0 && h > 0)) return null;
      return Math.min(aw / w, ah / h, max) * 100;
    }

    function sync() {
      if (!select) return;
      if (mode === "fit") { select.value = "fit"; return; }
      const label = Math.round(mode) + "%";
      let opt = [...select.options].find(o => o.value === label);
      if (!opt) {
        opt = select.querySelector(".custom")
          || select.appendChild(Object.assign(new Option(), { className: "custom" }));
        opt.textContent = opt.value = label;
      }
      select.value = label;
    }

    // A stage inside a freshly resized iframe does not reliably deliver a
    // ResizeObserver notification, so waiting on RO alone can strand the artboard
    // at zero. Retry on animation frames until it measures: rAF is paused in a
    // hidden tab, so this costs nothing there and resumes the instant it is shown.
    let queued = false, tries = 0;
    function retry() {
      if (queued || tries++ > 600) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; apply(); });
    }

    function apply() {
      const el = target();
      if (!el) return;
      const z = pct();
      // Unmeasurable stage: clear the inline size so CSS still shows the artboard,
      // and keep checking until it can be measured.
      if (z === null) { el.style.width = el.style.height = ""; sync(); retry(); return; }
      tries = 0;
      const { w, h } = size();
      el.style.width = w * z / 100 + "px";
      el.style.height = h * z / 100 + "px";   // both set — box matches viewBox, no letterbox
      sync();
    }

    function set(v, ax, ay) {                 // ax/ay: stage-relative zoom anchor
      const old = pct();
      mode = v === "fit" ? "fit" : Math.max(2, Math.min(800, v));
      onChange(mode);
      const r = stage.getBoundingClientRect();
      ax ??= r.width / 2; ay ??= r.height / 2;
      const cx = stage.scrollLeft + ax, cy = stage.scrollTop + ay;
      apply();
      const now = pct();
      if (old && now) {                       // keep the anchor point stationary
        const k = now / old;
        stage.scrollLeft = cx * k - ax;
        stage.scrollTop = cy * k - ay;
      }
    }

    // re-fit whenever the stage changes size — including 0 → laid out
    new ResizeObserver(() => { if (mode === "fit") apply(); }).observe(stage);
    select?.addEventListener("input", () =>
      set(select.value === "fit" ? "fit" : parseFloat(select.value)));

    // ---------- adobe-style navigation ----------
    let space = false;
    const typing = e => /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
    addEventListener("keydown", e => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.code === "Space" && !typing(e)) { space = true; stage.style.cursor = "grab"; e.preventDefault(); }
      else if (mod && (e.key === "+" || e.key === "=")) { e.preventDefault(); set((pct() ?? 100) * 1.25); }
      else if (mod && e.key === "-") { e.preventDefault(); set((pct() ?? 100) / 1.25); }
      else if (mod && e.key === "0") { e.preventDefault(); set("fit"); }
      else if (mod && e.key === "1") { e.preventDefault(); set(100); }
    });
    addEventListener("keyup", e => { if (e.code === "Space") { space = false; stage.style.cursor = ""; } });

    stage.addEventListener("pointerdown", e => {           // space + drag = pan
      if (!space) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, sl = stage.scrollLeft, st = stage.scrollTop;
      stage.style.cursor = "grabbing";
      const move = ev => { stage.scrollLeft = sl - (ev.clientX - sx); stage.scrollTop = st - (ev.clientY - sy); };
      stage.setPointerCapture(e.pointerId);
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerup", () => {
        stage.removeEventListener("pointermove", move);
        stage.style.cursor = space ? "grab" : "";
      }, { once: true });
    });

    stage.addEventListener("wheel", e => {                 // ⌘/ctrl/alt + wheel = zoom to cursor
      if (!(e.ctrlKey || e.metaKey || e.altKey)) return;   // plain wheel = scroll
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      set((pct() ?? 100) * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    // ---------- touch: one finger pans, two fingers pinch + pan ----------
    stage.style.touchAction = "none";                    // the stage owns its touches, no native scroll/zoom
    const fingers = new Map();                           // pointerId → {x, y}
    let pinch = null;                                    // {dist, pct} at gesture start
    const centre = () => { const [a, b] = [...fingers.values()]; return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y)}; };
    document.addEventListener("pointerdown", e => {
      if (e.pointerType !== "touch" || !stage.contains(e.target) || e.defaultPrevented) return;
      fingers.set(e.pointerId, {x: e.clientX, y: e.clientY});
      stage.setPointerCapture(e.pointerId);
      pinch = null;
    });
    document.addEventListener("pointermove", e => {
      const f = fingers.get(e.pointerId);
      if (!f) return;
      if (fingers.size === 1) {                          // pan
        stage.scrollLeft -= e.clientX - f.x; stage.scrollTop -= e.clientY - f.y;
      } else if (fingers.size === 2) {                   // pinch about the midpoint, and pan with it
        const before = centre();
        f.x = e.clientX; f.y = e.clientY;
        const after = centre();
        if (!pinch) pinch = {dist: before.d, pct: pct() ?? 100};
        const r = stage.getBoundingClientRect();
        set(pinch.pct * after.d / pinch.dist, after.x - r.left, after.y - r.top);
        stage.scrollLeft -= after.x - before.x; stage.scrollTop -= after.y - before.y;
        return;
      }
      f.x = e.clientX; f.y = e.clientY;
    });
    const lift = e => { fingers.delete(e.pointerId); pinch = null; };
    document.addEventListener("pointerup", lift);
    document.addEventListener("pointercancel", lift);

    apply();
    return { apply, set, pct, get mode() { return mode; }, get panning() { return space; } };
  }

  window.createZoom = createZoom;
})();
