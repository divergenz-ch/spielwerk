---
satisfies: [R2, R3, R9, R10, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.2 Deliver Arrow Poster and Arrow Comb through the arrow-path adapter

## Description
Implement the related contour/draw-in arrow-path consumers with their distinct layout profiles. Keep Poster hit-order changes in the workspace and Comb uploaded-font rows in the appropriate embedded/baked output path.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/arrow_poster.rs`, `crates/spielwerk-engine/src/tools/arrow_comb.rs`, `src/tools/arrow-poster.ts`, `src/tools/arrow-comb.ts`, `tests/generators/arrow-poster-arrow-comb.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/arrow_poster.rs, crates/spielwerk-engine/src/tools/arrow_comb.rs, src/tools/arrow-poster.ts, src/tools/arrow-comb.ts, tests/generators/arrow-poster-arrow-comb.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Read the checked fn-1 foundation interfaces and use its dimensions/assets/seed/time and scene/output contracts. Register actual Rust tool computations and the Svelte adapter; prototype JS is not the new engine.
- Adapt the calculation entry points at the required source locations. Bind supported controls/interactions and existing artwork formats, preserving dimension limits and selected responsive preview exports.
- Add focused Rust and browser-adapter fixtures for the tool-specific requirements and boundary cases. Update the shared module registration deliberately; its overlap makes these tasks serial when needed.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-poster.html:269`
- `tools/arrow-comb.html:248-311`
- `tools/fontpick.js:14-53`

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
- [ ] Use separate seeded/profile fixtures and Svelte interaction tests for each tool. Verify Poster raise-on-arrow behavior and outside-target boundary, Comb fan/wave/swirl plus tapered tails/font rows, matching explicit-time evaluation, and supported SVG motion/PNG/GIF output.
- [ ] Actual Rust/Wasm calculations, registered browser adapter, and ordinary supported artwork outputs pass their focused generator gate. Record exact commands/results and commit range.
- [ ] The handoff identifies delivered responsive/time/font capabilities and remaining website-runtime work. It does not mark fn-2 R12 delivered before fn-5.

## Done summary
Delivered Arrow Poster and Arrow Comb as registered Rust/Wasm calculations
with Svelte controls and explicit-time playback. Poster has seeded grid
placement, five shapes, stacked contours, and workspace-only raise-on-arrow
ordering. Comb has fan/wave/swirl bands, nesting/directions, tapered tails,
and optional uploaded-font rows baked into paths.

Both tools adapt to fixed/responsive artboards within 100–8000 px limits and
export animated SVG, selected-time still PNG, and cycle GIF. Shared raster
encoders preserve Arrow Maze outputs. Legacy pixel settings migrate once to
width-relative values; shape/direction selections and unknown saved fields
remain intact. Website runtime/embed delivery and R12 remain fn-5/.7 work.

Measured: native tool tests 8/8; build-backed generator browser tests 13/13;
workspace control tests 4/4. Real SVG playback matched baked Wasm frames
across draw-in/loop, linear/ease-out/snap, and zero/default hold. Browser
checks decoded SVG/PNG/GIF downloads, exercised click/outside-target behavior,
verified font paths, saved-settings migration, no Wasm fallback, screenshots,
and clean browser consoles.

Formatting used the installed stable rustfmt; rustfmt is absent from the
pinned 1.98.0 toolchain. Stable rustfmt check and git diff --check passed.
No separate JavaScript lint/format command is configured.

stage: impl-review - skipped(config: review.backend=none)
stage: completion-review - skipped(policy: other spec tasks remain unfinished)

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 5598cb15a1a99a329698fe481fd9ac571c21909b
- Tests: cargo +1.98.0 test --locked --manifest-path crates/spielwerk-engine/Cargo.toml tools (8 passed), npm run test:generators (13 passed; builds actual Wasm), npx playwright test tests/workspace/controls.test.ts (4 passed), rustfmt +stable --check --edition 2021 --config skip_children=true crates/spielwerk-engine/src/lib.rs crates/spielwerk-engine/src/tools/mod.rs crates/spielwerk-engine/src/tools/arrow_path.rs crates/spielwerk-engine/src/tools/arrow_poster.rs crates/spielwerk-engine/src/tools/arrow_comb.rs (passed), git diff --check (passed)
- PRs: