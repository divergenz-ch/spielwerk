---
satisfies: [R6, R7, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.5 Deliver Truchet Tiles and Imprint primitive-based Rust adapters

## Description
Implement these related primitive-based artwork consumers with separate tile and relief evaluation. Keep their two-format limits; Imprint's supported visual motion remains available for preview and later embed consumption.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/truchet_tiles.rs`, `crates/spielwerk-engine/src/tools/imprint.rs`, `src/tools/truchet-tiles.ts`, `src/tools/imprint.ts`, `tests/generators/truchet-tiles-imprint.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/truchet_tiles.rs, crates/spielwerk-engine/src/tools/imprint.rs, src/tools/truchet-tiles.ts, src/tools/imprint.ts, tests/generators/truchet-tiles-imprint.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Read the checked fn-1 foundation interfaces and use its dimensions/assets/seed/time and scene/output contracts. Register actual Rust tool computations and the Svelte adapter; prototype JS is not the new engine.
- Adapt the calculation entry points at the required source locations. Bind supported controls/interactions and existing artwork formats, preserving dimension limits and selected responsive preview exports.
- Add focused Rust and browser-adapter fixtures for the tool-specific requirements and boundary cases. Update the shared module registration deliberately; its overlap makes these tasks serial when needed.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/truchet-tiles.html:194`
- `tools/imprint.html:209`
- `tools/export.js:9-101`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

### Milestone gate

The first checked generator proves the concrete adapter; same-spec deps
apply. Shared Rust module registration and any lockfile/generated outputs
prevent concurrent overlapping writers even within a potential wave.

The root Rust registration/manifest/lockfile write surface is shared.
Dispatch these writes serially rather than treating disjoint tool modules
as sufficient evidence for concurrent writers.

## Acceptance
- [ ] Test Truchet arc/triangle/diagonal/mixed, strand/two-ink fixtures and Imprint raised/pressed light/shadow/halo/growth/drift fixtures. Assert deterministic evaluation and composition relayout for changed aspect sizes. Export SVG/PNG; assert GIF is not offered.
- [ ] Actual Rust/Wasm calculations, registered browser adapter, and ordinary supported artwork outputs pass their focused generator gate. Record exact commands/results and commit range.
- [ ] The handoff identifies delivered responsive/time/font capabilities and remaining website-runtime work. It does not mark fn-2 R12 delivered before fn-5.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
