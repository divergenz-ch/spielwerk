---
satisfies: [R5, R10, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.4 Deliver Switchboard Rust widget state, wiring, and motion

## Description
Implement widget layout/state propagation, cell swaps and wire-flow evaluation in Rust, with browser hit-target/event adapters. Separate portable visual state/time from editor-only widget mutations.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/switchboard.rs`, `src/tools/switchboard.ts`, `tests/generators/switchboard.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/switchboard.rs, src/tools/switchboard.ts, tests/generators/switchboard.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock, src/engine/client.ts, src/main.ts, src/workspace/view.ts, src/workspace/Artboard.svelte, src/workspace/SnapshotsPanel.svelte]

### Approach

- Read the checked fn-1 foundation interfaces and use its dimensions/assets/seed/time and scene/output contracts. Register actual Rust tool computations and the Svelte adapter; prototype JS is not the new engine.
- Adapt the calculation entry points at the required source locations. Bind supported controls/interactions and existing artwork formats, preserving dimension limits and selected responsive preview exports.
- Add focused Rust and browser-adapter fixtures for the tool-specific requirements and boundary cases. Update the shared module registration deliberately; its overlap makes these tasks serial when needed.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/switchboard.html:268`
- `tools/switchboard.html`
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
- [ ] Test every demonstrated widget family using state transitions and linked-state assertions rather than screenshots alone. Drive click and cell-swap targets, verify outside-target behavior, deterministic flow, responsive layouts, and supported SVG motion/PNG/GIF output without exported editing behavior.
- [ ] Actual Rust/Wasm calculations, registered browser adapter, and ordinary supported artwork outputs pass their focused generator gate. Record exact commands/results and commit range.
- [ ] The handoff identifies delivered responsive/time/font capabilities and remaining website-runtime work. It does not mark fn-2 R12 delivered before fn-5.

## Done summary
Switchboard is registered at /#switchboard with Rust/Wasm calculations for all 19 demonstrated widget kinds across buttons, dials, indicators/meters, and form families. Rust owns deterministic identity/layout, state transitions, cycle-safe copy/invert propagation, incoming influence, cell ordering/swaps, wire paths, and explicit-time flow. Browser adapters supply hit targets and release gestures; crossing the drag threshold remains a drag even when returning to its start. Outside-widget clicks, outside-board drops, and cancelled gestures do not mutate widget state.

Fixed and selected responsive artboards use the same evaluated dimensions for ordinary SVG/PNG/GIF artwork. Portable SVG carries declarative wire motion without editor hit-target attributes; PNG is a still frame and GIF samples the motion cycle. Uploaded TTF/OTF labels become baked glyph outlines. Relative decoration resolves against board width. Legacy pixel settings migrate once; snapshot parameters are prepared before merging with current settings so a current rel flag cannot suppress legacy snapshot conversion. Relative limits preserve legacy maxima at supported widths (subject to shared 0.01-percent control precision).

Measured final checks: npm run build passed; npx playwright test tests/generators/switchboard.test.ts tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts passed 17; cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::switchboard passed 5; rustfmt --edition 2021 --check crates/spielwerk-engine/src/tools/switchboard.rs and source git diff --check passed. Logs: .flow/tmp/switchboard-final-{build,browser,rust}.log. Browser checks drive real Svelte controls, clicks, swaps/cancellation and drag-return, uploaded fonts, decoded responsive SVG/PNG/GIF downloads, SMIL-versus-baked instants for every wire style, legacy settings/reloads and imported snapshot loads, and blocked Wasm. Native checks cover every widget kind, state cycles, linked influence, copy/invert/none, deterministic seed/time, all wire styles, permutations, dimensions, invalid fonts/time, and migrated geometry at widths 100/600/8000. Screenshot .flow/tmp/switchboard-preview.png was inspected; browser page-error collection was empty.

Earlier broad Quick commands passed before audit fixes: npm run test:generators passed 22; cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools passed 16. Later fixes were verified with focused commands, not another full run. Initial new adapter test failed before implementation. Drag-return and relative-migration regressions failed before their fixes; the high-geometry/snapshot regression failed before the final corrections. Logs retain those failures separately from final green proof.

Two-axis source-only quality audits ran on openai-codex/gpt-6.1-sol (native runs 3ed2b6f3-d155-4fd1-b1a3-f8282ff5a7fe and 9ed21341-6e20-4a4b-98c4-3a18bada50c8). Correctness found drag-return classification; standards found pixel geometry. Both were corrected. One source-only correctness follow-up (2e701880-270c-4d9c-bf33-7a966a421339) confirmed drag latching and identified clamped legacy geometry. The user approved widening limits and focused save/snapshot regressions; those now pass, including a snapshot-merge issue found by the new browser test. No subsequent clean audit or independent cross-family SHIP is claimed. Nonblocking follow-up: portable SVG generation currently scans the widget output per ID to strip editing attributes; its performance impact was not measured and optimization is outside this change.

Implementation range: 46fa3ede352f5c7ea7a7c8508fd88bc0a8f13314..4fef54087eb8682c4accdac1c21e1bb74f9fe257. User-owned tools/arrow-maze.html and tools/arrow-maze.embed.js remain unchanged by this task and unstaged; AGENTS.md and .pi/ remain untracked. Generated build/test artifacts remain ignored and are not committed. No publication was requested.

Website runtimes, responsive visual-only embed packages, and R12 remain undelivered here and owned by fn-5. No downstream release gate or whole-spec completion is claimed. WOFF/WOFF2 decoding and complex-script shaping are not added.

stage: impl-review - skipped(config: review.backend=none)
stage: plan-sync - skipped(config: planSync.enabled=false)
stage: quality-audit - ran (model: openai-codex/gpt-6.1-sol)
Gates: focused (full suite not requested; named Quick commands ran once before fixes, focused checks after fixes)
## Evidence
- Commits: 1d6d1aa3caecbf19306a1bfa9a2ab0e0f484ae24, a6f30ef9e9f26cb9c5d4e9b076aafc642f32782a, 4fef54087eb8682c4accdac1c21e1bb74f9fe257
- Tests: npm run build (exit 0; .flow/tmp/switchboard-final-build.log), npx playwright test tests/generators/switchboard.test.ts tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts (exit 0; 17 passed; .flow/tmp/switchboard-final-browser.log), cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::switchboard (exit 0; 5 passed; .flow/tmp/switchboard-final-rust.log), npm run test:generators (exit 0; 22 passed before audit fixes; .flow/tmp/switchboard-generators.log), cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools (exit 0; 16 passed before audit fixes; .flow/tmp/switchboard-tools.log), rustfmt --edition 2021 --check crates/spielwerk-engine/src/tools/switchboard.rs; git diff --check -- src crates tests/generators/switchboard.test.ts (exit 0)
- PRs: