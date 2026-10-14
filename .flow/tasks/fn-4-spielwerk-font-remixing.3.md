---
satisfies: [R1, R2, R3]
---
# fn-4-spielwerk-font-remixing.3 Integrate direct text editing and font-remix artwork output

## Description
Deliver Svelte/browser editing and output interaction against both completed Rust transform modes.

**Size:** M
**Files:** `src/tools/font-remixer.ts`, `src/tools/FontTextEditor.svelte`, `tests/fonts/editor.test.ts`, `tests/integration/fonts.spec.ts`
**Touches:** [src/tools/font-remixer.ts, src/tools/FontTextEditor.svelte, tests/fonts/editor.test.ts, tests/integration/fonts.spec.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/src/fonts/mod.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Adapt existing caret/text interaction behavior to the foundation's fixed-board view and text state without moving glyph computation into JavaScript.
- Synchronize panel and artboard editing, glyph metrics/hit layout, and optional original-outline comparison.
- Route SVG/PNG artwork through shared exports and keep caret decoration out of output. Test delayed full-fidelity evaluation with current text edits.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/font-remixer.html:615-685`
- `tools/font-remixer.html:730-749`
- `tools/zoom.js:20-321`
- `tools/export.js:9-101`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

The root Rust registration/manifest/lockfile write surface is shared.
Dispatch these writes serially rather than treating disjoint tool modules
as sufficient evidence for concurrent writers.

## Acceptance
- [ ] Browser tests drive caret placement/navigation, insert/delete, line breaks and paste, and assert panel/artboard text synchronization with actual Rust glyph output.
- [ ] Both transform modes and optional outline comparison produce real SVG/PNG output; caret decorations and GIF capability are excluded.
- [ ] No-font/default-stamp/fixed-board paths and latest full-fidelity text results pass focused editor/artwork tests.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
