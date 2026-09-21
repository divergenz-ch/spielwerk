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
    resize = null,               // {set(w,h), locked(), enabled?(), min, max}; changes design pixels, not zoom
  }) {
    let mode = zoom === "fit" || typeof zoom === "number" ? zoom : "fit";
    // phones open fit-to-screen whatever percent the desktop session saved —
    // a stored 200% on a 390px screen shows one corner of the artboard
    if (matchMedia("(max-width: 720px)").matches) mode = "fit";
    const target = () => stage.firstElementChild;
    let drag = null, resizeFrame = 0;

    // null = stage not laid out yet, so any fit would be a guess
    function pct() {
      if (drag) return drag.scale * 100;       // never re-fit underneath a moving resize handle
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
      if (!el) { updateHandles(); return; }
      const z = pct();
      // Unmeasurable stage: clear the inline size so CSS still shows the artboard,
      // and keep checking until it can be measured.
      if (z === null) { el.style.width = el.style.height = ""; sync(); updateHandles(); retry(); return; }
      tries = 0;
      const { w, h } = size();
      el.style.width = w * z / 100 + "px";
      el.style.height = h * z / 100 + "px";   // both set — box matches viewBox, no letterbox
      if (drag) {
        // Flex normally recentres the board. During a drag hold the opposite
        // edge still, even when a renderer replaces the entire SVG each frame.
        el.style.translate = "";
        const r = el.getBoundingClientRect();
        const x = drag.rect.left + (drag.dir.includes("w") ? (drag.w - w) * drag.scale : 0);
        const y = drag.rect.top + (drag.dir.includes("n") ? (drag.h - h) * drag.scale : 0);
        el.style.translate = `${x - r.left}px ${y - r.top}px`;
      }
      sync();
      updateHandles();
    }

    function set(v, ax, ay) {                 // ax/ay: stage-relative zoom anchor
      if (drag) return;
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

    // ---------- artboard resize ----------
    // Outside the stage: renderers replace its children, and these controls
    // must never enter an SVG/PNG export or intercept on-canvas editing.
    const overlay = resize && document.body.appendChild(document.createElement("div"));
    const handles = [];
    let outline, dimensions;
    if (overlay) {
      overlay.className = "artboard-resize";
      overlay.style.cssText = "position:fixed;pointer-events:none;overflow:hidden;z-index:1";
      outline = overlay.appendChild(document.createElement("div"));
      outline.style.cssText = "position:absolute;box-sizing:border-box;border:1px solid #3b82f680;pointer-events:none";
      dimensions = overlay.appendChild(document.createElement("output"));
      dimensions.style.cssText = "position:absolute;padding:3px 7px;background:#fff;color:#444;border-radius:4px;font:11px/1.4 system-ui;white-space:nowrap;box-shadow:0 1px 5px #0002";
      dimensions.hidden = true;
      for (const dir of ["n", "e", "s", "w", "nw", "ne", "se", "sw"]) {
        const button = overlay.appendChild(document.createElement("button"));
        const corner = dir.length === 2;
        const cursor = ({n:"ns", s:"ns", e:"ew", w:"ew", nw:"nwse", se:"nwse", ne:"nesw", sw:"nesw"})[dir] + "-resize";
        button.type = "button";
        button.dataset.resize = dir;
        button.setAttribute("aria-label", `Resize artboard ${dir}`);
        button.title = "Drag to resize artboard · Shift keeps proportions · arrow keys nudge";
        button.style.cssText = `position:absolute;pointer-events:auto;touch-action:none;padding:0;margin:0;border:0;background:transparent;cursor:${cursor}`;
        const dot = button.appendChild(document.createElement("span"));
        dot.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${corner ? 7 : 5}px;height:${corner ? 7 : 5}px;border:1px solid #3b82f6;background:white;box-sizing:border-box;pointer-events:none`;
        handles.push({button, dir});
        button.addEventListener("pointerdown", e => {
          if (e.button !== 0 || drag || !canResize()) return;
          e.preventDefault(); e.stopPropagation();
          const rect = target().getBoundingClientRect(), {w, h} = size();
          drag = {id: e.pointerId, button, dir, rect, w, h, scale: rect.width / w,
            x: e.clientX, y: e.clientY, dx: 0, dy: 0, shift: e.shiftKey,
            locked: resize.locked?.() ?? false};
          button.setPointerCapture(e.pointerId);
          dimensions.hidden = false;
          updateHandles();
        });
        button.addEventListener("pointermove", e => {
          if (!drag || e.pointerId !== drag.id) return;
          drag.dx = (e.clientX - drag.x) / drag.scale;
          drag.dy = (e.clientY - drag.y) / drag.scale;
          drag.shift = e.shiftKey;
          if (!resizeFrame) resizeFrame = requestAnimationFrame(flushResize);
        });
        button.addEventListener("pointerup", e => {
          if (drag?.id !== e.pointerId) return;
          drag.dx = (e.clientX - drag.x) / drag.scale;
          drag.dy = (e.clientY - drag.y) / drag.scale;
          drag.shift = e.shiftKey;
          finishResize();
        });
        button.addEventListener("pointercancel", () => finishResize(true));
        button.addEventListener("lostpointercapture", () => finishResize());
        button.addEventListener("keydown", e => {
          const delta = {ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1]}[e.key];
          if (!delta || drag || !canResize()) return;
          e.preventDefault(); e.stopPropagation();
          const step = e.shiftKey ? 10 : 1, {w,h} = size();
          const next = resized(w, h, dir, delta[0] * step, delta[1] * step, resize.locked?.());
          resize.set(next.w, next.h);
          apply();
        });
      }
    }
    function canResize() {
      return resize && target() && (resize.enabled?.() ?? true);
    }
    function updateHandles() {
      if (!overlay) return;
      const r = target()?.getBoundingClientRect(), s = stage.getBoundingClientRect();
      overlay.hidden = !canResize() || !r?.width || !r?.height || !stage.clientWidth || !stage.clientHeight;
      if (overlay.hidden) return;
      Object.assign(overlay.style, {left: s.left + stage.clientLeft + "px", top: s.top + stage.clientTop + "px",
        width: stage.clientWidth + "px", height: stage.clientHeight + "px"});
      const x = r.left - s.left - stage.clientLeft, y = r.top - s.top - stage.clientTop;
      Object.assign(outline.style, {left:x+"px", top:y+"px", width:r.width+"px", height:r.height+"px"});
      for (const {button, dir} of handles) {
        const corner = dir.length === 2, vertical = dir === "w" || dir === "e";
        const width = corner || vertical ? 14 : Math.max(0, r.width - 14);
        const height = corner || !vertical ? 14 : Math.max(0, r.height - 14);
        const cx = x + (dir.includes("w") ? 0 : dir.includes("e") ? r.width : r.width / 2);
        const cy = y + (dir.includes("n") ? 0 : dir.includes("s") ? r.height : r.height / 2);
        Object.assign(button.style, {left:cx-width/2+"px", top:cy-height/2+"px", width:width+"px", height:height+"px"});
      }
      if (drag) {
        const {w,h} = size();
        dimensions.value = `${w} × ${h} px`;
        dimensions.style.left = Math.max(0, Math.min(x, stage.clientWidth - 130)) + "px";
        dimensions.style.top = Math.max(0, Math.min(y + r.height + 10, stage.clientHeight - 26)) + "px";
      }
    }
    function resized(w, h, dir, dx, dy, locked) {
      const horizontal = /[ew]/.test(dir), vertical = /[ns]/.test(dir);
      let nw = w + (horizontal ? dx * (dir.includes("w") ? -1 : 1) : 0);
      let nh = h + (vertical ? dy * (dir.includes("n") ? -1 : 1) : 0);
      const min = resize.min ?? 100, max = resize.max ?? 8000;
      if (locked) {
        const k = !horizontal ? nh/h : !vertical ? nw/w : Math.abs(nw/w-1) > Math.abs(nh/h-1) ? nw/w : nh/h;
        const scale = Math.max(min/w, min/h, Math.min(max/w, max/h, k));
        nw = w * scale; nh = h * scale;
      }
      return {w: Math.round(Math.max(min, Math.min(max, nw))), h: Math.round(Math.max(min, Math.min(max, nh)))};
    }
    function flushResize() {
      cancelAnimationFrame(resizeFrame); resizeFrame = 0;
      if (!drag) return;
      const d = drag, next = resized(d.w, d.h, d.dir, d.dx, d.dy, d.locked || d.shift);
      const current = size();
      if (next.w !== current.w || next.h !== current.h) resize.set(next.w, next.h);
      apply();
    }
    function finishResize(cancel = false) {
      if (!drag) return;
      if (!cancel) flushResize();
      cancelAnimationFrame(resizeFrame); resizeFrame = 0;
      const d = drag; drag = null;
      if (target()) target().style.translate = "";
      dimensions.hidden = true;
      if (d.button.hasPointerCapture(d.id)) d.button.releasePointerCapture(d.id);
      if (cancel) resize.set(d.w, d.h);
      // Restore the user's fit/percent view after releasing the pinned board.
      apply();
    }
    addEventListener("keydown", e => {
      if (e.key === "Escape" && drag) { e.preventDefault(); finishResize(true); }
    });
    addEventListener("blur", () => finishResize());
    stage.addEventListener("scroll", updateHandles, {passive: true});
    addEventListener("resize", updateHandles);

    // re-fit whenever the stage changes size — including 0 → laid out
    new ResizeObserver(() => { if (mode === "fit") apply(); else updateHandles(); }).observe(stage);
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
