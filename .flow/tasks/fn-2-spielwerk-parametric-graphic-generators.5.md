---
satisfies: [R6, R7, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.5 Deliver Truchet Tiles and Imprint primitive-based Rust adapters

## Description
Implement these related primitive-based artwork consumers with separate tile and relief evaluation. Keep their two-format limits; Imprint's supported visual motion remains available for preview and later embed consumption.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/truchet_tiles.rs`, `crates/spielwerk-engine/src/tools/imprint.rs`, `src/tools/truchet-tiles.ts`, `src/tools/imprint.ts`, `tests/generators/truchet-tiles-imprint.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/truchet_tiles.rs, crates/spielwerk-engine/src/tools/imprint.rs, src/tools/truchet-tiles.ts, src/tools/imprint.ts, tests/generators/truchet-tiles-imprint.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock, src/engine/client.ts, src/main.ts]

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
Truchet Tiles and Imprint now open as working tools at `/#truchet-tiles`
and `/#imprint`. Designers can change the supported tile and relief controls,
relayout fixed or responsive artboards, and download SVG or PNG artwork.

Rust/Wasm owns seeded geometry and explicit-time evaluation. Truchet supports
arcs, multiple strands, triangles, diagonals, mixed tiles, turn bias, and two
inks. Imprint supports raised/pressed relief, light angle, shadow, highlight,
halo, companion rays, drift, grow-in, and looping growth. Exported Imprint SVG
retains visual SMIL playback; PNG captures a still evaluated frame. Neither
adapter offers GIF or embed output. Neither tool renders text, so fonts are
not applicable. Fn-5 still owns responsive website runtimes and packaging;
R12 remains undelivered by this task.

Imprint stores stroke, depth, and soften as percentages of artboard width.
Its settings hook migrates legacy pixel values once behind `rel: 1`, including
legacy snapshots prepared before the workspace storage merge. Truchet keeps
its existing grid-relative stroke settings. Existing prototype files and
user-owned Arrow Maze work remain untouched.

Measured baseline was green before edits. `npm run build` passed, the focused
Switchboard Chromium file passed six cases, and the Rust `tools` filter passed
17 cases. Final verification passed `npm run build`, seven cases from
`npx playwright test tests/generators/truchet-tiles-imprint.test.ts`, and 19
cases from `cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::`.
`git diff --check` passed. Gate classification selected executable verification
with exit 1 and `FULL: code/config extension .rs`.

The browser cases cover R6 styles/strands/inks, R7 relief/light/shadow/halo and
all motion modes, deterministic evaluation, changed-aspect relayout, shared
dimension/time rejection, legacy settings and snapshot loads, SVG downloads,
decoded nonempty PNG dimensions, unavailable Wasm, and the two-format limit.
A portable-motion fixture compares transformed SMIL tip positions and growth
offsets with Rust-baked instants. Native fixtures live inside the two new Rust
modules. No existing test or gate was changed.

Final logs and screenshots live in the assigned workspace under `.flow/tmp/`.
Read `task5-final-build.log`, `task5-final-browser.log`,
`task5-final-rust.log`, `task5-gate-classify.log`, and
`task5-chrome-proof.log`. A disposable Python static server served `dist/` to
installed Google Chrome. Both tools rendered without page errors, and the
worker inspected `truchet-tiles-chrome-static.png` and
`imprint-chrome-static.png`. The console recorded static resource 404s, as
shown in the proof log; browser and server processes exited. No performance
or pixel-identical prototype parity is claimed.

During implementation, the first browser run exposed incorrect test selectors,
a floating-point expected-value expression, and a nested SVG animation clock.
The worker corrected selectors and arithmetic and replaced the nested viewport
with a group translation sharing the root SMIL timeline. The motion assertion
also checks transformed coordinates. An initial Cargo invocation supplied two
filters and exited 1 without running tests; subsequent valid commands passed.
These intermediate failures are retained in `task5-verify-browser.log` and
`task5-rust.log` rather than counted as green evidence.

Commit range is
`5801d29968488218546c03a95163bb303e90320b..348cbaa29ae05988a906f210e76c361ada337439`.
Only declared Touches changed. No staged files remain. The pre-existing
untracked `node_modules` link remains untouched. The task stays `in_progress`
for conductor integration, independent review, and lifecycle completion.

Integrated unchanged by fast-forward onto the target branch, retaining original commit IDs. Measured target verification: npm run build passed; npx playwright test tests/generators/truchet-tiles-imprint.test.ts passed 7; cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::truchet_tiles and tools::imprint each passed 1. Target logs: .flow/tmp/task5-integrated-{build,browser,truchet,imprint}.log.

Quality audits: correctness found no actionable findings; standards found one nonblocking Consider about duplicated drift-timeline sampling/serialization constants. Deferred refactor, not an observed defect. Native runs ca9598e9-5f53-4c3f-8f08-3b7953a3d06b and 122de131-8337-4072-bfeb-71811ee0335b both completed on openai-codex/gpt-6.1-sol; source-only audits, not independently executed tests or a cross-family implementation-review receipt. Historical spec-base baseline lacked the later foundation harness; no green historical baseline receipt was claimed. Worker baseline on the actual implementation checkout was green.

stage: impl-review - skipped(config: review.backend=none)
stage: quality-audit - ran (model: openai-codex/gpt-6.1-sol)
stage: wave-join - ran (fast-forward integration; original commit IDs retained)
Gates: focused (full suite not requested)
Tier: session (jev-unavailable(no_key)) (model: gpt-6.1-sol)

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 348cbaa29ae05988a906f210e76c361ada337439
- Tests: npm run build (exit 0; .flow/tmp/task5-integrated-build.log), npx playwright test tests/generators/truchet-tiles-imprint.test.ts (exit 0; 7 passed; .flow/tmp/task5-integrated-browser.log), cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::truchet_tiles (exit 0; 1 passed; .flow/tmp/task5-integrated-truchet.log), cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::imprint (exit 0; 1 passed; .flow/tmp/task5-integrated-imprint.log)
- PRs: