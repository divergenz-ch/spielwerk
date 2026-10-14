---
satisfies: [R4, R10, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.3 Deliver the Arrow Field Rust layout and workspace pointer adapter

## Description
Implement field geometry/time evaluation behind the shared contract; route preview attraction/repulsion inputs through the workspace adapter without exporting live pointer interaction.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/arrow_field.rs`, `src/tools/arrow-field.ts`, `tests/generators/arrow-field.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/arrow_field.rs, src/tools/arrow-field.ts, tests/generators/arrow-field.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Read the checked fn-1 foundation interfaces and use its dimensions/assets/seed/time and scene/output contracts. Register actual Rust tool computations and the Svelte adapter; prototype JS is not the new engine.
- Adapt the calculation entry points at the required source locations. Bind supported controls/interactions and existing artwork formats, preserving dimension limits and selected responsive preview exports.
- Add focused Rust and browser-adapter fixtures for the tool-specific requirements and boundary cases. Update the shared module registration deliberately; its overlap makes these tasks serial when needed.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-field.html:212`
- `tools/arrow-field.html`
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
- [ ] Fixture-test noise/swirl/radial/grid arrangements, rotation and deterministic seed/time inputs. Drive pointer attraction/repulsion in the workspace, then assert exported scenes do not require pointer input. Verify responsive layouts and supported SVG motion/PNG/GIF outputs.
- [ ] Actual Rust/Wasm calculations, registered browser adapter, and ordinary supported artwork outputs pass their focused generator gate. Record exact commands/results and commit range.
- [ ] The handoff identifies delivered responsive/time/font capabilities and remaining website-runtime work. It does not mark fn-2 R12 delivered before fn-5.

## Done summary
Arrow Field is delivered at `/#arrow-field` with actual Rust/Wasm noise,
swirl, radial, and grid geometry, seeded jitter and two-ink selection,
snapped directions, solid/line arrow geometry, and deterministic rotation.
Svelte controls route attraction and repulsion through transient workspace
pointer state. Saved composition parameters own seed, dimensions, and motion;
portable adapter evaluation never receives live pointer input. Fixed and
responsive artboards relayout square cells at selected container dimensions.
SVG retains supported rotation motion; PNG is the evaluated still frame;
GIF samples the motion cycle at selected output settings. Arrow Field does
not use text or fonts. Website playback/packaging belongs to fn-5; R12 and
final catalog acceptance remain undelivered. The parent spec stays open.

Measured: `npm run test:generators` passed 18 browser cases, including four
Arrow Field cases. `cargo +1.98.0 test --locked --manifest-path
crates/spielwerk-engine/Cargo.toml tools` passed 12 native cases, including
three Arrow Field fixtures. `npx playwright test
tests/generators/arrow-poster-arrow-comb.test.ts
tests/workspace/controls.test.ts tests/workspace/exports.test.ts` passed 19
focused consumer cases. Browser checks drive the real workspace pointer,
controls, and playback, compare exported SMIL transforms with explicit-time
Wasm frames, decode responsive PNG/GIF dimensions and frame changes, reject
invalid dimensions/time, and verify no JS fallback when Wasm fails. The
cheap pre-implementation test failed because the adapter did not exist.
Logs: `.flow/tmp/field-red.log`, `field-generators.log`, `field-tools.log`,
`field-consumers.log`, and `field-gif-fix.log`. Production build passed.

Two fresh-context quality audits reported correctness 0 findings and
standards 1 Consider finding (repeated GIF-test pixel allocation). Fixed that
allocation in da8fd38 without changing assertions; the focused workspace
pointer/export test passed again (1 case). Verbatim axis reports and finding
disposition are in `.flow/tmp/field-quality-audit.md`; terminal native
workflow receipt 7e26a3ec-0bb8-4a1c-a951-9e92d9024072 verifies both auditors
ran on openai-codex/gpt-6.1-sol. These are quality audits, not independent
cross-family host implementation review. No audit tests were claimed as run.
Rust formatting passed with installed stable rustfmt; pinned 1.98.0 lacks
the rustfmt component. `git diff --check` passed. No separate repository
lint/format npm scripts exist. Full repository suite was not requested.
Implementation range: 657305132f67884a75246dcf10f2e3be1df3a530..da8fd38d07158d046b2fa6c55044f9dd3ab548d2.
User-owned Arrow Maze edits and untracked .pi/ and AGENTS.md remain untouched.

stage: impl-review - skipped(config: review.backend=none)
stage: plan-sync - skipped(config: planSync.enabled=false)
stage: completion-review - skipped(policy: single-task invocation, parent spec has unfinished tasks)
stage: quality-audit-correctness - ran (model: openai-codex/gpt-6.1-sol)
stage: quality-audit-standards - ran (model: openai-codex/gpt-6.1-sol)
## Evidence
- Commits: ca4f8577b2619d57d9241cbe78629aa6fa0cb19a, da8fd38d07158d046b2fa6c55044f9dd3ab548d2
- Tests: npm run test:generators (18 passed), cargo +1.98.0 test --locked --manifest-path crates/spielwerk-engine/Cargo.toml tools (12 passed), npx playwright test tests/generators/arrow-poster-arrow-comb.test.ts tests/workspace/controls.test.ts tests/workspace/exports.test.ts (19 passed), npx playwright test tests/generators/arrow-field.test.ts -g 'workspace pointer' (1 passed after allocation fix), rustfmt +stable --edition 2021 --check crates/spielwerk-engine/src/tools/arrow_field.rs (passed)
- PRs: